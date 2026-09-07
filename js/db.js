/**
 * DB.JS — Armazenamento local (IndexedDB via Dexie).
 * Tabelas: "media" (um registro por item — vídeo, assinatura, lembranças,
 * mensagens; campos id/tipo/blob/mimeType/texto/criadoEm) e "configuracoes"
 * (pares chave/valor pequenos). Cada mídia é seu próprio registro (em vez de
 * um array dentro de um único registro) para evitar bugs de Blob no Safari.
 * Toda escrita de mídia é seguida de uma leitura de confirmação.
 */

const db = new Dexie('AuroraDB');

// Migra a estrutura anterior sem abandonar os registros restantes quando
// apenas um item legado estiver incompleto. Falhas reais de escrita continuam
// sendo lançadas para abortar o upgrade inteiro e permitir nova tentativa na
// próxima abertura; somente entradas sem conteúdo aproveitável são ignoradas.
async function migrarArquivosLegados(tx) {
    const tabelaAntiga = tx.table('arquivos');
    const tabelaMedia = tx.table('media');
    const antigos = await tabelaAntiga.toArray();

    for (const registro of antigos) {
        if (!registro || !registro.id) continue;

        if (registro.id === 'video_casal' && registro.data instanceof Blob && registro.data.size) {
            await tabelaMedia.put({
                id: 'video_pedido',
                tipo: 'video_pedido',
                blob: registro.data,
                mimeType: registro.data.type || 'video/webm',
                criadoEm: registro.criadoEm || Date.now(),
                atualizadoEm: registro.criadoEm || Date.now()
            });
        }

        if (registro.id === 'assinatura' && typeof registro.data === 'string' && registro.data) {
            await tabelaMedia.put({
                id: 'assinatura',
                tipo: 'assinatura',
                texto: registro.data,
                criadoEm: registro.criadoEm || Date.now(),
                atualizadoEm: registro.criadoEm || Date.now()
            });
        }

        if (registro.id === 'lembrancas' && Array.isArray(registro.data)) {
            for (let i = 0; i < registro.data.length; i++) {
                const item = registro.data[i];
                if (!item || !(item.blob instanceof Blob) || !item.blob.size) continue;
                const criadoEm = Number(item.criadoEm || registro.criadoEm) || Date.now() + i;
                await tabelaMedia.put({
                    id: item.id || `lembranca_legada_${criadoEm}_${i}`,
                    tipo: 'lembranca',
                    blob: item.blob,
                    mimeType: item.mimeType || item.blob.type || null,
                    criadoEm,
                    atualizadoEm: criadoEm
                });
            }
        }

        if (registro.id === 'mensagens_futuro' && Array.isArray(registro.data)) {
            for (let i = 0; i < registro.data.length; i++) {
                const msg = registro.data[i];
                if (!msg || (typeof msg.texto !== 'string' && !(msg.blob instanceof Blob))) continue;
                const dataLegada = msg.criadoEm ? new Date(msg.criadoEm).getTime() : 0;
                const criadoEm = Number.isFinite(dataLegada) && dataLegada > 0 ? dataLegada : Date.now() + i;
                await tabelaMedia.put({
                    id: msg.id || `futuro_legado_${criadoEm}_${i}`,
                    tipo: 'mensagem_futuro',
                    subtipo: msg.tipo,
                    texto: typeof msg.texto === 'string' ? msg.texto : null,
                    blob: msg.blob instanceof Blob ? msg.blob : null,
                    mimeType: msg.mimeType || (msg.blob && msg.blob.type) || null,
                    criadoEm,
                    atualizadoEm: criadoEm
                });
            }
        }
    }

    // Só limpa depois que todas as escritas válidas terminaram. Se qualquer
    // put falhar, a transação inteira reverte e o upgrade será tentado de novo.
    await tabelaAntiga.clear();
}

// Coordena múltiplas abas abertas ao mesmo tempo durante um upgrade de schema.
db.on('blocked', () => {
    console.warn('AuroraDB: upgrade bloqueado por outra aba/página aberta com uma versão mais antiga do banco. Feche as outras abas do site e recarregue esta página.');
});
db.on('versionchange', () => {
    // Outra aba abriu uma versão mais nova do banco; fecha esta conexão.
    db.close();
    console.warn('AuroraDB: uma versão mais nova do banco foi aberta em outra aba. Esta conexão foi fechada — recarregue a página se algo parar de responder.');
});

// v1 = estrutura antiga, mantida só para migração automática.
db.version(1).stores({ arquivos: 'id' });

// v2 = estrutura atual, um registro por item de mídia.
db.version(2).stores({
    media: 'id, tipo, criadoEm',
    configuracoes: 'chave'
}).upgrade(migrarArquivosLegados);

// v3 acrescenta somente um diário técnico local. A migração é aditiva:
// nenhuma tabela ou registro sentimental é removido ou regravado.
db.version(3).stores({
    media: 'id, tipo, criadoEm',
    configuracoes: 'chave',
    diagnosticos: '++id, codigo, criadoEm, operacao'
});

// v4 faz uma varredura de recuperação. Versões anteriores engoliam uma
// exceção durante a migração v2; isso podia deixar `arquivos` preenchida e o
// banco já marcado como atualizado. A v4 tenta novamente de forma segura.
db.version(4).stores({
    arquivos: 'id',
    media: 'id, tipo, criadoEm',
    configuracoes: 'chave',
    diagnosticos: '++id, codigo, criadoEm, operacao'
}).upgrade(migrarArquivosLegados);

function gerarCodigoDiagnostico() {
    const data = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const aleatorio = Math.random().toString(36).slice(2, 7).toUpperCase().padEnd(5, '0');
    return `POLONI-${data}-${aleatorio}`;
}

// Registra apenas metadados técnicos. Nunca recebe senha, token ou conteúdo
// sentimental. O diário é limitado para não crescer indefinidamente.
async function registrarDiagnosticoSeguro(operacao, erro, detalhes = {}) {
    try {
        const codigo = gerarCodigoDiagnostico();
        const registro = {
            codigo,
            criadoEm: Date.now(),
            pagina: location && location.pathname ? location.pathname : '',
            operacao: String(operacao || 'desconhecida').slice(0, 80),
            mensagem: String(erro && erro.message ? erro.message : erro || 'Falha sem mensagem').slice(0, 500),
            stack: erro && erro.stack ? String(erro.stack).slice(0, 1800) : null,
            navegador: navigator && navigator.userAgent ? navigator.userAgent.slice(0, 350) : '',
            versaoApp: typeof POLONI_APP_VERSION !== 'undefined' ? POLONI_APP_VERSION : null,
            detalhes: detalhes && typeof detalhes === 'object' ? detalhes : {}
        };
        await db.diagnosticos.add(registro);
        const total = await db.diagnosticos.count();
        if (total > 120) {
            const antigos = await db.diagnosticos.orderBy('id').limit(total - 100).primaryKeys();
            await db.diagnosticos.bulkDelete(antigos);
        }
        return codigo;
    } catch (_) {
        return null;
    }
}

// Marca "agora" como última alteração local (usado por js/sync.js para
// decidir quem tem dados mais novos) e agenda o envio à nuvem.
async function marcarAtualizacaoLocal(imediato = false) {
    // Testes do diagnóstico escrevem e removem objetos descartáveis. Eles não
    // podem deixar o banco marcado como pendente nem provocar aviso ao sair.
    try { if (typeof window !== 'undefined' && window.__auroraSuprimirSyncDiagnostico) return; } catch (_) { /* ambiente sem window */ }
    const agora = String(Date.now());
    try { localStorage.setItem('aurora_atualizado_em', agora); } catch (e) { /* ignora */ }
    try { localStorage.setItem('aurora_sync_dirty', '1'); } catch (e) { /* ignora */ }
    try {
        await db.transaction('rw', db.configuracoes, async () => {
            await db.configuracoes.put({ chave: 'aurora_atualizado_em', valor: agora });
            await db.configuracoes.put({ chave: 'aurora_sync_dirty', valor: '1' });
        });
    } catch (e) {
        await registrarDiagnosticoSeguro('db.marcar_atualizacao', e);
    }
    try { if (typeof window !== 'undefined') window.__auroraSyncDirtyMemoria = true; } catch (_) { /* ambiente sem window */ }
    if (typeof agendarEnvioNuvem === 'function') agendarEnvioNuvem(imediato);
}

async function hashBlobParaIntegridade(blob) {
    if (!(blob instanceof Blob)) return null;
    const bytes = await blob.arrayBuffer();
    const cryptoDisponivel = typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle;
    if (cryptoDisponivel) {
        const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
        return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Compatibilidade defensiva com navegadores muito antigos: ainda compara
    // todos os bytes, sem considerar apenas o tamanho do arquivo.
    return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function conteudoMediaIgual(a, b) {
    const blobA = a && a.blob instanceof Blob ? a.blob : null;
    const blobB = b && b.blob instanceof Blob ? b.blob : null;
    if (blobA || blobB) {
        if (!blobA || !blobB || blobA.size !== blobB.size) return false;
        return (await hashBlobParaIntegridade(blobA)) === (await hashBlobParaIntegridade(blobB));
    }
    const temTextoA = a && typeof a.texto === 'string';
    const temTextoB = b && typeof b.texto === 'string';
    if (temTextoA || temTextoB) return temTextoA && temTextoB && a.texto === b.texto;
    return true;
}

// Salva um item de mídia e relê do banco para confirmar byte a byte. Quando
// um id já existe com outro conteúdo, a versão anterior é mantida como um
// registro alternativo na mesma transação: uma nova gravação nunca destrói a
// anterior antes de o backup remoto também poder preservá-la.
// Sincroniza imediatamente (sem agrupar), já que mídia é uma ação rara.
async function salvarMedia(registro) {
    if (!registro || !registro.id) throw new Error('salvarMedia requer um id');
    const paraSalvar = Object.assign({}, registro, {
        criadoEm: registro.criadoEm || Date.now(),
        atualizadoEm: Date.now()
    });

    try {
        await db.transaction('rw', db.media, async () => {
            const existente = await db.media.get(paraSalvar.id);
            const conteudoIgual = existente
                ? await Dexie.waitFor(conteudoMediaIgual(existente, paraSalvar))
                : false;
            if (existente && existente.tipo !== 'diagnostico' && !conteudoIgual) {
                const hashAnterior = existente.blob instanceof Blob
                    ? (await Dexie.waitFor(hashBlobParaIntegridade(existente.blob))).slice(0, 16)
                    : String(existente.texto || '').length.toString(36);
                const sufixo = `${existente.atualizadoEm || existente.criadoEm || Date.now()}_${hashAnterior}`;
                let idPreservado = `${paraSalvar.id}__preservado_${sufixo}`;
                let contador = 1;
                while (await db.media.get(idPreservado)) idPreservado = `${paraSalvar.id}__preservado_${sufixo}_${contador++}`;
                await db.media.put(Object.assign({}, existente, {
                    id: idPreservado,
                    idOriginal: existente.idOriginal || paraSalvar.id,
                    preservadoEm: Date.now()
                }));
            }
            await db.media.put(paraSalvar);
        });
    } catch (err) {
        console.error(`Falha ao salvar mídia "${paraSalvar.id}" no IndexedDB:`, err);
        return false;
    }

    try {
        const confere = await db.media.get(paraSalvar.id);
        if (!confere) return false;
        if (!(await conteudoMediaIgual(paraSalvar, confere))) return false;
        await marcarAtualizacaoLocal(true);
        return true;
    } catch (err) {
        console.error(`Falha ao confirmar mídia "${paraSalvar.id}":`, err);
        return false;
    }
}

async function obterMedia(id) {
    try { const item = await db.media.get(id); return item && !item.excluidoEm ? item : null; } catch (e) { console.error(`Falha ao ler mídia "${id}":`, e); return null; }
}

async function obterMediaPorTipo(tipo) {
    try { return (await db.media.where('tipo').equals(tipo).toArray()).filter(item => !item.excluidoEm); } catch (e) { console.error(`Falha ao listar mídias do tipo "${tipo}":`, e); return []; }
}

async function excluirMedia(id) {
    try {
        const existente = await db.media.get(id);
        if (!existente) return true;
        if (existente.tipo === 'diagnostico') await db.media.delete(id);
        else await db.media.put(Object.assign({}, existente, { excluidoEm: Date.now(), atualizadoEm: Date.now() }));
        await marcarAtualizacaoLocal(true);
        return true;
    } catch (e) { console.error(`Falha ao excluir mídia "${id}":`, e); return false; }
}

/* ---------------- Configurações simples (chave/valor) ---------------- */
// Dados pequenos (datas, estágio, regras, respostas do quiz). localStorage
// é o cache rápido; IndexedDB é a fonte de verdade redundante.
// `imediato`: true para marcos importantes que não podem esperar o timer
// de agrupamento (1,2s).
async function salvarConfiguracao(chave, valor, imediato = false, afetaSincronizacao = true) {
    // Sempre serializa a mesma string nos dois armazenamentos, para que
    // obterConfiguracao() tenha um retorno consistente (string ou null).
    const valorSerializado = typeof valor === 'string' ? valor : JSON.stringify(valor);

    const registraRelogio = afetaSincronizacao && !['aurora_config_modificados_em', 'aurora_config_excluidas_em'].includes(chave);
    let relogioSerializado = null;
    let relogioLocal = {};
    const agoraRelogio = Date.now();
    if (registraRelogio) {
        try { relogioLocal = JSON.parse(localStorage.getItem('aurora_config_modificados_em') || '{}'); } catch (_) { relogioLocal = {}; }
        if (!relogioLocal || typeof relogioLocal !== 'object' || Array.isArray(relogioLocal)) relogioLocal = {};
    }

    let sucessoIndexedDB = false;
    try {
        await db.transaction('rw', db.configuracoes, async () => {
            await db.configuracoes.put({ chave, valor: valorSerializado });
            if (registraRelogio) {
                const registro = await db.configuracoes.get('aurora_config_modificados_em');
                let relogioDb = {};
                try { relogioDb = JSON.parse(registro?.valor || '{}'); } catch (_) { relogioDb = {}; }
                if (!relogioDb || typeof relogioDb !== 'object' || Array.isArray(relogioDb)) relogioDb = {};
                const unido = Object.assign({}, relogioDb);
                for (const [id, tempo] of Object.entries(relogioLocal)) {
                    unido[id] = Math.max(Number(unido[id]) || 0, Number(tempo) || 0);
                }
                unido[chave] = Math.max(agoraRelogio, (Number(unido[chave]) || 0) + 1);
                relogioSerializado = JSON.stringify(unido);
                await db.configuracoes.put({ chave: 'aurora_config_modificados_em', valor: relogioSerializado });
            }
        });
        sucessoIndexedDB = true;
    } catch (e) {
        console.error('Falha ao salvar configuração e seu relógio no IndexedDB:', chave, e);
        await registrarDiagnosticoSeguro('db.salvar_configuracao', e, { chave: String(chave).slice(0, 80) });
        if (registraRelogio && !relogioSerializado) {
            relogioLocal[chave] = Math.max(agoraRelogio, (Number(relogioLocal[chave]) || 0) + 1);
            relogioSerializado = JSON.stringify(relogioLocal);
        }
    }

    let sucessoLocal = false;
    try {
        localStorage.setItem(chave, valorSerializado);
        if (relogioSerializado) localStorage.setItem('aurora_config_modificados_em', relogioSerializado);
        sucessoLocal = true;
    } catch (e) { console.error('localStorage indisponível para', chave, e); }

    // Evita recursão em 'aurora_atualizado_em'; afetaSincronizacao=false é
    // para configs cosméticas que não devem contar como "dado novo".
    if (chave !== 'aurora_atualizado_em' && afetaSincronizacao) await marcarAtualizacaoLocal(imediato);

    return sucessoLocal || sucessoIndexedDB;
}

// Remove uma configuração (localStorage + IndexedDB) e sincroniza a
// remoção. Usado para resets parciais (termômetro, contrato — ver
// js/preservacao.js). Proteção permanente: só deixa apagar chaves que
// estão explicitamente na lista branca de js/preservacao.js — qualquer
// outra chave (dado do pedido, vídeo, fotos, cartas, mensagens, easter
// eggs, etc.) é recusada, mesmo que alguma função tente no futuro.
async function excluirConfiguracao(chave, imediato = true) {
    // Só permite apagar se js/preservacao.js confirmar explicitamente que a
    // chave está na lista branca de chaves resetáveis. Se preservacao.js não
    // tiver sido carregado nesta página por algum motivo, o padrão é RECUSAR
    // (nunca permitir por omissão) — protege mesmo que essa checagem falhe.
    const podeApagar = typeof chaveConfigPodeSerApagada === 'function' && chaveConfigPodeSerApagada(chave);
    if (!podeApagar) {
        console.error(`excluirConfiguracao bloqueada: "${chave}" é um dado permanente (ou a proteção de js/preservacao.js não está carregada) e não pode ser apagado por nenhum reset.`);
        return false;
    }
    const agora = Date.now();
    let valorAnterior = null;
    let mapaLocal = {};
    try { mapaLocal = JSON.parse(localStorage.getItem('aurora_config_excluidas_em') || '{}'); } catch (_) { mapaLocal = {}; }
    if (!mapaLocal || typeof mapaLocal !== 'object' || Array.isArray(mapaLocal)) mapaLocal = {};
    try {
        valorAnterior = await db.configuracoes.get(chave);
        let serializado = null;
        await db.transaction('rw', db.configuracoes, async () => {
            const registro = await db.configuracoes.get('aurora_config_excluidas_em');
            let mapaDb = {};
            try { mapaDb = JSON.parse(registro?.valor || '{}'); } catch (_) { mapaDb = {}; }
            if (!mapaDb || typeof mapaDb !== 'object' || Array.isArray(mapaDb)) mapaDb = {};
            const mapa = Object.assign({}, mapaDb);
            for (const [id, tempo] of Object.entries(mapaLocal)) {
                mapa[id] = Math.max(Number(mapa[id]) || 0, Number(tempo) || 0);
            }
            mapa[chave] = Math.max(agora, (Number(mapa[chave]) || 0) + 1);
            serializado = JSON.stringify(mapa);
            await db.configuracoes.delete(chave);
            await db.configuracoes.put({ chave: 'aurora_config_excluidas_em', valor: serializado });
        });
        try { localStorage.removeItem(chave); } catch (e) { console.error('Falha ao remover do localStorage:', chave, e); }
        try { localStorage.setItem('aurora_config_excluidas_em', serializado); } catch (_) { /* IndexedDB basta */ }
    } catch (e) {
        console.error('Falha ao registrar exclusão da configuração:', chave, e);
        // IndexedDB é a fonte de verdade: restaura o espelho para não dar a
        // impressão de exclusão quando a transação durável falhou.
        if (valorAnterior) {
            try { localStorage.setItem(chave, typeof valorAnterior.valor === 'string' ? valorAnterior.valor : JSON.stringify(valorAnterior.valor)); } catch (_) { /* aviso abaixo basta */ }
        }
        await registrarDiagnosticoSeguro('db.excluir_configuracao', e, { chave: String(chave).slice(0, 80) });
        return false;
    }
    await marcarAtualizacaoLocal(imediato);
    return true;
}

async function obterConfiguracao(chave) {
    // Se uma escrita recente conseguiu chegar ao localStorage mas o
    // IndexedDB falhou temporariamente (cota/transação interrompida), o
    // relógio local fica maior que o relógio durável. Nesse caso o valor local
    // é a cópia mais nova: tenta reparar o banco e nunca o sobrescreve com a
    // versão antiga.
    if (!['aurora_config_modificados_em', 'aurora_config_excluidas_em'].includes(chave)) {
        try {
            const valorLocal = localStorage.getItem(chave);
            const mapaLocal = JSON.parse(localStorage.getItem('aurora_config_modificados_em') || '{}');
            const registroMapaDb = await db.configuracoes.get('aurora_config_modificados_em');
            let mapaDb = {};
            try { mapaDb = JSON.parse(registroMapaDb?.valor || '{}'); } catch (_) { mapaDb = {}; }
            if (valorLocal !== null && Number(mapaLocal[chave] || 0) > Number(mapaDb[chave] || 0)) {
                const mapaUnido = Object.assign({}, mapaDb);
                for (const [id, tempo] of Object.entries(mapaLocal)) {
                    mapaUnido[id] = Math.max(Number(mapaUnido[id]) || 0, Number(tempo) || 0);
                }
                try {
                    await db.transaction('rw', db.configuracoes, async () => {
                        await db.configuracoes.put({ chave, valor: valorLocal });
                        await db.configuracoes.put({ chave: 'aurora_config_modificados_em', valor: JSON.stringify(mapaUnido) });
                    });
                } catch (e) {
                    await registrarDiagnosticoSeguro('db.reparar_fallback_local', e, { chave: String(chave).slice(0, 80) });
                }
                return valorLocal;
            }
        } catch (_) { /* segue para a fonte durável normal */ }
    }

    // IndexedDB é a fonte de verdade. localStorage é apenas um espelho de
    // recuperação rápida; preferi-lo podia ressuscitar um valor antigo após
    // uma restauração concluída no banco.
    try {
        const registro = await db.configuracoes.get(chave);
        if (registro) {
            const valor = typeof registro.valor === 'string' ? registro.valor : JSON.stringify(registro.valor);
            try { if (localStorage.getItem(chave) !== valor) localStorage.setItem(chave, valor); } catch (_) { /* espelho opcional */ }
            return valor;
        }
    } catch (e) {
        await registrarDiagnosticoSeguro('db.ler_configuracao', e, { chave: String(chave).slice(0, 80) });
    }
    try {
        const local = localStorage.getItem(chave);
        if (local !== null) {
            try { await db.configuracoes.put({ chave, valor: local }); } catch (_) { /* mantém fallback */ }
            return local;
        }
    } catch (_) { /* nenhum armazenamento disponível */ }
    return null;
}

// Mantém o legado legível, mas cada texto novo tem sua própria chave.
function unirItensMural(listas) {
    const porId = new Map();
    const tempo = valor => Number(valor) || Date.parse(valor || '') || 0;
    for (const item of listas.flat()) {
        if (!item || !item.id || typeof item.texto !== 'string') continue;
        const anterior = porId.get(item.id);
        const versao = valor => Math.max(tempo(valor?.atualizadoEm), tempo(valor?.data));
        const unido = !anterior || versao(item) >= versao(anterior) ? { ...anterior, ...item } : { ...item, ...anterior };
        const exclusao = Math.max(tempo(anterior?.excluidoEm), tempo(item.excluidoEm));
        if (exclusao && exclusao >= Math.max(versao(item), versao(anterior))) unido.excluidoEm = new Date(exclusao).toISOString();
        porId.set(item.id, unido);
    }
    return [...porId.values()].sort((a, b) => tempo(a.data) - tempo(b.data) || String(a.id).localeCompare(String(b.id)));
}

async function obterMensagensMural() {
    const legado = JSON.parse(await obterConfiguracao('aurora_mural_ana') || '[]');
    if (!Array.isArray(legado)) throw new Error('O mural salvo está em um formato inválido. Nada foi apagado.');
    const registros = await db.configuracoes.where('chave').startsWith('aurora_mural_item:').toArray();
    const individuais = registros.map(item => JSON.parse(item.valor));
    // Inclui também uma escrita que só tenha conseguido chegar ao espelho.
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            if (chave?.startsWith('aurora_mural_item:')) individuais.push(JSON.parse(localStorage.getItem(chave)));
        }
    } catch (_) { /* a fonte principal já foi lida */ }
    return unirItensMural([legado, individuais]);
}

async function salvarMensagemMural(item) {
    if (!item?.id || typeof item.texto !== 'string') throw new Error('Mensagem inválida.');
    return salvarConfiguracao(`aurora_mural_item:${item.id}`, JSON.stringify(item));
}

/* ---------------- Armazenamento persistente e estimativa de espaço ----------------
   Pede ao navegador para não apagar os dados do site sob pressão de espaço. */
async function solicitarArmazenamentoPersistente() {
    if (!(navigator.storage && navigator.storage.persist)) {
        return { suportado: false, concedido: false };
    }
    try {
        const jaPersistente = navigator.storage.persisted ? await navigator.storage.persisted() : false;
        if (jaPersistente) return { suportado: true, concedido: true, jaEstava: true };
        const concedido = await navigator.storage.persist();
        return { suportado: true, concedido };
    } catch (e) {
        console.error('Falha ao solicitar armazenamento persistente:', e);
        return { suportado: true, concedido: false, erro: String(e) };
    }
}

async function obterEstimativaArmazenamento() {
    if (!(navigator.storage && navigator.storage.estimate)) return null;
    try {
        const estimativa = await navigator.storage.estimate();
        return {
            usadoMB: estimativa.usage ? +(estimativa.usage / (1024 * 1024)).toFixed(1) : null,
            totalMB: estimativa.quota ? +(estimativa.quota / (1024 * 1024)).toFixed(1) : null
        };
    } catch (e) {
        console.error('Falha ao obter estimativa de armazenamento:', e);
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        db,
        gerarCodigoDiagnostico,
        registrarDiagnosticoSeguro,
        marcarAtualizacaoLocal,
        salvarMedia,
        obterMedia,
        obterMediaPorTipo,
        excluirMedia,
        salvarConfiguracao,
        excluirConfiguracao,
        obterConfiguracao
        ,unirItensMural, obterMensagensMural, salvarMensagemMural
    };
}
