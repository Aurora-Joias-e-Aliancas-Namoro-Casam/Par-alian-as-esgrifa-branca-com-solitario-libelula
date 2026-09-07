/**
 * SYNC.JS — Sincronização na nuvem (Supabase Storage).
 * Envia/baixa o backup (.zip) de um bucket público para que o link
 * "Compartilhar" funcione em outro aparelho. Configuração e limites de
 * segurança: ver CONTEXTO-PROJETO.md.
 */

const SUPABASE_URL = 'https://mdiohswwximmsggmrzue.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kaW9oc3d3eGltbXNnZ21yenVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNTYzNjgsImV4cCI6MjA5ODczMjM2OH0.maRn6Wax6uIEyVo8ETXxOGQ5Mi61B6rafl7CCC1fGcs';
const SUPABASE_BUCKET = 'aurora-backups';

function syncEstaConfigurado() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// Hora "confiável" (cabeçalho HTTP Date) para checagens que não podem
// depender do relógio do aparelho (ex.: desbloqueio da cápsula do tempo).
// Sem internet, cai de volta pro relógio local.
async function obterHoraConfiavel() {
    if (!syncEstaConfigurado()) return new Date();
    try {
        const cabecalhoData = await requisicaoNuvem(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/`, {
            method: 'HEAD',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        }, async resposta => resposta.headers.get('date'), 8000);
        if (cabecalhoData) {
            const dataServidor = new Date(cabecalhoData);
            if (!isNaN(dataServidor.getTime())) return dataServidor;
        }
    } catch (e) {
        console.warn('Não consegui confirmar a hora do servidor (sem internet?) — usando o relógio do aparelho como alternativa.', e);
    }
    return new Date();
}

// Confere se a chave "parece" um JWT anon do Supabase (3 partes, começa com "eyJ").
function validarFormatoAnonKey(chave) {
    if (!chave) return { ok: false, motivo: 'Chave vazia.' };
    const partes = chave.trim().split('.');
    if (partes.length !== 3) return { ok: false, motivo: 'Não parece um JWT válido (deveria ter 3 partes separadas por ponto).' };
    if (!chave.startsWith('eyJ')) return { ok: false, motivo: 'Chaves do Supabase começam com "eyJ". Confira se copiou a chave inteira.' };
    try {
        const payload = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.role === 'service_role') return { ok: false, motivo: 'Esta é a chave "service_role" (secreta) — use a chave "anon public".' };
        if (payload.role && payload.role !== 'anon') return { ok: false, motivo: `Papel inesperado na chave: "${payload.role}".` };
        return { ok: true, motivo: `Formato ok (papel: ${payload.role || 'desconhecido'}).` };
    } catch (e) {
        return { ok: false, motivo: 'Não foi possível decodificar a chave — confira se ela foi colada por inteiro.' };
    }
}

// Envia o backup (.zip) para o bucket e confirma uma revisão monotônica
// no ".meta.json" sem depender do relógio do aparelho.

// O upload padrão do Storage é mais confiável para arquivos pequenos. Mantemos
// cada parte abaixo de 6 MB; backups maiores continuam sendo divididos.
const TAMANHO_MAXIMO_PARTE_BYTES = 5 * 1024 * 1024;
const AVISO_QUOTA_TOTAL_BYTES = 900 * 1024 * 1024; // aviso perto do 1GB de quota total

const POLONI_RETENCAO_GERACOES = 5;

// Inclui a leitura do corpo no prazo, não apenas a chegada dos cabeçalhos.
async function requisicaoNuvem(url, opcoes, consumir, prazo = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), prazo);
    try {
        const resposta = await fetch(url, { ...opcoes, signal: controller.signal });
        return await consumir(resposta);
    } catch (erro) {
        if (controller.signal.aborted) throw new Error('A conexão com a nuvem demorou demais. O envio continua pendente neste aparelho.');
        throw erro;
    } finally { clearTimeout(timer); }
}

// Separa o manifesto textual do prefixo binário sem mudar o formato ZIP.
// Leitores antigos e o backup externo continuam remontando o mesmo arquivo.
async function dividirBackupIncremental(blob) {
    const final = new Uint8Array(await blob.slice(Math.max(0, blob.size - 65557)).arrayBuffer());
    const view = new DataView(final.buffer);
    let inicioManifest = 0;
    for (let i = final.length - 22; i >= 0; i--) {
        if (view.getUint32(i, true) !== 0x06054b50 || i + 22 + view.getUint16(i + 20, true) !== final.length) continue;
        const tamanho = view.getUint32(i + 12, true);
        const inicio = view.getUint32(i + 16, true);
        if (inicio + tamanho > blob.size || tamanho > 16 * 1024 * 1024) break;
        const central = new Uint8Array(await blob.slice(inicio, inicio + tamanho).arrayBuffer());
        const dados = new DataView(central.buffer);
        for (let p = 0; p + 46 <= central.length;) {
            if (dados.getUint32(p, true) !== 0x02014b50) break;
            const n = dados.getUint16(p + 28, true);
            if (new TextDecoder().decode(central.slice(p + 46, p + 46 + n)) === 'manifest.json') {
                inicioManifest = dados.getUint32(p + 42, true);
                break;
            }
            p += 46 + n + dados.getUint16(p + 30, true) + dados.getUint16(p + 32, true);
        }
        break;
    }
    const partes = [];
    const limites = inicioManifest > 0 && inicioManifest < blob.size ? [0, inicioManifest, blob.size] : [0, blob.size];
    for (let intervalo = 1; intervalo < limites.length; intervalo++) {
        for (let inicio = limites[intervalo - 1]; inicio < limites[intervalo]; inicio += TAMANHO_MAXIMO_PARTE_BYTES) {
            partes.push(blob.slice(inicio, Math.min(inicio + TAMANHO_MAXIMO_PARTE_BYTES, limites[intervalo])));
        }
    }
    return partes;
}

async function geracaoJaAplicada(codigo, meta) {
    if (!meta?.geracaoAtual?.id) return false;
    return (await obterConfiguracao('aurora_sync_geracao')) === `${codigo}:${meta.geracaoAtual.id}`;
}

async function registrarGeracaoAplicada(codigo, meta) {
    await salvarConfiguracao('aurora_sync_revision', String(Number(meta.revisao) || 0), false, false);
    await salvarConfiguracao('aurora_sync_geracao', `${codigo}:${meta.geracaoAtual?.id || ''}`, false, false);
}

// Compatibilidade com o formato remoto antigo.
function caminhoParteZip(codigo, indice, totalPartes) {
    return totalPartes <= 1 ? `${codigo}.zip` : `${codigo}.zip.parte${indice}`;
}

function caminhoPublico(objeto) {
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${objeto}`;
}

function caminhoEscrita(objeto) {
    return `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${objeto}`;
}

async function enviarObjetoNuvem(objeto, corpo, contentType, upsert = false) {
    await requisicaoNuvem(caminhoEscrita(objeto), {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': contentType,
            'x-upsert': upsert ? 'true' : 'false'
        },
        body: corpo
    }, async resposta => {
        if (!resposta.ok) {
            const erro = new Error(`Falha ao gravar na nuvem (HTTP ${resposta.status}). Os dados locais foram mantidos.`);
            erro.status = resposta.status;
            throw erro;
        }
    }, 120000);
}

async function confirmarObjetoNuvem(objeto, tamanhoEsperado, hashEsperado = null) {
    let ultimoErro;
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
        try {
            const blob = await requisicaoNuvem(caminhoPublico(objeto), { cache: tentativa === 1 ? 'default' : 'reload' }, async resposta => {
                if (!resposta.ok) throw new Error(`Não foi possível confirmar a parte remota (${resposta.status}).`);
                return resposta.blob();
            }, 120000);
            if (blob.size !== tamanhoEsperado) throw new Error(`Parte remota incompleta: esperado ${tamanhoEsperado}, recebido ${blob.size}.`);
            if (hashEsperado && await sha256BlobSeguro(blob) !== hashEsperado) throw new Error('O conteúdo confirmado na nuvem não confere. A versão anterior foi mantida.');
            return true;
        } catch (e) {
            ultimoErro = e;
            if (tentativa < 3) await new Promise(resolve => setTimeout(resolve, tentativa * 500));
        }
    }
    throw ultimoErro;
}

async function lerManifestBackup(blob) {
    const zip = await JSZip.loadAsync(await blob.arrayBuffer(), { checkCRC32: true });
    const arquivo = zip.file('manifest.json');
    if (!arquivo) throw new Error('Backup gerado sem manifest.json.');
    return JSON.parse(await arquivo.async('string'));
}

/**
 * Backups acima de 5MB são divididos em partes menores, remontadas
 * automaticamente ao baixar
 * (ver buscarBackupZipDaNuvem). O meta.json guarda quantas partes existem.
 *
 * Importante: isso mantém cada upload no intervalo recomendado para o modo
 * padrão, mas não aumenta o espaço TOTAL disponível — o plano gratuito do
 * Supabase continua tendo 1GB no total, somando tudo (por isso ainda existe
 * um aviso separado se
 * o backup sozinho já estiver perto disso). Se esse for o caso, vale
 * considerar o YouTube pro vídeo do pedido (sai da conta do backup) ou o
 * plano pago do Supabase.
 */
async function publicarBackupNaNuvem(codigo, lockPublicacao = null) {
    // Preservation-first: antes de gerar qualquer upload, incorpora a geração
    // remota atual ao banco local. Assim um celular desatualizado nunca remove
    // a foto que outro celular adicionou.
    const metaInicial = await buscarMetaDaNuvem(codigo);
    if (metaInicial && !metaInicial.resetado && !(await geracaoJaAplicada(codigo, metaInicial))) {
        const remoto = await buscarBackupZipDaNuvem(codigo, metaInicial.partes, metaInicial);
        if (remoto) {
            await aplicarBackupDeZip(remoto);
            await registrarGeracaoAplicada(codigo, metaInicial);
        }
    }

    const zipBlob = await gerarBackupZipBlob();
    const manifest = await lerManifestBackup(zipBlob);
    const stats = manifest.estatisticas || { configuracoes: 0, medias: (manifest.medias || []).length, bytesMidia: 0 };

    // Defesa programática contra regressão: um estado anormalmente menor não
    // substitui automaticamente uma geração comprovadamente rica.
    const statsRemoto = metaInicial && metaInicial.estatisticas;
    if (statsRemoto && ((statsRemoto.medias > 0 && stats.medias < statsRemoto.medias) ||
        (statsRemoto.bytesMidia > 0 && stats.bytesMidia < statsRemoto.bytesMidia * 0.85))) {
        const erro = new Error('Upload bloqueado: o estado local ficou anormalmente menor que o backup remoto.');
        await registrarDiagnosticoSeguro('sync.bloqueio_backup_menor', erro, { local: stats, remoto: statsRemoto });
        throw erro;
    }

    if (zipBlob.size > AVISO_QUOTA_TOTAL_BYTES) {
        const tamanhoMB = (zipBlob.size / (1024 * 1024)).toFixed(0);
        throw new Error(`O backup ficou com ${tamanhoMB}MB — perto do espaço TOTAL de 1GB do plano gratuito da nuvem (dividir em partes não resolve isso, é um limite de espaço, não de tamanho por arquivo). Baixe uma cópia manual ("Backup da Nossa História", na página final) para não perder nada.`);
    }

    const partesLocais = await dividirBackupIncremental(zipBlob);
    const totalPartes = partesLocais.length;
    const geracaoId = `${Date.now().toString(36)}-${gerarIdUnico('g').slice(-10)}`;
    const baseGeracao = `${codigo}/geracoes/${geracaoId}`;
    const partesMeta = [];
    let diarioPartes = [];
    try { diarioPartes = JSON.parse(await obterConfiguracao(`aurora_sync_upload_${codigo}`) || '[]'); } catch (_) { /* diário é apenas otimização */ }
    if (!Array.isArray(diarioPartes)) diarioPartes = [];
    const conhecidas = new Map([...diarioPartes, ...(metaInicial?.geracaoAtual?.partes || [])]
        .filter(parte => parte.sha256 && parte.objeto.startsWith(`${codigo}/geracoes/`))
        .map(parte => [`${parte.sha256}:${parte.tamanho}`, parte]));

    for (let i = 0; i < totalPartes; i++) {
        const parte = partesLocais[i];
        atualizarEstadoSincronizacao('enviando', `Salvando na nuvem: parte ${i + 1} de ${totalPartes}`);
        const hashParte = await sha256BlobSeguro(parte);
        const conhecida = hashParte && conhecidas.get(`${hashParte}:${parte.size}`);
        if (conhecida) {
            // Revalida a existência, sem baixar novamente os megabytes já confirmados.
            const existe = await requisicaoNuvem(caminhoPublico(conhecida.objeto), { method: 'HEAD', cache: 'no-store' }, async resposta =>
                resposta.ok && Number(resposta.headers.get('content-length')) === parte.size);
            if (existe) { partesMeta.push(conhecida); continue; }
        }

        const objeto = `${baseGeracao}/parte-${String(i).padStart(3, '0')}.zip`;
        await enviarObjetoNuvem(objeto, parte, 'application/zip', false);
        await confirmarObjetoNuvem(objeto, parte.size, hashParte);
        const confirmada = { objeto, tamanho: parte.size, sha256: hashParte };
        partesMeta.push(confirmada);
        // Persiste somente partes relidas e verificadas. Após uma interrupção,
        // o próximo envio retoma sem repetir as partes já concluídas.
        diarioPartes = [...diarioPartes.filter(p => p.sha256 !== hashParte), confirmada].slice(-256);
        await salvarConfiguracao(`aurora_sync_upload_${codigo}`, JSON.stringify(diarioPartes), false, false);
    }

    const hashZip = await sha256BlobSeguro(zipBlob);
    const revisaoBase = Number(metaInicial && metaInicial.revisao) || 0;
    const geracao = { id: geracaoId, revisao: revisaoBase + 1, criadoEm: new Date().toISOString(), tamanho: zipBlob.size, sha256: hashZip, partes: partesMeta, estatisticas: stats };
    await enviarObjetoNuvem(`${baseGeracao}/manifest.json`, JSON.stringify(geracao), 'application/json', false);

    // Rechecagem otimista imediatamente antes do commit do ponteiro. Se outro
    // aparelho publicou enquanto este enviava, aborta; a geração anterior e a
    // concorrente continuam intactas, e a próxima tentativa mescla as duas.
    const metaAntesCommit = await buscarMetaDaNuvem(codigo);
    const revisaoAgora = Number(metaAntesCommit && metaAntesCommit.revisao) || 0;
    if (revisaoAgora !== revisaoBase) {
        const erro = new Error('Outro aparelho sincronizou ao mesmo tempo. A tentativa será refeita sem sobrescrever a outra geração.');
        await registrarDiagnosticoSeguro('sync.conflito_publicacao', erro, { revisaoBase, revisaoAgora });
        throw erro;
    }
    if (lockPublicacao) {
        const lockAtual = await lerLockPublicacao(lockPublicacao.objeto);
        if (!lockAtual || lockAtual.token !== lockPublicacao.token) {
            throw new Error('Outro aparelho assumiu a publicação antes do commit. A geração enviada foi preservada e será mesclada na nova tentativa.');
        }
    }

    const historicoAnterior = Array.isArray(metaInicial && metaInicial.historico) ? metaInicial.historico : [];
    const historico = [geracao, ...(metaInicial && metaInicial.geracaoAtual ? [metaInicial.geracaoAtual] : []), ...historicoAnterior]
        .filter((g, i, lista) => g && g.id && lista.findIndex(x => x.id === g.id) === i)
        .slice(0, POLONI_RETENCAO_GERACOES);
    const metaNovo = { formato: 2, revisao: geracao.revisao, geracaoAtual: geracao, historico, estatisticas: stats, atualizadoEm: Date.now(), partes: totalPartes, resetado: false };
    await enviarObjetoNuvem(`${codigo}-meta.json`, JSON.stringify(metaNovo), 'application/json', true);
    let metaConfirmado = null;
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
        metaConfirmado = await buscarMetaDaNuvem(codigo);
        if (Number(metaConfirmado && metaConfirmado.revisao) === geracao.revisao && metaConfirmado?.geracaoAtual?.id === geracao.id) break;
        if (tentativa < 3) await new Promise(resolve => setTimeout(resolve, tentativa * 500));
    }
    if (Number(metaConfirmado && metaConfirmado.revisao) !== geracao.revisao || metaConfirmado?.geracaoAtual?.id !== geracao.id) {
        throw new Error('A geração foi enviada, mas o ponteiro remoto não pôde ser confirmado. Os dados locais continuam marcados para nova tentativa.');
    }
    await registrarGeracaoAplicada(codigo, metaNovo);
    await salvarConfiguracao(`aurora_sync_upload_${codigo}`, '[]', false, false);
    return metaNovo;
}

/** Baixa o backup (.zip) de um código de compartilhamento e aplica no aparelho atual. */
async function importarBackupDaNuvem(codigo) {
    const meta = await buscarMetaDaNuvem(codigo);
    const zipDados = await buscarBackupZipDaNuvem(codigo, meta ? meta.partes : 1, meta);
    if (!zipDados) throw new Error('Não foi possível localizar essa experiência.');
    await aplicarBackupDeZip(zipDados);
}

/** Baixa só o arquivo pequeno de metadados (revisão + geração atual) de um código. Retorna `null` se não existir (404). */
async function buscarMetaDaNuvem(codigo) {
    // "?t=" muda a cada chamada de propósito: as URLs "públicas" do Supabase
    // Storage passam por um CDN, e "cache: no-store" só evita o cache do
    // NAVEGADOR — não evita o cache do CDN na frente do bucket. Sem isso, um
    // aparelho podia continuar recebendo uma resposta antiga (inclusive um
    // 404 já superado) por um tempo depois de algo mudar de verdade.
    const url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${codigo}-meta.json?t=${Date.now()}`;
    return requisicaoNuvem(url, { cache: 'no-store' }, async resposta => {
        if (resposta.status === 404) return null;
        if (!resposta.ok) throw new Error(`Falha ao consultar a nuvem (${resposta.status})`);
        return resposta.json();
    });
}

/**
 * Baixa o .zip completo (ArrayBuffer) de um código. Se o backup foi
 * dividido em várias partes (ver publicarBackupNaNuvem), baixa cada uma e
 * remonta na ordem certa antes de devolver. Retorna `null` se não existir
 * (404) — inclusive se alguma parte estiver faltando, pra nunca aplicar
 * um backup incompleto/corrompido.
 */
async function buscarBackupZipDaNuvem(codigo, totalPartes, meta = null) {
    if (meta && meta.geracaoAtual && Array.isArray(meta.geracaoAtual.partes)) {
        const buffers = [];
        for (const parte of meta.geracaoAtual.partes) {
            atualizarProgressoEntrada('Buscando novidades', buffers.length, meta.geracaoAtual.partes.length);
            const buffer = await requisicaoNuvem(caminhoPublico(parte.objeto), { cache: 'default' }, async resposta => {
                if (!resposta.ok) throw new Error(`Geração remota incompleta (${resposta.status}).`);
                return resposta.arrayBuffer();
            }, 120000);
            if (parte.tamanho && buffer.byteLength !== parte.tamanho) throw new Error('Geração remota truncada; dados locais foram preservados.');
            if (parte.sha256 && await sha256BlobSeguro(new Blob([buffer])) !== parte.sha256) throw new Error('Checksum da parte remota não confere.');
            buffers.push(buffer);
        }
        atualizarProgressoEntrada('Conferindo as lembranças baixadas', buffers.length, buffers.length);
        const tamanhoTotal = buffers.reduce((soma, b) => soma + b.byteLength, 0);
        const combinado = new Uint8Array(tamanhoTotal);
        let offset = 0;
        for (const b of buffers) { combinado.set(new Uint8Array(b), offset); offset += b.byteLength; }
        if (meta.geracaoAtual.sha256) {
            const hash = await sha256BlobSeguro(new Blob([combinado]));
            if (hash && hash !== meta.geracaoAtual.sha256) throw new Error('Checksum da geração remota não confere; dados locais foram preservados.');
        }
        return combinado.buffer;
    }
    const partes = Math.max(1, totalPartes || 1);

    if (partes === 1) {
        const url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${codigo}.zip?t=${Date.now()}`; // ver nota sobre cache do CDN em buscarMetaDaNuvem
        const resposta = await fetch(url, { cache: 'no-store' });
        if (resposta.status === 404) return null;
        if (!resposta.ok) throw new Error(`Falha ao consultar a nuvem (${resposta.status})`);
        return await resposta.arrayBuffer();
    }

    const buffers = [];
    for (let i = 0; i < partes; i++) {
        const url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${codigo}.zip.parte${i}?t=${Date.now()}`;
        const resposta = await fetch(url, { cache: 'no-store' });
        if (resposta.status === 404) return null; // uma parte sumiu — não aplica um backup incompleto
        if (!resposta.ok) throw new Error(`Falha ao baixar parte ${i + 1} de ${partes} da nuvem (${resposta.status})`);
        buffers.push(await resposta.arrayBuffer());
    }

    const tamanhoTotal = buffers.reduce((soma, b) => soma + b.byteLength, 0);
    const combinado = new Uint8Array(tamanhoTotal);
    let offset = 0;
    for (const b of buffers) { combinado.set(new Uint8Array(b), offset); offset += b.byteLength; }
    return combinado.buffer;
}

/**
 * Limpeza local SEGURA — usada pelo botão de reset do termômetro (ver
 * js/diagnostics.js) e pela detecção de reset remoto em
 * sincronizarNaAbertura() logo abaixo. Desde a preservação permanente do
 * projeto (ver js/preservacao.js e CONTEXTO-PROJETO.md), esta função NÃO
 * apaga mais o IndexedDB nem o localStorage inteiros — só o termômetro do
 * dia e cache técnico. Nenhum dado permanente (data/horário/local do
 * pedido, vídeo, assinatura, fotos, "momentos", cartas, mensagens, mural,
 * códigos especiais, easter eggs, contrato, checklist) é afetado, aqui ou
 * em qualquer outro caminho de reset do site.
 */
async function limparArmazenamentoLocal() {
    if (typeof resetarTermometroDoDia === 'function') {
        try { await resetarTermometroDoDia(); } catch (e) { console.error('Falha ao reiniciar o termômetro durante a limpeza local:', e); }
    }
    if (typeof limparCacheTecnico === 'function') {
        try { await limparCacheTecnico(); } catch (e) { console.error('Falha na limpeza de cache técnico durante a limpeza local:', e); }
    }
}

/* ----------------------------------------------------------------------
 * SINCRONIZAÇÃO AUTOMÁTICA (link único, sem "?c=")
 * ----------------------------------------------------------------------
 * Toda alteração de dados (hook em db.js) agenda um envio à nuvem, e toda
 * abertura da página confere se há algo mais novo na nuvem que localmente.
 * ---------------------------------------------------------------------- */

let __auroraAplicandoBackupRemoto = false; // suprime auto-envio enquanto aplicamos um backup vindo da nuvem
let __auroraTimeoutEnvioNuvem = null;
let __auroraSyncEmAndamento = 0; // contador de envios em voo (pode haver mais de um sobreposto)
let __auroraSequenciaMudancas = 0;
let __auroraRetryTimeout = null;
let __auroraFalhasConsecutivas = 0;
const POLONI_RETRY_ATRASOS_MS = [5000, 15000, 45000, 120000, 300000, 600000];
window.__auroraSyncDirtyMemoria = Boolean(window.__auroraSyncDirtyMemoria);

// Banner "Salvando na nuvem": mídia grande dispara o envio imediatamente
// (sem esperar) e mostra este aviso até terminar, pois o iOS costuma
// suspender envios em segundo plano se a tela travar antes de terminarem.
function mostrarBannerSync(emAndamento) {
    __auroraSyncEmAndamento = Math.max(0, __auroraSyncEmAndamento + (emAndamento ? 1 : -1));
    const banner = document.getElementById('auroraSyncBanner');
    if (!banner) return;
    if (emAndamento) {
        banner.classList.remove('aurora-sync-banner-erro'); // reseta pro texto padrão
        banner.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando na nuvem — não feche o app nem tranque a tela ainda...';
    }
    banner.classList.toggle('d-none', __auroraSyncEmAndamento <= 0);
}

window.addEventListener('beforeunload', (evt) => {
    if (__auroraSyncEmAndamento > 0 || window.__auroraSyncDirtyMemoria) {
        evt.preventDefault();
        evt.returnValue = 'Ainda há alterações aguardando confirmação da nuvem — se sair agora, elas continuarão neste aparelho e serão reenviadas na próxima abertura.';
        return evt.returnValue;
    }
});

let __auroraPublicacaoEmAndamento = false; // true enquanto um envio já está em voo
let __auroraPublicacaoPendente = false;    // true se algo mudou DE NOVO enquanto esse envio estava em voo
let __auroraPublicacaoPromessa = null;     // todos os chamadores aguardam a mesma fila
const POLONI_LOCK_EXPIRA_MS = 10 * 60 * 1000;

async function lerLockPublicacao(objeto) {
    return requisicaoNuvem(`${caminhoPublico(objeto)}?lock=${Date.now()}`, { cache: 'no-store' }, async resposta => {
        if (resposta.status === 404) return null;
        if (!resposta.ok) throw new Error(`Não foi possível consultar a fila de salvamento (HTTP ${resposta.status}).`);
        return resposta.json();
    });
}

async function tentarCriarLockPublicacao(objeto, lock) {
        return requisicaoNuvem(caminhoEscrita(objeto), {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'x-upsert': 'false'
            },
            body: JSON.stringify(lock)
        }, async resposta => {
            if (resposta.ok) return true;
            const detalhe = await resposta.json().catch(() => ({}));
            if (resposta.status === 409 || String(detalhe.statusCode) === '409' || detalhe.error === 'Duplicate') return false;
            throw new Error(`A nuvem recusou o salvamento (HTTP ${resposta.status}). Confira conexão, espaço e permissões.`);
        });
}

async function adquirirLockPublicacao(codigo) {
    const objeto = `${codigo}-publicacao.lock.json`;
    const agoraServidor = (await obterHoraConfiavel()).getTime();
    const lock = { token: gerarIdUnico('lock'), criadoEm: new Date(agoraServidor).toISOString() };

    const chaveSessao = `poloni_lock_${codigo}`;
    const assumir = valor => {
        try { sessionStorage.setItem(chaveSessao, valor.token); } catch (_) { /* recuperação opcional */ }
        return { objeto, ...valor };
    };
    if (await tentarCriarLockPublicacao(objeto, lock)) return assumir(lock);

    // Um aparelho fechado no meio do upload pode deixar o lock órfão. Só o
    // remove após 10 minutos e depois de identificar exatamente seu token;
    // a recriação continua atômica porque usa x-upsert=false.
    const existente = await lerLockPublicacao(objeto);
    const criadoEm = existente && Date.parse(existente.criadoEm);
    if (existente?.token && Number.isFinite(criadoEm) && agoraServidor - criadoEm > POLONI_LOCK_EXPIRA_MS) {
        const releitura = await lerLockPublicacao(objeto);
        if (releitura?.token === existente.token) {
            try {
                await requisicaoNuvem(caminhoEscrita(objeto), {
                    method: 'DELETE',
                    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
                }, async resposta => { if (!resposta.ok) throw new Error('A fila ainda está ocupada.'); });
            } catch (_) { /* a tentativa atômica abaixo decidirá */ }
            if (await tentarCriarLockPublicacao(objeto, lock)) return assumir(lock);
        }
    }

    throw new Error('Outro aparelho está publicando agora. A tentativa será refeita sem sobrescrever dados.');
}

async function liberarLockPublicacao(lock) {
    if (!lock) return;
    try {
        const atual = await lerLockPublicacao(lock.objeto);
        if (!atual || atual.token !== lock.token) return;
        await requisicaoNuvem(caminhoEscrita(lock.objeto), {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        }, async resposta => { if (!resposta.ok) throw new Error(`Falha ao liberar lock remoto (${resposta.status}).`); });
    } catch (erro) {
        await registrarDiagnosticoSeguro('sync.liberar_lock', erro);
    }
}

async function executarPublicacaoComLock() {
    const executar = async () => {
        let ultimoErro;
        for (let tentativa = 1; tentativa <= 3; tentativa++) {
            let lock = null;
            try {
                lock = await adquirirLockPublicacao(EXPERIENCE_ID);
                return await publicarBackupNaNuvem(EXPERIENCE_ID, lock);
            }
            catch (erro) {
                ultimoErro = erro;
                if (!String(erro && erro.message).includes('Outro aparelho') || tentativa === 3) throw erro;
                await new Promise(resolve => setTimeout(resolve, 1200 * tentativa));
            } finally {
                await liberarLockPublicacao(lock);
            }
        }
        throw ultimoErro;
    };
    if (navigator.locks && navigator.locks.request) {
        return navigator.locks.request('poloni-sync-publicacao', { mode: 'exclusive' }, executar);
    }
    return executar();
}

// Publica na nuvem de forma serializada: se já existe um envio em voo,
// uma nova chamada só marca "pendente" e é reprocessada ao terminar (evita
// dois envios em paralelo sobrescreverem um ao outro fora de ordem).
async function publicarComIndicadorVisivel() {
    if (__auroraPublicacaoEmAndamento) {
        __auroraPublicacaoPendente = true;
        return __auroraPublicacaoPromessa;
    }

    __auroraPublicacaoEmAndamento = true;
    atualizarEstadoSincronizacao('enviando');
    mostrarBannerSync(true);
    __auroraPublicacaoPromessa = (async () => {
        try {
            while (true) {
                const sequenciaNoInicio = __auroraSequenciaMudancas;
                __auroraPublicacaoPendente = false;
                await executarPublicacaoComLock();
                // Uma mudança pode ter ocorrido enquanto o ZIP era gerado ou
                // enviado. Nesse caso o primeiro backup continua válido, mas
                // é obrigatório publicar novamente antes de limpar o dirty.
                if (sequenciaNoInicio !== __auroraSequenciaMudancas) __auroraPublicacaoPendente = true;
                if (__auroraPublicacaoPendente) continue;

                // Só limpa o marcador depois que toda a fila terminou. Se
                // algo mudar durante esta própria escrita, restaura o dirty e
                // publica outra geração antes de sair do laço.
                const sequenciaAntesDeLimpar = __auroraSequenciaMudancas;
                await salvarConfiguracao('aurora_sync_dirty', '0', false, false);
                if (sequenciaAntesDeLimpar !== __auroraSequenciaMudancas) {
                    await salvarConfiguracao('aurora_sync_dirty', '1', false, false);
                    continue;
                }
                break;
            }
            window.__auroraSyncDirtyMemoria = false;
            await salvarConfiguracao('aurora_sync_confirmado_em', new Date().toISOString(), false, false);
            atualizarEstadoSincronizacao('confirmado');
            __auroraFalhasConsecutivas = 0;
            if (__auroraRetryTimeout) { clearTimeout(__auroraRetryTimeout); __auroraRetryTimeout = null; }
        } finally {
            __auroraPublicacaoEmAndamento = false;
            __auroraPublicacaoPromessa = null;
            mostrarBannerSync(false);
        }
    })();
    return __auroraPublicacaoPromessa;
}

function tratarFalhaEnvioAutomatico(err) {
    atualizarEstadoSincronizacao('pendente');
    console.error('Falha no envio automático para a nuvem:', err);
    window.__auroraSyncDirtyMemoria = true;
    const mensagemEspecifica = (err && err.message && err.message.includes('espaço TOTAL')) ? err.message : null;
    const mensagem = mensagemEspecifica || 'Ainda não foi possível confirmar na nuvem. Os dados continuam seguros neste aparelho e uma nova tentativa será feita automaticamente.';
    mostrarAvisoPersistente(mensagem);

    const statusEl = document.getElementById('compartilharStatus');
    if (statusEl) {
        statusEl.textContent = mensagemEspecifica || 'Sincronização pendente — o site tentará novamente automaticamente.';
        statusEl.className = 'save-status err';
    }

    if (__auroraRetryTimeout || __auroraFalhasConsecutivas >= POLONI_RETRY_ATRASOS_MS.length) return;
    const atraso = POLONI_RETRY_ATRASOS_MS[__auroraFalhasConsecutivas++];
    __auroraRetryTimeout = setTimeout(() => {
        __auroraRetryTimeout = null;
        dispararEnvioAutomatico();
    }, atraso);
}

function dispararEnvioAutomatico() {
    publicarComIndicadorVisivel().catch(tratarFalhaEnvioAutomatico);
}

// Aviso persistente (mesmo banner do "Salvando na nuvem"), visível em
// qualquer tela do site até a pessoa tocar para fechar.
function mostrarAvisoPersistente(mensagem) {
    const banner = document.getElementById('auroraSyncBanner');
    if (!banner) return;
    banner.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${escaparHtml(mensagem)} <button type="button" class="aurora-aviso-fechar" aria-label="Fechar">&times;</button>`;
    banner.classList.remove('d-none');
    banner.classList.add('aurora-sync-banner-erro');
    banner.querySelector('.aurora-aviso-fechar').addEventListener('click', () => {
        banner.classList.add('d-none');
        banner.classList.remove('aurora-sync-banner-erro');
        banner.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando na nuvem — não feche o app nem tranque a tela ainda...';
    });
}

// Chamado (hook em db.js) sempre que algo muda localmente. imediato=true
// (vídeo/foto/áudio) dispara o envio na hora; imediato=false (configs
// pequenas) agrupa várias mudanças num único envio.
//
// __auroraSuprimirSyncDiagnostico: ligada por js/diagnostics.js enquanto
// roda testes que salvam/apagam dados de teste reais no banco, para que
// esses testes não disparem sincronizações de verdade com a nuvem.
window.__auroraSuprimirSyncDiagnostico = false;

function agendarEnvioNuvem(imediato = false) {
    if (!syncEstaConfigurado()) return;
    // O restore usa bulkPut sem este hook. Escritas do usuário durante um
    // download precisam continuar marcadas, mesmo com a consulta em andamento.
    if (window.__auroraSuprimirSyncDiagnostico) return; // mudança causada por um teste de diagnóstico — não é conteúdo real, não sincroniza

    __auroraSequenciaMudancas++;
    window.__auroraSyncDirtyMemoria = true;
    atualizarEstadoSincronizacao('pendente');
    __auroraFalhasConsecutivas = 0;
    if (__auroraRetryTimeout) { clearTimeout(__auroraRetryTimeout); __auroraRetryTimeout = null; }
    clearTimeout(__auroraTimeoutEnvioNuvem);
    if (__auroraPublicacaoEmAndamento) {
        __auroraPublicacaoPendente = true;
        return;
    }

    if (imediato) {
        dispararEnvioAutomatico();
    } else {
        __auroraTimeoutEnvioNuvem = setTimeout(dispararEnvioAutomatico, 1200);
    }
}

// No celular, trocar de app ou bloquear a tela pode suspender timers antes
// dos 1,2 s de agrupamento. Inicia o envio imediatamente ao ocultar a página;
// o dirty continua persistido caso o sistema encerre o navegador no meio.
function anteciparEnvioAoSuspender() {
    if (!window.__auroraSyncDirtyMemoria || __auroraPublicacaoEmAndamento) return;
    if (__auroraTimeoutEnvioNuvem) {
        clearTimeout(__auroraTimeoutEnvioNuvem);
        __auroraTimeoutEnvioNuvem = null;
    }
    dispararEnvioAutomatico();
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') anteciparEnvioAoSuspender();
});
window.addEventListener('pagehide', anteciparEnvioAoSuspender);

/**
 * Roda uma vez, no carregamento da página. Decide entre "puxar" (a nuvem
 * tem algo mais recente que este aparelho nunca viu) ou "empurrar" (este
 * aparelho tem mudanças que a nuvem ainda não tem).
 */
async function sincronizarNaAbertura() {
    if (__auroraPublicacaoEmAndamento) return;
    // Compatibilidade com links antigos que ainda usem "?c=codigo".
    await verificarImportacaoPorLink();

    if (!syncEstaConfigurado()) return;

    const revisaoLocal = parseInt(await obterConfiguracao('aurora_sync_revision'), 10) || 0;
    const localSujo = (await obterConfiguracao('aurora_sync_dirty')) === '1';
    window.__auroraSyncDirtyMemoria = localSujo || window.__auroraSyncDirtyMemoria;

    let meta = null;
    try {
        meta = await buscarMetaDaNuvem(EXPERIENCE_ID);
    } catch (err) {
        console.error('Não foi possível consultar a nuvem ao abrir o site (seguindo com os dados locais):', err);
        atualizarEstadoSincronizacao('local');
        if (localSujo) tratarFalhaEnvioAutomatico(err);
        return;
    }

    const revisaoNuvem = Number(meta && meta.revisao) || 0;
    const timestampNuvem = (meta && meta.atualizadoEm) ? meta.atualizadoEm : 0; // somente compatibilidade com reset legado
    const nuvemFoiResetada = Boolean(meta && meta.resetado);

    // Um reset é "pendente" pra este aparelho se for mais novo que qualquer
    // dado que ele já conhece; assim que este aparelho publica algo novo, a
    // marca "resetado" some do meta.json.
    const resetPendente = nuvemFoiResetada && timestampNuvem > (parseInt(await obterConfiguracao('aurora_reset_visto_em'), 10) || 0);

    if (resetPendente) {
        await limparArmazenamentoLocal();
        await salvarConfiguracao('aurora_reset_visto_em', String(timestampNuvem), false, false);
    }

    if (meta && !nuvemFoiResetada && !(await geracaoJaAplicada(EXPERIENCE_ID, meta))) {
        // A revisão remota é monotônica e não depende do relógio do aparelho.
        try {
            const zipDados = await buscarBackupZipDaNuvem(EXPERIENCE_ID, meta.partes, meta);
            if (zipDados) {
                await aplicarBackupDeZip(zipDados);
                await registrarGeracaoAplicada(EXPERIENCE_ID, meta);
                window.dispatchEvent(new Event('poloni:nuvem-atualizada'));
            }
        } catch (err) {
            console.error('Falha ao baixar/aplicar o backup da nuvem:', err);
            await registrarDiagnosticoSeguro('sync.abertura_download', err, { revisaoLocal, revisaoNuvem });
        }
    }

    // Só publica se existe uma alteração local explicitamente marcada. Um
    // navegador novo nasce limpo e, portanto, jamais envia backup vazio.
    if (!nuvemFoiResetada && (localSujo || window.__auroraSyncDirtyMemoria)) {
        try {
            await publicarComIndicadorVisivel();
        } catch (err) {
            console.error('Falha ao publicar dados locais na nuvem ao abrir o site:', err);
            await registrarDiagnosticoSeguro('sync.abertura_upload', err, { revisaoLocal, revisaoNuvem });
            tratarFalhaEnvioAutomatico(err);
        }
    } else if (meta && await geracaoJaAplicada(EXPERIENCE_ID, meta)) {
        atualizarEstadoSincronizacao('confirmado');
    }
}

let __poloniEstadoSync = 'local';
function atualizarEstadoSincronizacao(estado, detalhe) {
    __poloniEstadoSync = estado;
    const textos = {
        local: 'Dados neste aparelho. Nuvem ainda não conferida.',
        pendente: 'Salvo neste aparelho. Aguardando envio.',
        enviando: 'Salvando na nuvem...',
        confirmado: 'Salvamento confirmado na nuvem.'
    };
    for (const painel of document.querySelectorAll?.('[data-poloni-sync]') || []) {
        painel.dataset.estado = estado;
        const texto = painel.querySelector('[data-poloni-sync-texto]');
        if (texto) texto.textContent = detalhe || textos[estado] || textos.local;
        const botao = painel.querySelector('[data-poloni-sync-retry]');
        if (botao) botao.disabled = estado === 'enviando';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    for (const botao of document.querySelectorAll?.('[data-poloni-sync-retry]') || []) {
        botao.addEventListener('click', async () => {
            if (navigator.onLine === false) { atualizarEstadoSincronizacao('local', 'Sem internet. As alterações continuam neste aparelho.'); return; }
            await consultarAtualizacoesEmSegundoPlano(true);
        });
    }
    atualizarEstadoSincronizacao(__poloniEstadoSync);
});

let __poloniConsultaPromessa = null;
let __poloniUltimaConsulta = 0;
function consultarAtualizacoesEmSegundoPlano(forcar = false) {
    if (navigator.onLine === false || __auroraPublicacaoEmAndamento) return Promise.resolve();
    if (__poloniConsultaPromessa) return __poloniConsultaPromessa;
    if (!forcar && Date.now() - __poloniUltimaConsulta < 60000) return Promise.resolve();
    __poloniUltimaConsulta = Date.now();
    __poloniConsultaPromessa = sincronizarNaAbertura()
        .catch(erro => registrarDiagnosticoSeguro('sync.consulta_background', erro))
        .finally(() => { __poloniConsultaPromessa = null; });
    return __poloniConsultaPromessa;
}

async function prepararDadosParaEntrada() {
    atualizarProgressoEntrada('Abrindo as lembranças deste aparelho', 1, 3);
    const possuiDados = (await db.configuracoes.count()) > 0 || (await db.media.count()) > 0;
    if (!possuiDados || new URLSearchParams(window.location.search).has('c')) {
        atualizarProgressoEntrada('Consultando a nuvem pela primeira vez');
        await consultarAtualizacoesEmSegundoPlano(true);
    }
    atualizarProgressoEntrada('Preparando nossa história', 2, 3);
}

function atualizarProgressoEntrada(mensagem, feito, total) {
    const texto = document.getElementById('vinhetaProgressoTexto');
    const barra = document.getElementById('vinhetaProgresso');
    if (texto) texto.textContent = Number.isFinite(total) && total > 0
        ? `${mensagem} (${feito} de ${total})` : mensagem;
    if (barra) {
        if (Number.isFinite(total) && total > 0) { barra.max = total; barra.value = feito; }
        else barra.removeAttribute('value');
    }
}

window.addEventListener('online', () => consultarAtualizacoesEmSegundoPlano(true));
window.addEventListener('pageshow', evento => { if (evento.persisted) consultarAtualizacoesEmSegundoPlano(); });
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') consultarAtualizacoesEmSegundoPlano();
});

/**
 * Ao carregar a página: se a URL tiver "?c=CODIGO" e a sincronização
 * estiver configurada, baixa e aplica os dados automaticamente — é assim
 * que o link abre "igual" em outro celular.
 */
async function verificarImportacaoPorLink() {
    if (!syncEstaConfigurado()) return;
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('c');
    if (!codigo) return;

    // Evita reimportar toda vez que a pessoa já está usando o link normalmente.
    const jaImportado = sessionStorage.getItem(`aurora_importado_${codigo}`);
    if (jaImportado) return;

    try {
        await importarBackupDaNuvem(codigo);
        sessionStorage.setItem(`aurora_importado_${codigo}`, '1');
        await salvarConfiguracao('aurora_share_code', codigo);
    } catch (err) {
        console.error('Falha ao importar experiência compartilhada:', err);
    }
}

/** Botão "Compartilhar": publica (se configurado) e abre o menu de compartilhamento nativo. */
async function compartilharExperiencia() {
    const statusEl = document.getElementById('compartilharStatus');
    const setStatus = (msg, tipo) => { if (statusEl) { statusEl.textContent = msg; statusEl.className = tipo ? `save-status ${tipo}` : 'save-status'; } };

    // O link agora é sempre o link puro (sem "?c=..."): a sincronização usa o
    // EXPERIENCE_ID fixo, então o mesmo link já abre igual em qualquer aparelho.
    let urlParaCompartilhar = window.location.href.split('?')[0];

    if (syncEstaConfigurado()) {
        setStatus('Sincronizando com a nuvem...', 'pending');
        try {
            await publicarComIndicadorVisivel();
            setStatus('Sincronizado! O link já pode ser aberto em qualquer aparelho.', 'ok');
        } catch (err) {
            console.error('Falha ao sincronizar com a nuvem:', err);
            tratarFalhaEnvioAutomatico(err);
            setStatus('Não foi possível sincronizar agora. Compartilhando o link local.', 'err');
        }
    } else {
        setStatus('Sincronização na nuvem ainda não configurada — compartilhando o link local (funciona apenas neste aparelho). Veja as instruções em sync.js.', 'pending');
    }

    try {
        if (navigator.share) {
            await navigator.share({ title: TEXTOS.heroTituloRomance, text: 'Um momento nosso ❤️', url: urlParaCompartilhar });
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(urlParaCompartilhar);
            setStatus('Link copiado para a área de transferência!', 'ok');
        }
    } catch (e) { /* usuário cancelou o compartilhamento nativo, sem problema */ }
}

/**
 * Teste real de conexão com a nuvem (usado em diagnostico.html): sobe um
 * arquivo pequeno de teste, baixa de volta, confere que o conteúdo bate, e
 * apaga o arquivo de teste em seguida. Diferente de validarFormatoAnonKey
 * (que só confere o formato), esta função realmente conversa com o
 * Supabase — é a prova definitiva de que URL + chave estão certos e que
 * as políticas do bucket permitem inserir/ler/apagar.
 */
async function limparObjetoTemporarioNuvem(caminho, caminhoPublico) {
    try {
        const resposta = await fetch(caminho, {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (!resposta.ok) return { ok: false, status: resposta.status };

        const confirmacao = await fetch(`${caminhoPublico}?removido=${Date.now()}`, { cache: 'no-store' });
        return { ok: !confirmacao.ok, status: confirmacao.status };
    } catch (e) {
        return { ok: false, status: 0 };
    }
}

async function testarConexaoNuvem() {
    if (!syncEstaConfigurado()) {
        return { ok: false, etapa: 'configuracao', motivo: 'SUPABASE_URL e/ou SUPABASE_ANON_KEY ainda estão vazios em js/sync.js.' };
    }

    const formato = validarFormatoAnonKey(SUPABASE_ANON_KEY);
    if (!formato.ok) {
        return { ok: false, etapa: 'formato_da_chave', motivo: formato.motivo };
    }

    const codigoTeste = `diagnostico_${Date.now()}`;
    const conteudoTeste = { teste: true, ts: new Date().toISOString() };
    const caminho = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${codigoTeste}.json`;
    const caminhoPublico = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${codigoTeste}.json`;

    // 1) Upload
    let respostaUpload;
    try {
        respostaUpload = await fetch(caminho, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'x-upsert': 'false' },
            body: JSON.stringify(conteudoTeste)
        });
    } catch (err) {
        return { ok: false, etapa: 'upload', motivo: `Não foi possível conectar ao Supabase (rede ou URL incorreta): ${err.message}` };
    }
    if (!respostaUpload.ok) {
        const corpo = await respostaUpload.text().catch(() => '');
        return { ok: false, etapa: 'upload', motivo: `Upload falhou (HTTP ${respostaUpload.status}). Confira a policy de INSERT do bucket. Detalhe: ${corpo.slice(0, 200)}` };
    }

    // 2) Download público e integridade. Depois de um upload bem-sucedido,
    // não há retorno antecipado: a limpeza sempre é tentada.
    let resultado;
    try {
        const respostaDownload = await fetch(`${caminhoPublico}?teste=${Date.now()}`, { cache: 'no-store' });
        if (!respostaDownload.ok) {
            resultado = { ok: false, etapa: 'download', motivo: `Upload funcionou, mas o download falhou (HTTP ${respostaDownload.status}). Confira se o bucket está marcado como público.` };
        } else {
            const baixado = await respostaDownload.json().catch(() => null);
            resultado = (!baixado || baixado.ts !== conteudoTeste.ts)
                ? { ok: false, etapa: 'integridade', motivo: 'O conteúdo baixado não confere com o que foi enviado.' }
                : { ok: true, etapa: 'completo', motivo: 'Upload, download, integridade e remoção confirmados com sucesso.' };
        }
    } catch (err) {
        resultado = { ok: false, etapa: 'download', motivo: `Upload funcionou, mas o download falhou: ${err.message}` };
    }

    // 3) Limpeza confirmada; falhar aqui reprova o diagnóstico para não
    // acumular objetos temporários no bucket.
    const limpeza = await limparObjetoTemporarioNuvem(caminho, caminhoPublico);
    if (!limpeza.ok) {
        return { ok: false, etapa: 'limpeza', motivo: `O teste gravou o arquivo, mas não confirmou sua remoção (HTTP ${limpeza.status || 'rede'}). Confira a policy de DELETE do bucket.` };
    }

    return resultado;
}

/**
 * Teste de UPLOAD BINÁRIO REAL — sobe uma parte de 5 MB pelo MESMO caminho
 * usado na publicação (POST binário direto, "Content-Type: application/zip",
 * sem sobrescrita). Isso é essencial porque testarConexaoNuvem() só testa um
 * JSON de poucos bytes — passa tranquilamente mesmo que o bucket tenha um
 * "File size limit" baixo demais, ou mesmo que a rede do celular seja
 * lenta o bastante para o upload de um vídeo real cair pela metade. Este
 * teste é o que realmente reproduz o problema que fotos e vídeos grandes
 * podem encontrar.
 */
async function testarUploadMediaReal() {
    if (!syncEstaConfigurado()) {
        return { ok: false, motivo: 'Sincronização não configurada em js/sync.js.' };
    }

    const idTeste = `diagnostico_zip_${Date.now()}`;
    const tamanhoBytes = 5 * 1024 * 1024; // mesmo tamanho máximo de uma parte real do backup
    const blobTeste = criarBlobDeTeste(tamanhoBytes);
    const caminho = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${idTeste}.zip`;
    const caminhoPublico = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${idTeste}.zip`;
    const inicio = performance.now();

    // 1) Upload binário (mesmo formato usado por publicarBackupNaNuvem).
    try {
        const respostaUpload = await fetch(caminho, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/zip',
                'x-upsert': 'false'
            },
            body: blobTeste
        });
        if (!respostaUpload.ok) {
            const corpo = await respostaUpload.text().catch(() => '');
            return {
                ok: false,
                motivo: `Upload de ${(tamanhoBytes / (1024 * 1024)).toFixed(0)}MB falhou (HTTP ${respostaUpload.status}). Causa mais comum: "File size limit" do bucket (Storage > aurora-backups > Edit bucket, no painel do Supabase) ou política de INSERT ausente. Detalhe: ${corpo.slice(0, 200)}`
            };
        }
    } catch (err) {
        return { ok: false, motivo: `Não foi possível conectar ao Supabase para o upload: ${err.message}` };
    }

    // 2) Download público, para confirmar que a parte chegou íntegra. Depois
    // do upload, o fluxo sempre passa pela limpeza antes de retornar.
    let resultado;
    try {
        const respostaDownload = await fetch(`${caminhoPublico}?teste=${Date.now()}`, { cache: 'no-store' });
        if (!respostaDownload.ok) {
            resultado = { ok: false, motivo: `Upload funcionou, mas o download falhou (HTTP ${respostaDownload.status}). Confira se o bucket está público.` };
        } else {
            const blobBaixado = await respostaDownload.blob();
            if (blobBaixado.size !== blobTeste.size) {
                resultado = { ok: false, motivo: `O arquivo baixado não bate em tamanho com o enviado (enviado ${blobTeste.size} bytes, baixado ${blobBaixado.size} bytes) — algo está truncando o upload/download.` };
            } else {
                const [hashEnviado, hashBaixado] = await Promise.all([
                    sha256BlobSeguro(blobTeste),
                    sha256BlobSeguro(blobBaixado)
                ]);
                resultado = (hashEnviado && hashBaixado && hashEnviado !== hashBaixado)
                    ? { ok: false, motivo: 'O tamanho confere, mas o SHA-256 do arquivo baixado é diferente do enviado.' }
                    : { ok: true, motivo: `Upload, download, SHA-256 e remoção de ${(tamanhoBytes / (1024 * 1024)).toFixed(0)}MB confirmados em ${Math.round(performance.now() - inicio)}ms, pelo mesmo caminho usado por cada parte do backup real.` };
            }
        }
    } catch (err) {
        resultado = { ok: false, motivo: `Upload funcionou, mas o download falhou: ${err.message}` };
    }

    const limpeza = await limparObjetoTemporarioNuvem(caminho, caminhoPublico);
    if (!limpeza.ok) {
        return { ok: false, motivo: `O teste gravou a parte, mas não confirmou sua remoção (HTTP ${limpeza.status || 'rede'}). Confira a policy de DELETE do bucket.` };
    }
    return resultado;
}

function iniciarModuloSync() {
    document.getElementById('btnCompartilhar').addEventListener('click', compartilharExperiencia);
}
