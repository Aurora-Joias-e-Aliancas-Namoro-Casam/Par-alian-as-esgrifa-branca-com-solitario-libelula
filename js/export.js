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
    const dataTexto = dataPedidoIso ? formatarDataPedido(dataPedidoIso) : formatarDataPedido(new Date().toISOString());

    const el = document.getElementById('certificadoExportavel');
    document.getElementById('certificadoData').textContent = dataTexto;
    document.getElementById('certificadoNomes').textContent = `${NOME_DELE_COMPLETO} & ${NOME_DELA_APELIDO}`;

    try {
        const canvas = await html2canvas(el, { backgroundColor: '#FBF7F0', scale: 2 });
        salvarCanvasComoPdf(canvas, 'certificado-de-namoro.pdf');
        mostrarStatusExportar('Certificado exportado com sucesso.', 'ok');
    } catch (err) {
        console.error('Falha ao exportar certificado', err);
        mostrarStatusExportar('Não foi possível exportar o certificado.', 'err');
    }
}

/* ---------------- Foto estilo Polaroid com legenda ---------------- */
async function exportarPolaroidDoMomento() {
    if (typeof html2canvas !== 'function') { mostrarStatusExportar('Não foi possível carregar o exportador. Verifique sua conexão.', 'err'); return; }
    mostrarStatusExportar('Gerando polaroid...', 'pending');

    const dataPedidoIso = await obterConfiguracao('aurora_data_pedido');
    const dataTexto = dataPedidoIso ? formatarDataPedido(dataPedidoIso) : formatarDataPedido(new Date().toISOString());
    document.getElementById('polaroidExportavelLegenda').textContent = `O dia do nosso pedido — ${dataTexto}`;
    aplicarImagemPlaceholder(document.getElementById('polaroidExportavelImg'), 'imagem_foto_final', 'Nossa foto');

    try {
        const canvas = await html2canvas(document.getElementById('polaroidExportavel'), { backgroundColor: '#ffffff', scale: 2 });
        baixarCanvasComoPng(canvas, 'nosso-momento-polaroid.png');
        mostrarStatusExportar('Polaroid exportada com sucesso.', 'ok');
    } catch (err) {
        console.error('Falha ao exportar polaroid', err);
        mostrarStatusExportar('Não foi possível exportar a polaroid.', 'err');
    }
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
        const lista = await obterMediaPorTipo('mensagem_futuro');
        backup.mensagensFuturo = await Promise.all(lista.map(async (msg) => ({
            id: msg.id, tipo: msg.subtipo, texto: msg.texto || null, criadoEm: msg.criadoEm,
            mimeType: msg.mimeType || null, arquivo: msg.blob ? await blobParaDataURL(msg.blob) : null
        })));
    } catch (e) { console.error('Backup: falha ao ler mensagens do futuro', e); }

    try {
        const lista = await obterMediaPorTipo('lembranca');
        backup.lembrancas = await Promise.all(lista.map(async (item) => ({ imagem: await blobParaDataURL(item.blob), criadoEm: item.criadoEm })));
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

    if (Array.isArray(backup.mensagensFuturo)) {
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
        for (const item of backup.lembrancas) {
            await salvarMedia({ id: gerarIdUnico('lembranca'), tipo: 'lembranca', blob: dataURLParaBlob(item.imagem), criadoEm: item.criadoEm || Date.now() });
        }
    }
}

function iniciarModuloExport() {
    document.getElementById('btnExportarImagem').addEventListener('click', exportarCartaComoImagem);
    document.getElementById('btnExportarPDF').addEventListener('click', exportarCartaComoPDF);
    document.getElementById('btnExportarCertificado').addEventListener('click', exportarCertificadoNamoro);
    document.getElementById('btnExportarPolaroid').addEventListener('click', exportarPolaroidDoMomento);

    document.getElementById('btnBackup').addEventListener('click', baixarBackupCompleto);
    document.getElementById('btnRestaurarBackup').addEventListener('click', () => document.getElementById('inputRestaurarBackup').click());
    document.getElementById('inputRestaurarBackup').addEventListener('change', (evt) => {
        const arquivo = evt.target.files && evt.target.files[0];
        if (arquivo) restaurarBackupDeArquivo(arquivo);
        evt.target.value = '';
    });

    document.getElementById('btnResetar').addEventListener('click', async () => {
        if (!confirm('Isso vai apagar tudo o que foi salvo neste aparelho (vídeo, assinatura, mensagens, lembranças). Continuar?')) return;
        try { await db.media.clear(); await db.configuracoes.clear(); } catch (e) { console.error('Falha ao limpar IndexedDB', e); }
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
    });
}
