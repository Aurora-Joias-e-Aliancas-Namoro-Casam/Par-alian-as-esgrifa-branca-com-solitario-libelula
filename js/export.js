/**
 * ============================================================================
 * EXPORT.JS — Exportar lembranças (Prioridade 1, item 7) + Backup completo
 * ============================================================================
 * Formatos disponíveis:
 *   - Carta em imagem (PNG)
 *   - Carta em PDF elegante
 *   - Certificado de namoro (PDF, estilo "diploma")
 *   - Foto estilo Polaroid com legenda (PNG)
 * Além disso, mantém o backup/restauração completos (usados também pela
 * sincronização entre aparelhos — ver sync.js).
 * ============================================================================
 */

/* ---------------- Carta exportável (imagem / PDF) ---------------- */
function prepararCartaExportavel() {
    const textoFinal = textoVersiculoBase().replace(/\{AMOR\}/g, NOME_DELA);
    document.getElementById('cartaExportavelTexto').textContent = textoFinal;
    document.getElementById('cartaExportavelAssinatura').textContent = TEXTOS.assinaturaCartaFinal;
}

function mostrarStatusExportar(mensagem, tipo) {
    const statusEl = document.getElementById('exportarStatus');
    if (!statusEl) return;
    statusEl.textContent = mensagem;
    statusEl.className = tipo ? `save-status ${tipo}` : 'save-status';
}

async function exportarCartaComoImagem() {
    if (typeof html2canvas !== 'function') { mostrarStatusExportar('Não foi possível carregar o exportador de imagem. Verifique sua conexão.', 'err'); return; }
    mostrarStatusExportar('Gerando imagem da carta...', 'pending');
    prepararCartaExportavel();
    try {
        const canvas = await html2canvas(document.getElementById('cartaExportavel'), { backgroundColor: '#FBF7F0', scale: 2 });
        baixarCanvasComoPng(canvas, 'nossa-carta.png');
        mostrarStatusExportar('Imagem exportada com sucesso.', 'ok');
    } catch (err) {
        console.error('Falha ao exportar carta como imagem', err);
        mostrarStatusExportar('Não foi possível exportar a imagem.', 'err');
    }
}

async function exportarCartaComoPDF() {
    if (typeof html2canvas !== 'function' || typeof window.jspdf === 'undefined') { mostrarStatusExportar('Não foi possível carregar o exportador de PDF. Verifique sua conexão.', 'err'); return; }
    mostrarStatusExportar('Gerando PDF da carta...', 'pending');
    prepararCartaExportavel();
    try {
        const canvas = await html2canvas(document.getElementById('cartaExportavel'), { backgroundColor: '#FBF7F0', scale: 2 });
        salvarCanvasComoPdf(canvas, 'nossa-carta.pdf');
        mostrarStatusExportar('PDF exportado com sucesso.', 'ok');
    } catch (err) {
        console.error('Falha ao exportar carta como PDF', err);
        mostrarStatusExportar('Não foi possível exportar o PDF.', 'err');
    }
}

/* ---------------- Certificado de namoro (PDF estilo diploma) ---------------- */
async function exportarCertificadoNamoro() {
    if (typeof html2canvas !== 'function' || typeof window.jspdf === 'undefined') { mostrarStatusExportar('Não foi possível carregar o exportador. Verifique sua conexão.', 'err'); return; }
    mostrarStatusExportar('Gerando certificado...', 'pending');

    const dataPedidoIso = await obterConfiguracao('aurora_data_pedido');
    const dataTexto = dataPedidoIso ? formatarDataPedidoComHora(dataPedidoIso) : formatarDataPedidoComHora(new Date().toISOString());
    document.getElementById('certificadoData').textContent = dataTexto;
    document.getElementById('certificadoNomes').textContent = `${NOME_DELE_COMPLETO} & ${NOME_DELA_APELIDO}`;
    const el = document.getElementById('certificadoExportavel');

    try {
        const canvas = await html2canvas(el, { backgroundColor: '#FBF7F0', scale: 2 });
        salvarCanvasComoPdf(canvas, 'certificado-de-namoro.pdf');
        mostrarStatusExportar('Certificado exportado com sucesso.', 'ok');
    } catch (err) {
        console.error('Falha ao exportar certificado', err);
        mostrarStatusExportar('Não foi possível exportar o certificado.', 'err');
    }
}

/* ----------------------------------------------------------------------
   Foto estilo Polaroid com legenda — NOVO FLUXO (item 5 do prompt):
   1. clicar em "Gerar Polaroid" abre a câmera;
   2. tirar a foto naquele momento;
   3. confirmar ou tirar novamente;
   4. só então a Polaroid é gerada (com a data automática do pedido +
      frase personalizada opcional) e salva no banco, para aparecer em
      qualquer aparelho depois de sincronizar.
   ---------------------------------------------------------------------- */
let polaroidCameraStream = null;
let polaroidFotoCapturadaDataUrl = null;

async function abrirCameraPolaroid() {
    const modal = document.getElementById('polaroidCameraModal');
    if (!modal) return;
    modal.classList.remove('d-none');
    document.getElementById('polaroidCameraErro').classList.add('d-none');
    document.getElementById('polaroidCameraPreviewWrap').classList.remove('d-none');
    document.getElementById('polaroidCameraConfirmWrap').classList.add('d-none');

    try {
        polaroidCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        document.getElementById('polaroidCameraVideo').srcObject = polaroidCameraStream;
    } catch (err) {
        console.error('Não foi possível abrir a câmera para a Polaroid:', err);
        document.getElementById('polaroidCameraErro').classList.remove('d-none');
    }
}

function pararCameraPolaroid() {
    if (polaroidCameraStream) {
        polaroidCameraStream.getTracks().forEach(track => track.stop());
        polaroidCameraStream = null;
    }
}

function fecharModalCameraPolaroid() {
    pararCameraPolaroid();
    const modal = document.getElementById('polaroidCameraModal');
    if (modal) modal.classList.add('d-none');
}

function capturarFotoPolaroid() {
    const video = document.getElementById('polaroidCameraVideo');
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Espelha horizontalmente: câmera frontal "crua" sai invertida em relação ao que a pessoa vê na tela.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    polaroidFotoCapturadaDataUrl = canvas.toDataURL('image/png');

    document.getElementById('polaroidCameraFotoCapturada').src = polaroidFotoCapturadaDataUrl;
    document.getElementById('polaroidCameraPreviewWrap').classList.add('d-none');
    document.getElementById('polaroidCameraConfirmWrap').classList.remove('d-none');
    pararCameraPolaroid(); // libera a câmera enquanto a pessoa decide confirmar ou repetir
}

function repetirFotoPolaroid() {
    polaroidFotoCapturadaDataUrl = null;
    abrirCameraPolaroid();
}

async function confirmarFotoEGerarPolaroid() {
    if (!polaroidFotoCapturadaDataUrl) return;
    const fraseCustom = (document.getElementById('polaroidLegendaInput').value || '').trim();
    const foto = polaroidFotoCapturadaDataUrl;
    fecharModalCameraPolaroid();
    await gerarPolaroidComFoto(foto, fraseCustom);
}

/** Gera a Polaroid a partir da foto confirmada, baixa uma cópia e salva no banco (visível em qualquer aparelho). */
async function gerarPolaroidComFoto(fotoDataUrl, fraseCustom) {
    if (typeof html2canvas !== 'function') { mostrarStatusExportar('Não foi possível carregar o exportador. Verifique sua conexão.', 'err'); return; }
    mostrarStatusExportar('Gerando polaroid...', 'pending');

    const dataPedidoIso = await obterConfiguracao('aurora_data_pedido');
    const dataTexto = dataPedidoIso ? formatarDataPedido(dataPedidoIso) : formatarDataPedido(new Date().toISOString());
    const frase = fraseCustom || TEXTOS.polaroidFrasePadrao; // sem frase informada -> usa a frase padrão do projeto

    document.getElementById('polaroidExportavelData').textContent = dataTexto;
    document.getElementById('polaroidExportavelLegenda').textContent = frase;
    document.getElementById('polaroidExportavelImg').src = fotoDataUrl;

    try {
        const canvas = await html2canvas(document.getElementById('polaroidExportavel'), { backgroundColor: '#ffffff', scale: 2 });
        baixarCanvasComoPng(canvas, 'nosso-momento-polaroid.png');

        const blobPolaroid = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blobPolaroid) {
            await salvarMedia({ id: 'polaroid_gerada', tipo: 'polaroid_gerada', blob: blobPolaroid });
            await exibirPolaroidSalva();
        }

        mostrarStatusExportar('Polaroid gerada, baixada e salva com sucesso — vai aparecer em qualquer aparelho.', 'ok');
    } catch (err) {
        console.error('Falha ao exportar polaroid', err);
        mostrarStatusExportar('Não foi possível gerar a polaroid.', 'err');
    }
}

/** Exibe a Polaroid já salva (se existir) — chamado na inicialização e sempre que uma nova é gerada/sincronizada. */
async function exibirPolaroidSalva() {
    const wrap = document.getElementById('polaroidSalvaWrap');
    if (!wrap) return;
    try {
        const registro = await obterMedia('polaroid_gerada');
        if (registro && registro.blob) {
            wrap.querySelector('img').src = URL.createObjectURL(registro.blob);
            wrap.classList.remove('d-none');
        } else {
            wrap.classList.add('d-none');
        }
    } catch (e) { console.error('Falha ao carregar a polaroid salva', e); }
}

/* ---------------- Helpers de exportação ---------------- */
function baixarCanvasComoPng(canvas, nomeArquivo) {
    const link = document.createElement('a');
    link.download = nomeArquivo;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function salvarCanvasComoPdf(canvas, nomeArquivo) {
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const larguraMM = 130;
    const alturaMM = larguraMM * (canvas.height / canvas.width);
    const pdf = new jsPDF({ orientation: alturaMM > larguraMM ? 'portrait' : 'landscape', unit: 'mm', format: [larguraMM, alturaMM] });
    pdf.addImage(imgData, 'PNG', 0, 0, larguraMM, alturaMM);
    pdf.save(nomeArquivo);
}

/* ----------------------------------------------------------------------
   BACKUP COMPLETO (JSON) — usado tanto para "baixar backup" quanto como
   payload da sincronização entre aparelhos (ver sync.js).
   ---------------------------------------------------------------------- */
async function gerarBackupCompleto() {
    const backup = {
        versao: 2,
        criadoEm: new Date().toISOString(),
        // Marca de tempo (epoch ms) da última alteração LOCAL. É isso que a
        // sincronização automática usa para saber, ao abrir o link em outro
        // aparelho, se a nuvem está mais atualizada que o dispositivo atual
        // (ver sincronizarNaAbertura em js/sync.js).
        atualizadoEm: parseInt(await obterConfiguracao('aurora_atualizado_em'), 10) || Date.now(),
        nomeDela: NOME_DELA,
        nomeDele: NOME_DELE,
        dataInicioRelacionamento: await obterOuCriarDataPrimeiroAcesso(),
        dataPedido: await obterConfiguracao('aurora_data_pedido'),
        stage: await obterConfiguracao('aurora_stage'),
        regrasContrato: JSON.parse(await obterConfiguracao('aurora_regras_contrato') || 'null'),
        quizRespostas: JSON.parse(await obterConfiguracao('aurora_quiz_respostas') || 'null'),
        assinatura: null,
        video: null,
        videoMime: null,
        polaroidGerada: null,
        mensagensFuturo: [],
        lembrancas: []
    };

    try {
        const assinatura = await obterMedia('assinatura');
        if (assinatura && assinatura.texto) backup.assinatura = assinatura.texto;
    } catch (e) { console.error('Backup: falha ao ler assinatura', e); }

    try {
        const video = await obterMedia('video_pedido');
        if (video && video.blob) { backup.video = await blobParaDataURL(video.blob); backup.videoMime = video.mimeType || 'video/webm'; }
    } catch (e) { console.error('Backup: falha ao ler vídeo', e); }

    try {
        const polaroid = await obterMedia('polaroid_gerada');
        if (polaroid && polaroid.blob) backup.polaroidGerada = await blobParaDataURL(polaroid.blob);
    } catch (e) { console.error('Backup: falha ao ler polaroid gerada', e); }

    try {
        const lista = await obterMediaPorTipo('mensagem_futuro');
        backup.mensagensFuturo = await Promise.all(lista.map(async (msg) => ({
            id: msg.id, tipo: msg.subtipo, texto: msg.texto || null, criadoEm: msg.criadoEm,
            mimeType: msg.mimeType || null, arquivo: msg.blob ? await blobParaDataURL(msg.blob) : null
        })));
    } catch (e) { console.error('Backup: falha ao ler mensagens do futuro', e); }

    try {
        const lista = await obterMediaPorTipo('lembranca');
        backup.lembrancas = await Promise.all(lista.map(async (item) => ({ id: item.id, imagem: await blobParaDataURL(item.blob), criadoEm: item.criadoEm })));
    } catch (e) { console.error('Backup: falha ao ler lembranças', e); }

    return backup;
}

async function baixarBackupCompleto() {
    const botao = document.getElementById('btnBackup');
    const textoOriginal = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Preparando backup...';

    try {
        const backup = await gerarBackupCompleto();
        const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-nossa-historia-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
        console.error('Falha ao gerar backup completo', err);
        alert('Não foi possível gerar o backup agora. Tente novamente.');
    } finally {
        botao.disabled = false;
        botao.innerHTML = textoOriginal;
    }
}

async function restaurarBackupDeArquivo(arquivo) {
    const statusEl = document.getElementById('restaurarStatus');
    statusEl.textContent = 'Lendo arquivo de backup...';
    statusEl.className = 'save-status pending';

    try {
        const texto = await arquivo.text();
        const backup = JSON.parse(texto);
        await aplicarBackupNoDispositivo(backup);
        statusEl.textContent = 'Backup restaurado com sucesso! Recarregando...';
        statusEl.className = 'save-status ok';
        setTimeout(() => location.reload(), 1200);
    } catch (err) {
        console.error('Falha ao restaurar backup', err);
        statusEl.textContent = 'Não foi possível ler esse arquivo de backup.';
        statusEl.className = 'save-status err';
    }
}

/**
 * Aplica um objeto de backup (do arquivo .json ou vindo da nuvem — ver
 * sync.js) no armazenamento local deste aparelho.
 */
async function aplicarBackupNoDispositivo(backup) {
    if (!backup || !backup.versao) throw new Error('Backup inválido');

    if (backup.dataPedido) await salvarConfiguracao('aurora_data_pedido', backup.dataPedido);
    if (backup.dataInicioRelacionamento) await salvarConfiguracao('aurora_primeiro_acesso', backup.dataInicioRelacionamento);
    if (backup.stage) await salvarConfiguracao('aurora_stage', backup.stage);
    if (backup.regrasContrato) await salvarConfiguracao('aurora_regras_contrato', JSON.stringify(backup.regrasContrato));
    if (backup.quizRespostas) await salvarConfiguracao('aurora_quiz_respostas', JSON.stringify(backup.quizRespostas));

    if (backup.assinatura) await salvarMedia({ id: 'assinatura', tipo: 'assinatura', texto: backup.assinatura });

    if (backup.video) {
        const blobVideo = dataURLParaBlob(backup.video);
        await salvarMedia({ id: 'video_pedido', tipo: 'video_pedido', blob: blobVideo, mimeType: backup.videoMime || 'video/webm' });
    }

    if (backup.polaroidGerada) {
        await salvarMedia({ id: 'polaroid_gerada', tipo: 'polaroid_gerada', blob: dataURLParaBlob(backup.polaroidGerada) });
    }

    // Listas (mensagens para o futuro / lembranças): o backup é sempre a
    // "fotografia completa" da experiência naquele instante, então a lista
    // local é SUBSTITUÍDA pela do backup, em vez de receber itens
    // acrescentados. Isso evita duplicar tudo a cada sincronização
    // automática entre aparelhos (ver sincronizarNaAbertura em js/sync.js).
    if (Array.isArray(backup.mensagensFuturo)) {
        try {
            const antigas = await obterMediaPorTipo('mensagem_futuro');
            for (const antiga of antigas) await db.media.delete(antiga.id);
        } catch (e) { console.error('Falha ao limpar mensagens antigas antes de restaurar', e); }

        for (const item of backup.mensagensFuturo) {
            await salvarMedia({
                id: item.id || gerarIdUnico('futuro'),
                tipo: 'mensagem_futuro',
                subtipo: item.tipo,
                texto: item.texto || null,
                blob: item.arquivo ? dataURLParaBlob(item.arquivo) : null,
                mimeType: item.mimeType || null,
                criadoEm: item.criadoEm ? new Date(item.criadoEm).getTime() : Date.now()
            });
        }
    }

    if (Array.isArray(backup.lembrancas)) {
        try {
            const antigas = await obterMediaPorTipo('lembranca');
            for (const antiga of antigas) await db.media.delete(antiga.id);
        } catch (e) { console.error('Falha ao limpar lembranças antigas antes de restaurar', e); }

        for (const item of backup.lembrancas) {
            await salvarMedia({ id: item.id || gerarIdUnico('lembranca'), tipo: 'lembranca', blob: dataURLParaBlob(item.imagem), criadoEm: item.criadoEm || Date.now() });
        }
    }

    await exibirPolaroidSalva();
}

function iniciarModuloExport() {
    document.getElementById('btnExportarImagem').addEventListener('click', exportarCartaComoImagem);
    document.getElementById('btnExportarPDF').addEventListener('click', exportarCartaComoPDF);
    document.getElementById('btnExportarCertificado').addEventListener('click', exportarCertificadoNamoro);

    // Novo fluxo da Polaroid: o clique abre a câmera em vez de gerar direto.
    document.getElementById('btnExportarPolaroid').addEventListener('click', abrirCameraPolaroid);
    document.getElementById('btnFecharCameraPolaroid').addEventListener('click', fecharModalCameraPolaroid);
    document.getElementById('btnCapturarFotoPolaroid').addEventListener('click', capturarFotoPolaroid);
    document.getElementById('btnRepetirFotoPolaroid').addEventListener('click', repetirFotoPolaroid);
    document.getElementById('btnConfirmarFotoPolaroid').addEventListener('click', confirmarFotoEGerarPolaroid);
    exibirPolaroidSalva(); // mostra a polaroid já salva anteriormente (neste aparelho ou sincronizada de outro)

    document.getElementById('btnBackup').addEventListener('click', baixarBackupCompleto);
    document.getElementById('btnRestaurarBackup').addEventListener('click', () => document.getElementById('inputRestaurarBackup').click());
    document.getElementById('inputRestaurarBackup').addEventListener('change', (evt) => {
        const arquivo = evt.target.files && evt.target.files[0];
        if (arquivo) restaurarBackupDeArquivo(arquivo);
        evt.target.value = '';
    });

    document.getElementById('btnResetar').addEventListener('click', async () => {
        if (!confirm('Isso vai apagar TUDO o que foi salvo — neste aparelho e na nuvem: vídeo, assinatura, mensagens, fotos, polaroid e progresso. Essa ação não pode ser desfeita. Continuar?')) return;

        const botao = document.getElementById('btnResetar');
        if (botao) { botao.disabled = true; botao.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Resetando...'; }

        // 1) Nuvem (fonte oficial entre aparelhos) — precisa ser apagada
        //    primeiro, senão o próximo dispositivo a abrir o link puxaria de
        //    volta os dados que acabamos de apagar localmente.
        try { await apagarBackupDaNuvem(); } catch (e) { console.error('Falha ao apagar backup na nuvem', e); }

        // 2) IndexedDB (mídias + configurações)
        try { await db.media.clear(); await db.configuracoes.clear(); } catch (e) { console.error('Falha ao limpar IndexedDB', e); }

        // 3) localStorage / sessionStorage
        try { localStorage.clear(); } catch (e) { console.error('Falha ao limpar localStorage', e); }
        try { sessionStorage.clear(); } catch (e) { console.error('Falha ao limpar sessionStorage', e); }

        // 4) Cache do navegador usada pelo projeto (defensivo — este site não
        //    registra um Service Worker hoje, mas se um dia passar a ter,
        //    o reset continua limpando tudo corretamente).
        try {
            if (window.caches && caches.keys) {
                const nomes = await caches.keys();
                await Promise.all(nomes.map(nome => caches.delete(nome)));
            }
        } catch (e) { console.error('Falha ao limpar cache', e); }

        location.reload();
    });
}
