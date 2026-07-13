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

    let todosOk = true;
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

/** Confere (via HEAD, sem baixar o arquivo inteiro) se um caminho realmente existe no servidor. */
async function verificarArquivoExiste(caminho) {
    try {
        const resposta = await fetch(`${caminho}?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
        if (resposta.ok) return { ok: true };
        if (resposta.status === 404) return { ok: false, motivo: 'arquivo não encontrado — confira o nome EXATO (maiúsculas/minúsculas importam) e a extensão' };
        return { ok: false, motivo: `HTTP ${resposta.status}` };
    } catch (err) {
        return { ok: false, motivo: 'falha ao verificar (sem internet, ou aberto direto do arquivo em vez de um servidor)' };
    }
}

/**
 * Testa, um por um, cada item configurado na galeria (TOTAL_FOTOS_GALERIA
 * em js/config.js) e mostra exatamente qual arquivo existe ou não — em
 * vez de a galeria só "não mostrar nada" sem explicar o motivo.
 */
async function executarTesteGaleria() {
    const btn = document.getElementById('btnTestarGaleria');
    const painel = document.getElementById('diagGaleriaResultado');
    btn.disabled = true;
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Testando...';
    painel.classList.remove('d-none');
    painel.innerHTML = '<p class="text-white-50 mb-0">Testando cada item...</p>';

    if (typeof TOTAL_FOTOS_GALERIA !== 'number' || TOTAL_FOTOS_GALERIA <= 0) {
        painel.innerHTML = `
            <div class="veredito alerta">TOTAL_FOTOS_GALERIA está em ${TOTAL_FOTOS_GALERIA} em js/config.js — é por isso que a galeria aparece vazia. Depois de colocar os arquivos na pasta assets/img/galeria/, esse número precisa ser atualizado para a quantidade total de itens.</div>
        `;
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
        return;
    }

    const linhasHtml = [];
    let totalOk = 0;

    for (let numero = 1; numero <= TOTAL_FOTOS_GALERIA; numero++) {
        const ehVideo = ehVideoGaleria(numero);
        const ehYoutube = ehYoutubeGaleria(numero);
        const tipo = ehYoutube ? 'YouTube' : (ehVideo ? 'vídeo local' : 'foto');

        if (ehYoutube) {
            const bruto = (typeof YOUTUBE_GALERIA === 'object' && YOUTUBE_GALERIA[numero]) || '';
            const id = extrairIdYoutube(bruto);
            const ok = Boolean(id);
            if (ok) totalOk++;
            linhasHtml.push(`<div class="linha ${ok ? 'ok' : 'erro'}"><span>#${numero} (${tipo})</span><span>${ok ? `✓ ID: ${id}` : '✗ marcado como youtube mas SEM link em YOUTUBE_GALERIA'}</span></div>`);
        } else {
            const caminho = getAssetGaleria(numero);
            const resultado = await verificarArquivoExiste(caminho);
            if (resultado.ok) totalOk++;
            linhasHtml.push(`<div class="linha ${resultado.ok ? 'ok' : 'erro'}"><span>#${numero} (${tipo})</span><span>${resultado.ok ? `✓ ${caminho}` : `✗ ${caminho} — ${resultado.motivo}`}</span></div>`);
        }
    }

    const resumo = totalOk === TOTAL_FOTOS_GALERIA
        ? { classe: 'ok', texto: `Todos os ${TOTAL_FOTOS_GALERIA} itens foram encontrados corretamente.` }
        : { classe: 'alerta', texto: `${totalOk} de ${TOTAL_FOTOS_GALERIA} itens encontrados. Os marcados com ✗ acima não existem no caminho esperado — confira o nome exato do arquivo (minúsculo, sem espaços, "galeria_N.extensão") dentro de assets/img/galeria/. Atenção especial a fotos exportadas do iPhone: se o arquivo for .HEIC, ele precisa ser convertido para .jpg antes, porque a maioria dos navegadores não exibe HEIC diretamente.` };

    painel.innerHTML = linhasHtml.join('') + `<div class="veredito ${resumo.classe}">${resumo.texto}</div>`;

    btn.disabled = false;
    btn.innerHTML = textoOriginal;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnRodarDiagnostico').addEventListener('click', executarDiagnosticoCompleto);
    document.getElementById('btnTestarNuvem').addEventListener('click', executarTesteNuvem);
    document.getElementById('btnTestarMediaReal').addEventListener('click', executarTesteMediaReal);
    document.getElementById('btnVerEstadoReset').addEventListener('click', executarVerEstadoReset);
    document.getElementById('btnTestarGaleria').addEventListener('click', executarTesteGaleria);
    executarDiagnosticoCompleto();
});
