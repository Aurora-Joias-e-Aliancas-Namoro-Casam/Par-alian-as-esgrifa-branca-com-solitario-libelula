/**
 * ============================================================================
 * DIAGNOSTICS.JS — Painel de verificação (usado só em diagnostico.html)
 * ============================================================================
 * Roda uma bateria de testes REAIS (não apenas "parece que sim"): escreve
 * e lê de verdade no IndexedDB, mede o espaço disponível, confere suporte
 * a gravação de câmera/microfone e, se configurado, testa a conexão com a
 * nuvem fazendo upload + download reais de um arquivo de teste.
 *
 * Esta página é separada da experiência principal de propósito: você
 * (Gabriel) pode abrir só para conferir se está tudo certo, sem nenhum
 * risco de a Poloni ver algo fora de hora.
 * ============================================================================
 */

function criarBlobDeTeste(tamanhoBytes) {
    // Gera um Blob de tamanho controlado para simular fotos/vídeos reais
    // sem precisar de nenhum arquivo de verdade.
    const bloco = new Uint8Array(tamanhoBytes);
    for (let i = 0; i < bloco.length; i++) bloco[i] = i % 256;
    return new Blob([bloco], { type: 'application/octet-stream' });
}

async function testeIndexedDbDisponivel() {
    if (!window.indexedDB) return { ok: false, motivo: 'Este navegador não suporta IndexedDB.' };
    return { ok: true, motivo: 'Disponível.' };
}

async function testeBancoAbre() {
    try {
        await db.open();
        return { ok: true, motivo: `Banco "AuroraDB" aberto (versão ${db.verno}).` };
    } catch (e) {
        return { ok: false, motivo: `Falha ao abrir o banco: ${e.message}` };
    }
}

async function testeConfiguracaoTextoSimples() {
    const chave = 'diagnostico_config_teste';
    const valor = `ok_${Date.now()}`;
    try {
        await salvarConfiguracao(chave, valor);
        const lido = await obterConfiguracao(chave);
        localStorage.removeItem(chave);
        try { await db.configuracoes.delete(chave); } catch (e) {}
        if (lido !== valor) return { ok: false, motivo: `Valor lido ("${lido}") não bate com o gravado ("${valor}").` };
        return { ok: true, motivo: 'Escrita e leitura de configurações simples funcionando.' };
    } catch (e) {
        return { ok: false, motivo: `Erro: ${e.message}` };
    }
}

async function testeBlobRoundtrip(tamanhoBytes, rotulo) {
    const id = `diagnostico_blob_${Date.now()}`;
    const inicio = performance.now();
    try {
        const blobOriginal = criarBlobDeTeste(tamanhoBytes);
        const salvou = await salvarMedia({ id, tipo: 'diagnostico', blob: blobOriginal, mimeType: 'application/octet-stream' });
        if (!salvou) return { ok: false, motivo: `Falha ao salvar o arquivo de teste de ${rotulo}.` };

        const relido = await obterMedia(id);
        await excluirMedia(id);

        if (!relido || !relido.blob) return { ok: false, motivo: 'Registro não encontrado após salvar.' };
        if (relido.blob.size !== blobOriginal.size) return { ok: false, motivo: `Tamanho não confere (esperado ${blobOriginal.size}, obtido ${relido.blob.size}).` };

        const duracaoMs = Math.round(performance.now() - inicio);
        return { ok: true, motivo: `${rotulo} (${(tamanhoBytes / (1024 * 1024)).toFixed(1)}MB) salvo e lido corretamente em ${duracaoMs}ms.` };
    } catch (e) {
        console.error(e);
        return { ok: false, motivo: `Erro: ${e.message}` };
    }
}

async function testeEstimativaArmazenamento() {
    const estimativa = await obterEstimativaArmazenamento();
    if (!estimativa) return { ok: null, motivo: 'Este navegador não informa estimativa de espaço (não é um erro).' };
    const livre = estimativa.totalMB ? (estimativa.totalMB - (estimativa.usadoMB || 0)).toFixed(1) : '?';
    const alerta = estimativa.totalMB && (estimativa.totalMB - estimativa.usadoMB) < 200;
    return {
        ok: !alerta,
        motivo: `Em uso: ${estimativa.usadoMB ?? '?'}MB de ${estimativa.totalMB ?? '?'}MB disponíveis (≈${livre}MB livres).${alerta ? ' Pouco espaço livre — considere liberar armazenamento do aparelho.' : ''}`
    };
}

async function testeArmazenamentoPersistente() {
    const resultado = await solicitarArmazenamentoPersistente();
    if (!resultado.suportado) return { ok: null, motivo: 'Este navegador não suporta armazenamento persistente (não é um erro — é comum no Safari mais antigo).' };
    if (resultado.jaEstava) return { ok: true, motivo: 'Já estava concedido.' };
    // Importante: o navegador pode legitimamente recusar essa concessão (por
    // política própria, ex: exigir mais "engajamento" prévio do site) mesmo
    // com tudo implementado corretamente. Isso NÃO é um bug do site — por
    // isso tratamos como informativo (neutro), nunca como erro vermelho.
    return {
        ok: resultado.concedido ? true : null,
        motivo: resultado.concedido
            ? 'Concedido agora com sucesso.'
            : 'O navegador não concedeu desta vez (decisão do próprio navegador, não do site — não impede nada de funcionar, só reduz uma garantia extra contra limpeza automática de dados antigos).'
    };
}

async function testeSuporteGravacao() {
    const temGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const temMediaRecorder = !!window.MediaRecorder;
    if (!temGetUserMedia || !temMediaRecorder) {
        return { ok: false, motivo: `getUserMedia: ${temGetUserMedia ? 'sim' : 'NÃO'} · MediaRecorder: ${temMediaRecorder ? 'sim' : 'NÃO'}.` };
    }
    const mimeVideo = getSupportedMimeType();
    const mimeAudio = getSupportedMimeTypeParaModo('audio');
    return { ok: true, motivo: `Suportado. Vídeo: ${mimeVideo || 'formato padrão do navegador'} · Áudio: ${mimeAudio || 'formato padrão do navegador'}.` };
}

async function testeConfiguracaoNuvem() {
    if (!syncEstaConfigurado()) {
        return { ok: null, motivo: 'Sincronização não configurada em js/sync.js — o site funciona normalmente, mas "Compartilhar" só abre neste aparelho. Preencha SUPABASE_URL e SUPABASE_ANON_KEY para ativar.' };
    }
    const formato = validarFormatoAnonKey(SUPABASE_ANON_KEY);
    if (!formato.ok) return { ok: false, motivo: `Chave configurada, mas com problema de formato: ${formato.motivo}` };
    return { ok: true, motivo: `Formato da chave ok (${formato.motivo}). Use os botões abaixo para um teste completo: "Testar conexão com a nuvem" (JSON pequeno) e "Testar upload de mídia real" (arquivo binário de alguns MB, o que realmente importa para fotos e vídeos).` };
}

/**
 * Executa todos os testes locais (rápidos) e exibe o resultado. O teste
 * de nuvem completo (upload/download reais) fica em um botão separado
 * porque depende de rede e pode demorar um pouco mais.
 */
async function executarDiagnosticoCompleto() {
    const lista = document.getElementById('diagLista');
    const resumo = document.getElementById('diagResumo');
    lista.innerHTML = '';
    resumo.className = 'diag-resumo diag-pending';
    resumo.textContent = 'Executando verificações...';

    // Impede que os testes abaixo (que salvam/apagam dados de verdade no
    // banco, só pra confirmar que ler/escrever funciona) disparem uma
    // sincronização real com a nuvem — ver agendarEnvioNuvem em js/sync.js.
    window.__auroraSuprimirSyncDiagnostico = true;

    try {
        const testes = [
            ['IndexedDB disponível neste navegador', testeIndexedDbDisponivel],
            ['Banco de dados abre corretamente', testeBancoAbre],
            ['Configurações simples (escrita + leitura)', testeConfiguracaoTextoSimples],
            ['Arquivo pequeno (≈50KB, simula uma foto)', () => testeBlobRoundtrip(50 * 1024, 'Arquivo pequeno')],
            ['Arquivo grande (≈8MB, simula um vídeo curto)', () => testeBlobRoundtrip(8 * 1024 * 1024, 'Arquivo grande')],
            ['Espaço de armazenamento disponível', testeEstimativaArmazenamento],
            ['Armazenamento persistente (proteção contra limpeza automática)', testeArmazenamentoPersistente],
            ['Suporte a gravação de câmera/microfone', testeSuporteGravacao],
            ['Configuração de sincronização na nuvem', testeConfiguracaoNuvem]
        ];

        var todosOk = true;
        for (const [nome, fn] of testes) {
            const item = document.createElement('li');
            item.className = 'diag-item diag-rodando';
            item.innerHTML = `<i class="bi bi-hourglass-split"></i><div><strong>${nome}</strong><p>Verificando...</p></div>`;
            lista.appendChild(item);

            let resultado;
            try { resultado = await fn(); } catch (e) { resultado = { ok: false, motivo: `Erro inesperado: ${e.message}` }; }

            item.classList.remove('diag-rodando');
            if (resultado.ok === true) { item.classList.add('diag-ok'); item.querySelector('i').className = 'bi bi-check-circle-fill'; }
            else if (resultado.ok === false) { item.classList.add('diag-erro'); item.querySelector('i').className = 'bi bi-x-circle-fill'; todosOk = false; }
            else { item.classList.add('diag-neutro'); item.querySelector('i').className = 'bi bi-info-circle-fill'; }
            item.querySelector('p').textContent = resultado.motivo;
        }
    } finally {
        window.__auroraSuprimirSyncDiagnostico = false;
    }

    resumo.className = todosOk ? 'diag-resumo diag-ok' : 'diag-resumo diag-erro';
    resumo.innerHTML = todosOk
        ? '<i class="bi bi-check-circle-fill me-2"></i>Tudo certo! O armazenamento local está funcionando perfeitamente.'
        : '<i class="bi bi-exclamation-triangle-fill me-2"></i>Encontrei pelo menos um problema acima — dá uma olhada nos detalhes em vermelho.';
}

async function executarTesteNuvem() {
    const btn = document.getElementById('btnTestarNuvem');
    const resultadoEl = document.getElementById('diagResultadoNuvem');
    btn.disabled = true;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Testando...';
    resultadoEl.textContent = '';
    resultadoEl.className = 'save-status pending';

    const resultado = await testarConexaoNuvem();

    btn.disabled = false;
    btn.innerHTML = textoOriginal;
    resultadoEl.textContent = resultado.motivo;
    resultadoEl.className = `save-status ${resultado.ok ? 'ok' : 'err'}`;
}

async function executarTesteMediaReal() {
    const btn = document.getElementById('btnTestarMediaReal');
    const resultadoEl = document.getElementById('diagResultadoMediaReal');
    btn.disabled = true;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando 8MB de teste...';
    resultadoEl.textContent = '';
    resultadoEl.className = 'save-status pending';

    const resultado = await testarUploadMediaReal();

    btn.disabled = false;
    btn.innerHTML = textoOriginal;
    resultadoEl.textContent = resultado.motivo;
    resultadoEl.className = `save-status ${resultado.ok ? 'ok' : 'err'}`;
}

function formatarDataHoraDiag(timestampMs) {
    if (!timestampMs) return '— (nunca)';
    const d = new Date(timestampMs);
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR')} (${timestampMs})`;
}

/**
 * Mostra lado a lado o que ESTE aparelho pensa que é o estado atual e o
 * que a nuvem realmente tem agora — lendo os MESMOS valores que
 * sincronizarNaAbertura() usa para decidir entre puxar/empurrar/resetar,
 * sem nenhuma lógica escondida. É o jeito mais direto de ver, com dados
 * reais, por que um reset não chegou (ou chegou) em outro aparelho.
 */
async function executarVerEstadoReset() {
    const btn = document.getElementById('btnVerEstadoReset');
    const painel = document.getElementById('diagEstadoReset');
    btn.disabled = true;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Consultando...';
    painel.classList.remove('d-none');
    painel.innerHTML = '<p class="text-white-50 mb-0">Consultando armazenamento local e a nuvem...</p>';

    try {
        // --- Local ---
        const timestampLocal = parseInt(await obterConfiguracao('aurora_atualizado_em'), 10) || 0;
        const stageLocal = (await obterConfiguracao('aurora_stage')) || '(vazio)';
        const dataPedidoLocal = (await obterConfiguracao('aurora_data_pedido')) || '(vazio)';
        const videoLocal = await obterMedia('video_pedido');
        const assinaturaLocal = await obterMedia('assinatura');

        // --- Nuvem (leitura direta, sem cache, mesmo caminho que sincronizarNaAbertura usa) ---
        let meta = null;
        let erroNuvem = null;
        if (syncEstaConfigurado()) {
            try { meta = await buscarMetaDaNuvem(EXPERIENCE_ID); } catch (err) { erroNuvem = err.message; }
        }
        const timestampNuvem = (meta && meta.atualizadoEm) ? meta.atualizadoEm : 0;
        const nuvemFoiResetada = Boolean(meta && meta.resetado);

        // --- O que sincronizarNaAbertura() faria com esses valores agora ---
        const resetPendente = nuvemFoiResetada && timestampNuvem > timestampLocal;
        let decisao;
        if (!syncEstaConfigurado()) decisao = 'Sincronização não configurada — nada acontece.';
        else if (resetPendente) decisao = 'RESETARIA este aparelho agora (a nuvem tem um reset mais novo que este aparelho ainda não viu).';
        else if (meta && !nuvemFoiResetada && timestampNuvem > timestampLocal) decisao = 'PUXARIA da nuvem agora (a nuvem tem dados mais novos).';
        else if (timestampLocal > 0 && timestampLocal >= timestampNuvem) decisao = 'EMPURRARIA os dados deste aparelho para a nuvem agora (este aparelho está "à frente" ou empatado).';
        else decisao = 'Não faria nada (nada em nenhum dos dois lados).';

        painel.innerHTML = `
            <h6>Este aparelho (local)</h6>
            <div class="linha"><span>aurora_stage</span><span>${stageLocal}</span></div>
            <div class="linha"><span>aurora_data_pedido</span><span>${dataPedidoLocal}</span></div>
            <div class="linha"><span>aurora_atualizado_em</span><span>${formatarDataHoraDiag(timestampLocal)}</span></div>
            <div class="linha"><span>vídeo do pedido salvo?</span><span>${videoLocal && videoLocal.blob ? `sim (${(videoLocal.blob.size / (1024 * 1024)).toFixed(1)}MB)` : 'não'}</span></div>
            <div class="linha"><span>assinatura salva?</span><span>${assinaturaLocal && assinaturaLocal.texto ? 'sim' : 'não'}</span></div>

            <h6>Nuvem (meta.json agora)</h6>
            ${erroNuvem ? `<div class="linha"><span>Erro ao consultar</span><span>${erroNuvem}</span></div>` : `
            <div class="linha"><span>existe?</span><span>${meta ? 'sim' : 'não (nunca sincronizado, ou já foi apagado)'}</span></div>
            <div class="linha"><span>resetado</span><span>${nuvemFoiResetada ? 'true' : 'false'}</span></div>
            <div class="linha"><span>atualizadoEm</span><span>${formatarDataHoraDiag(timestampNuvem)}</span></div>
            <div class="linha"><span>partes do backup</span><span>${meta && meta.partes ? meta.partes : '1 (ou desconhecido)'}</span></div>
            `}

            <div class="veredito ${erroNuvem ? 'alerta' : (resetPendente ? 'alerta' : 'ok')}">${decisao}</div>
        `;
    } catch (err) {
        painel.innerHTML = `<p class="text-danger mb-0">Falha ao consultar: ${err.message}</p>`;
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}

/** Confere (via HEAD, sem baixar o arquivo inteiro) se um caminho existe no servidor. */
async function galeriaArquivoExiste(caminho) {
    try {
        const resposta = await fetch(`${caminho}?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
        return resposta.ok;
    } catch (err) {
        return false;
    }
}

/** Mesma lógica de descoberta usada em js/galeria.js — duplicada aqui só pra não precisar carregar o arquivo inteiro nesta página. */
async function galeriaDescobrirItem(numero) {
    // Testa maiúsculo e minúsculo (iPhone às vezes exporta extensão em
    // maiúsculo, e servidores estáticos costumam ser case-sensitive).
    const candidatos = [
        ...GALERIA_EXTENSOES_FOTO.flatMap(ext => ([{ ext, tipo: 'foto' }, { ext: ext.toUpperCase(), tipo: 'foto' }])),
        ...GALERIA_EXTENSOES_VIDEO.flatMap(ext => ([{ ext, tipo: 'video' }, { ext: ext.toUpperCase(), tipo: 'video' }]))
    ];
    const resultados = await Promise.all(candidatos.map(async (c) => {
        const caminho = `${PASTA_GALERIA}/galeria_${numero}.${c.ext}`;
        const existe = await galeriaArquivoExiste(caminho);
        return existe ? { caminho, tipo: c.tipo } : null;
    }));
    return resultados.find(r => r !== null) || null;
}

async function executarTesteGaleria() {
    const btn = document.getElementById('btnTestarGaleria');
    const painel = document.getElementById('diagGaleriaResultado');
    btn.disabled = true;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Testando...';
    painel.classList.remove('d-none');
    painel.innerHTML = '<p class="text-white-50 mb-0">Procurando itens em assets/img/galeria/...</p>';

    const linhasHtml = [];
    let numero = 1;
    let lacunaAtual = 0;
    let totalEncontrado = 0;
    const LACUNA_PARA_PARAR = (typeof GALERIA_LACUNA_PARA_PARAR === 'number') ? GALERIA_LACUNA_PARA_PARAR : 6;
    const MAX_NUMERO = (typeof GALERIA_MAX_NUMERO === 'number') ? GALERIA_MAX_NUMERO : 500;

    const TAMANHO_LOTE = 8;
    while (numero <= MAX_NUMERO && lacunaAtual < LACUNA_PARA_PARAR) {
        const numerosDoLote = [];
        for (let i = 0; i < TAMANHO_LOTE; i++) numerosDoLote.push(numero + i);
        const resultados = await Promise.all(numerosDoLote.map(n => galeriaDescobrirItem(n)));

        for (let i = 0; i < resultados.length; i++) {
            if (resultados[i]) {
                lacunaAtual = 0;
                totalEncontrado++;
                linhasHtml.push(`<div class="linha ok"><span>#${numerosDoLote[i]} (${resultados[i].tipo})</span><span>✓ ${resultados[i].caminho}</span></div>`);
            } else {
                lacunaAtual++;
                if (lacunaAtual >= LACUNA_PARA_PARAR) break;
            }
        }
        numero += TAMANHO_LOTE;
    }

    let veredito;
    if (totalEncontrado === 0) {
        veredito = { classe: 'alerta', texto: `Nenhum item encontrado em assets/img/galeria/. Confira se os arquivos existem e se o nome está exatamente como "galeria_1.jpg", "galeria_2.mp4", etc. (minúsculo, sem espaços). Atenção especial a fotos do iPhone: se o arquivo for .HEIC, precisa ser convertido para .jpg antes, porque a maioria dos navegadores não exibe HEIC diretamente.` };
    } else {
        veredito = { classe: 'ok', texto: `${totalEncontrado} item(ns) encontrado(s) automaticamente (parou de procurar depois de ${LACUNA_PARA_PARAR} números seguidos sem nada — normal). Se algum item que você colocou não aparece na lista acima, confira o nome exato do arquivo.` };
    }

    painel.innerHTML = linhasHtml.join('') + `<div class="veredito ${veredito.classe}">${veredito.texto}</div>`;

    btn.disabled = false;
    btn.innerHTML = textoOriginal;
}

/**
 * SENHA DO RESET (proteção contra toque acidental — ver SENHA_RESET_SITE em
 * js/config.js). Movido de js/export.js + index.html para cá a pedido do
 * usuário, para tirar o botão do site principal (a Poloni nunca vê essa
 * página). Mesma proteção por senha de antes, sem nenhuma mudança de
 * comportamento nesse quesito.
 */
function solicitarSenhaReset() {
    return new Promise((resolve) => {
        const overlay = document.getElementById('senhaResetOverlay');
        const input = document.getElementById('senhaResetInput');
        const erro = document.getElementById('senhaResetErro');
        if (!overlay || !input) { resolve(false); return; }

        overlay.classList.remove('d-none');
        erro.classList.add('d-none');
        input.value = '';
        setTimeout(() => input.focus(), 300);

        function fechar(resultado) {
            overlay.classList.add('d-none');
            document.getElementById('btnSenhaResetEntrar').onclick = null;
            document.getElementById('btnSenhaResetCancelar').onclick = null;
            input.onkeydown = null;
            resolve(resultado);
        }

        function tentarConfirmar() {
            const senhaDigitada = (input.value || '').trim();
            if (senhaDigitada === SENHA_RESET_SITE) {
                fechar(true);
            } else {
                erro.classList.remove('d-none');
                input.value = '';
                input.focus();
                overlay.querySelector('.senha-memorias-box').classList.remove('senha-shake');
                void overlay.offsetWidth; // força reflow para reiniciar a animação de "errado"
                overlay.querySelector('.senha-memorias-box').classList.add('senha-shake');
            }
        }

        document.getElementById('btnSenhaResetEntrar').onclick = tentarConfirmar;
        document.getElementById('btnSenhaResetCancelar').onclick = () => fechar(false);
        input.onkeydown = (evt) => { if (evt.key === 'Enter') tentarConfirmar(); };
    });
}

async function executarReset() {
    const senhaOk = await solicitarSenhaReset();
    if (!senhaOk) return;

    if (!confirm('Isso vai apagar TUDO o que foi salvo — neste aparelho e no outro (vídeo, assinatura, mensagens, fotos, polaroid e progresso). Essa ação não pode ser desfeita. Continuar?')) return;

    const botao = document.getElementById('btnResetar');
    const status = document.getElementById('resetarStatus');
    if (botao) { botao.disabled = true; botao.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Resetando...'; }
    if (status) { status.textContent = 'Publicando o reset na nuvem (pode levar alguns segundos — tenta de novo automaticamente se a rede falhar)...'; status.className = 'save-status'; }

    // 1) Nuvem (fonte oficial entre aparelhos) — a parte CRÍTICA é
    //    sobrescrever o meta.json com a marca de reset (ver
    //    publicarResetNaNuvem em js/sync.js, que agora tenta várias vezes e
    //    CONFIRMA lendo de volta antes de considerar sucesso): é isso que
    //    qualquer outro aparelho confere ao abrir o link, pra saber que
    //    precisa se limpar também. Apagar o .zip antigo é só limpeza, não
    //    crítico, por isso roda em paralelo sem bloquear.
    try { await apagarZipDaNuvem(); } catch (e) { console.error('Falha ao apagar o zip antigo na nuvem (não crítico)', e); }

    try {
        await publicarResetNaNuvem();
        if (status) { status.textContent = 'Reset confirmado na nuvem. Limpando este aparelho...'; status.className = 'save-status ok'; }
    } catch (e) {
        console.error('Falha ao publicar o reset na nuvem', e);
        if (status) {
            status.textContent = 'Não consegui confirmar o reset na nuvem depois de várias tentativas (sem internet agora?). NADA foi apagado ainda — verifique a conexão e toque em "Resetar site" de novo. Resetar só localmente, sem a nuvem confirmar, é o que fazia o outro aparelho continuar com os dados antigos.';
            status.className = 'save-status err';
        }
        if (botao) { botao.disabled = false; botao.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Resetar site'; }
        return; // não limpa local nem recarrega — evita a experiência "resetou aqui mas não na nuvem"
    }

    // 2) Só chega aqui se a nuvem CONFIRMOU o reset — agora sim, limpa o armazenamento local (IndexedDB + localStorage + sessionStorage + cache).
    await limparArmazenamentoLocal();

    location.reload();
}

async function executarTesteCapsula() {
    const botao = document.getElementById('btnTestarCapsula');
    const resultado = document.getElementById('capsulaTesteResultado');
    if (botao) { botao.disabled = true; botao.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Calculando...'; }
    resultado.innerHTML = '';

    try {
        const dataPedidoIso = await obterConfiguracao('aurora_data_pedido');
        if (!dataPedidoIso) {
            resultado.innerHTML = `<div class="diag-resumo diag-pending">Ainda não existe uma data de pedido salva neste aparelho, então não dá pra calcular o desbloqueio ainda. Faça o pedido primeiro (ou pelo menos chegue até essa etapa) e teste de novo.</div>`;
            return;
        }

        const dataAlvo = new Date(dataPedidoIso);
        dataAlvo.setDate(dataAlvo.getDate() + CAPSULA_DIAS_PARA_DESBLOQUEIO);
        const agora = await obterHoraConfiavel(); // mesma fonte de hora usada na checagem real (servidor, não o aparelho)
        const desbloqueada = agora >= dataAlvo;
        const diasRestantes = Math.max(0, Math.ceil((dataAlvo - agora) / 86400000));

        const fmt = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        let html = `<div class="diag-resumo ${desbloqueada ? 'diag-ok' : 'diag-pending'}">
            ${desbloqueada ? 'Já passou da data — a cápsula abriria normalmente hoje.' : `Ainda faltam ${diasRestantes} dia${diasRestantes === 1 ? '' : 's'} pra cápsula abrir de verdade.`}
        </div>
        <div class="diag-item diag-ok mb-2">
            <i class="bi bi-calendar-event"></i>
            <div><strong>Datas calculadas</strong><p>Pedido: ${fmt(new Date(dataPedidoIso))} · Desbloqueio: ${fmt(dataAlvo)} (${CAPSULA_DIAS_PARA_DESBLOQUEIO} dias depois) · Hora do servidor agora: ${agora.toLocaleString('pt-BR')}</p></div>
        </div>`;

        // Prévia do texto — mesmo texto que vai aparecer de verdade, com o nome dela já trocado.
        const textoPreview = (typeof textoCapsulaDoTempo === 'function' ? textoCapsulaDoTempo() : '(textoCapsulaDoTempo não encontrada)').replace(/\n/g, '<br>');
        html += `<div class="diag-item diag-ok mb-2" style="text-align:left;">
            <i class="bi bi-envelope-paper"></i>
            <div><strong>Prévia do texto da carta</strong><p style="color:#f0d9dd; font-style: italic;">${textoPreview}</p><p>Assinatura: Com amor, ${NOME_DELE}.</p></div>
        </div>`;

        if (typeof CAPSULA_YOUTUBE_ID !== 'undefined' && CAPSULA_YOUTUBE_ID) {
            html += `<div class="diag-item diag-ok"><i class="bi bi-youtube"></i><div><strong>Botão do vídeo</strong><p>Vai aparecer, apontando para: https://www.youtube.com/watch?v=${CAPSULA_YOUTUBE_ID}</p></div></div>`;
        } else {
            html += `<div class="diag-item diag-pending"><i class="bi bi-youtube"></i><div><strong>Botão do vídeo</strong><p>CAPSULA_YOUTUBE_ID ainda está vazio em js/config.js, então esse botão não vai aparecer.</p></div></div>`;
        }

        resultado.innerHTML = html;
    } catch (e) {
        resultado.innerHTML = `<div class="diag-resumo diag-erro">Deu erro tentando calcular: ${e.message}</div>`;
    } finally {
        if (botao) { botao.disabled = false; botao.innerHTML = '<i class="bi bi-envelope-paper me-1"></i>Ver prévia da cápsula'; }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnRodarDiagnostico').addEventListener('click', executarDiagnosticoCompleto);
    document.getElementById('btnTestarNuvem').addEventListener('click', executarTesteNuvem);
    document.getElementById('btnTestarMediaReal').addEventListener('click', executarTesteMediaReal);
    document.getElementById('btnVerEstadoReset').addEventListener('click', executarVerEstadoReset);
    document.getElementById('btnTestarGaleria').addEventListener('click', executarTesteGaleria);
    document.getElementById('btnResetar').addEventListener('click', executarReset);
    document.getElementById('btnTestarCapsula').addEventListener('click', executarTesteCapsula);
    executarDiagnosticoCompleto();
});
