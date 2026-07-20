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
    // CORREÇÃO: a câmera frontal já entrega o frame "verdadeiro" (não
    // espelhado) — quem espelha é a TELA (CSS, ver #polaroidCameraVideo em
    // style.css), só pra ficar confortável de enquadrar o rosto, tipo
    // espelho de banheiro. A versão SALVA precisa ser a verdadeira, sem
    // espelhar de novo — inverter aqui em cima do que já parecia invertido
    // na tela é o que estava deixando a foto final ao contrário.
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
        baixarCanvasComoPng(canvas, 'nosso-momento-polaroid.png'); // download local: mantém PNG (qualidade máxima, é só um arquivo)

        // Versão salva no banco/nuvem: JPEG reduz bastante o tamanho (a foto já
        // não tem transparência, então JPEG não perde nada visualmente aqui).
        const blobPolaroid = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.88));
        if (blobPolaroid) {
            await salvarMedia({ id: 'polaroid_gerada', tipo: 'polaroid_gerada', blob: blobPolaroid, mimeType: 'image/jpeg' });
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
   BACKUP COMPLETO — FORMATO NOVO (item 3 do prompt de melhorias)
   ----------------------------------------------------------------------
   POR QUE O BACKUP ANTIGO FALHAVA AO RESTAURAR:
   A versão anterior guardava TUDO (vídeo, áudios, fotos, polaroid) como
   texto base64 dentro de um único arquivo .json gigantesco. Isso tem dois
   problemas sérios, principalmente no Safari/iPhone:
     1. Base64 infla o tamanho do arquivo em ~33%, então um vídeo de
        poucos minutos já gerava um .json de dezenas de MB.
     2. JSON.parse() em uma string desse tamanho é conhecido por falhar
        silenciosamente ou travar em navegadores baseados em WebKit
        (Safari/iOS), justamente o navegador usado neste projeto — ou
        seja, o backup "funcionava ao gerar" mas "não lia" depois.

   SOLUÇÃO: o backup agora é um arquivo .zip. Cada mídia (vídeo, áudios,
   fotos, polaroid, lembranças) vira um ARQUIVO BINÁRIO dentro do zip —
   sem base64, sem string gigante para o JSON.parse engasgar. Um
   "manifest.json" pequeno (só texto/configurações) descreve o resto.
   Isso também deixa o arquivo de backup consideravelmente menor.

   A lista de mídias é montada dinamicamente a partir de TUDO que existe
   na tabela "media" do IndexedDB — então qualquer arquivo salvo por
   qualquer funcionalidade do site (vídeo do pedido, assinatura, fotos
   enviadas, polaroids, mensagens para o futuro em texto/áudio/vídeo,
   lembranças) entra automaticamente no backup, sem precisar listar cada
   tipo manualmente.

   Compatibilidade: backups antigos (.json) ainda podem ser restaurados
   (ver restaurarBackupDeArquivo), mas todo backup novo já sai em .zip.
   ---------------------------------------------------------------------- */

/** Extensão de arquivo apropriada para um mimeType, usada só para nomear os arquivos dentro do zip. */
function extensaoParaMime(mimeType) {
    const mapa = {
        'video/webm': 'webm', 'video/mp4': 'mp4',
        'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg',
        'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif'
    };
    if (!mimeType) return 'bin';
    const base = mimeType.split(';')[0].trim();
    if (mapa[base]) return mapa[base];
    const partes = base.split('/');
    return partes[1] || 'bin';
}

/** Gera o backup completo como um Blob .zip (usado tanto pelo botão "Backup" quanto pela sincronização — ver sync.js). */
async function gerarBackupZipBlob() {
    if (typeof JSZip === 'undefined') throw new Error('Não foi possível carregar o gerador de backup (JSZip). Verifique sua conexão.');

    const zip = new JSZip();
    const pastaMedia = zip.folder('media');

    const manifest = {
        versao: 3,
        criadoEm: new Date().toISOString(),
        // Marca de tempo (epoch ms) da última alteração LOCAL — usada pela
        // sincronização automática para decidir "puxar" ou "empurrar" (ver js/sync.js).
        atualizadoEm: parseInt(await obterConfiguracao('aurora_atualizado_em'), 10) || Date.now(),
        nomeDela: NOME_DELA,
        nomeDele: NOME_DELE,
        dataInicioRelacionamento: await obterOuCriarDataPrimeiroAcesso(),
        dataPedido: await obterConfiguracao('aurora_data_pedido'),
        stage: await obterConfiguracao('aurora_stage'),
        regrasContrato: JSON.parse(await obterConfiguracao('aurora_regras_contrato') || 'null'),
        quizRespostas: JSON.parse(await obterConfiguracao('aurora_quiz_respostas') || 'null'),
        videoPedidoYoutube: await obterConfiguracao('aurora_video_pedido_youtube'),
        medias: []
    };

    let todosRegistros = [];
    try { todosRegistros = await db.media.toArray(); } catch (e) { console.error('Backup: falha ao listar mídias', e); }

    for (const registro of todosRegistros) {
        if (registro.tipo === 'diagnostico') continue; // arquivo de teste técnico, não faz parte da experiência

        const entrada = { id: registro.id, tipo: registro.tipo, subtipo: registro.subtipo || null, criadoEm: registro.criadoEm || Date.now() };

        try {
            if (registro.blob) {
                const nomeArquivo = `${registro.id}.${extensaoParaMime(registro.mimeType || registro.blob.type)}`;
                pastaMedia.file(nomeArquivo, registro.blob);
                entrada.arquivo = nomeArquivo;
                entrada.mimeType = registro.mimeType || registro.blob.type || null;
            } else if (registro.texto) {
                entrada.texto = registro.texto; // ex: assinatura (dataURL pequeno) ou mensagem de texto para o futuro
            } else {
                continue;
            }
            manifest.medias.push(entrada);
        } catch (e) { console.error(`Backup: falha ao empacotar a mídia "${registro.id}"`, e); }
    }

    zip.file('manifest.json', JSON.stringify(manifest));
    // CORREÇÃO: sem compressão adicional (STORE, não DEFLATE) — vídeo, foto
    // e áudio já são formatos comprimidos (MP4/JPEG/etc.), então tentar
    // comprimir de novo só gasta processamento do celular (bem perceptível
    // num vídeo de 100MB+) pra ganhar quase nada de espaço. O manifest.json
    // (texto) é pequeno o bastante pra não fazer diferença real.
    return await zip.generateAsync({ type: 'blob', compression: 'STORE' });
}

/* ----------------------------------------------------------------------
   LEMBRETE DE BACKUP MANUAL
   ----------------------------------------------------------------------
   A sincronização automática com a nuvem é ótima, mas é uma dependência
   de terceiro — vale ter, de vez em quando, uma cópia baixada de
   verdade, fora de qualquer serviço. Este lembrete aparece só na página
   final (depois que tudo já aconteceu), e só quando faz tempo que
   ninguém baixa um backup — nunca no meio da experiência, e nunca toda
   vez que a página abre (respeita "lembrar depois" por um tempo).
   ---------------------------------------------------------------------- */
const LEMBRETE_BACKUP_INTERVALO_DIAS = 14;

async function verificarLembreteBackup() {
    try {
        const estagio = await obterConfiguracao('aurora_stage');
        if (estagio !== 'final') return; // só faz sentido lembrar depois que tudo já aconteceu

        const intervaloMs = LEMBRETE_BACKUP_INTERVALO_DIAS * 24 * 60 * 60 * 1000;
        const agora = Date.now();

        const ultimoBackup = parseInt(await obterConfiguracao('aurora_ultimo_backup_manual'), 10) || 0;
        const adiadoEm = parseInt(await obterConfiguracao('aurora_lembrete_backup_adiado_em'), 10) || 0;

        const semBackupHaMuitoTempo = (agora - ultimoBackup) > intervaloMs;
        const naoFoiAdiadoRecentemente = (agora - adiadoEm) > intervaloMs;

        if (semBackupHaMuitoTempo && naoFoiAdiadoRecentemente) {
            const banner = document.getElementById('lembreteBackup');
            if (banner) banner.classList.remove('d-none');
        }
    } catch (e) { console.error('Falha ao checar lembrete de backup', e); }
}

function esconderLembreteBackup() {
    const banner = document.getElementById('lembreteBackup');
    if (banner) banner.classList.add('d-none');
}

async function adiarLembreteBackup() {
    await salvarConfiguracao('aurora_lembrete_backup_adiado_em', String(Date.now()));
    esconderLembreteBackup();
}

async function baixarBackupCompleto() {
    const botao = document.getElementById('btnBackup');
    const textoOriginal = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Preparando backup...';

    try {
        const blob = await gerarBackupZipBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-nossa-historia-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);

        // Registra quando o último backup manual foi feito — usado pelo
        // lembrete de backup (ver verificarLembreteBackup) pra não incomodar
        // toda vez, só quando já faz tempo que ninguém baixa uma cópia.
        await salvarConfiguracao('aurora_ultimo_backup_manual', String(Date.now()));
        esconderLembreteBackup();
    } catch (err) {
        console.error('Falha ao gerar backup completo', err);
        alert('Não foi possível gerar o backup agora. Tente novamente.');
    } finally {
        botao.disabled = false;
        botao.innerHTML = textoOriginal;
    }
}

/**
 * Aplica um backup no formato NOVO (.zip) no armazenamento local deste
 * aparelho. Recebe um ArrayBuffer ou Blob do arquivo .zip.
 */
async function aplicarBackupDeZip(zipDados) {
    if (typeof JSZip === 'undefined') throw new Error('Não foi possível carregar o leitor de backup (JSZip). Verifique sua conexão.');

    const zip = await JSZip.loadAsync(zipDados);
    const manifestArquivo = zip.file('manifest.json');
    if (!manifestArquivo) throw new Error('Backup inválido: manifest.json não encontrado dentro do arquivo.');

    const manifest = JSON.parse(await manifestArquivo.async('string'));
    if (!manifest || !manifest.versao) throw new Error('Backup inválido.');

    if (manifest.dataPedido) await salvarConfiguracao('aurora_data_pedido', manifest.dataPedido);
    if (manifest.dataInicioRelacionamento) await salvarConfiguracao('aurora_primeiro_acesso', manifest.dataInicioRelacionamento);
    if (manifest.stage) await salvarConfiguracao('aurora_stage', manifest.stage);
    if (manifest.regrasContrato) await salvarConfiguracao('aurora_regras_contrato', JSON.stringify(manifest.regrasContrato));
    if (manifest.quizRespostas) await salvarConfiguracao('aurora_quiz_respostas', JSON.stringify(manifest.quizRespostas));
    if (manifest.videoPedidoYoutube) await salvarConfiguracao('aurora_video_pedido_youtube', manifest.videoPedidoYoutube);

    // Listas (mensagens para o futuro / lembranças): o backup é sempre a
    // "fotografia completa" da experiência naquele instante, então as
    // listas locais são SUBSTITUÍDAS pelas do backup, em vez de receberem
    // itens acrescentados — evita duplicar tudo a cada sincronização
    // automática entre aparelhos (ver sincronizarNaAbertura em js/sync.js).
    try {
        const antigasFuturo = await obterMediaPorTipo('mensagem_futuro');
        for (const antiga of antigasFuturo) await db.media.delete(antiga.id);
    } catch (e) { console.error('Falha ao limpar mensagens antigas antes de restaurar', e); }

    try {
        const antigasLembrancas = await obterMediaPorTipo('lembranca');
        for (const antiga of antigasLembrancas) await db.media.delete(antiga.id);
    } catch (e) { console.error('Falha ao limpar lembranças antigas antes de restaurar', e); }

    for (const entrada of (manifest.medias || [])) {
        try {
            const registro = {
                id: entrada.id || gerarIdUnico(entrada.tipo || 'item'),
                tipo: entrada.tipo,
                subtipo: entrada.subtipo || undefined,
                criadoEm: entrada.criadoEm || Date.now()
            };

            if (entrada.arquivo) {
                const arquivoZip = zip.file(`media/${entrada.arquivo}`);
                if (!arquivoZip) { console.error(`Backup: arquivo "${entrada.arquivo}" não encontrado dentro do zip`); continue; }
                registro.blob = await arquivoZip.async('blob');
                registro.mimeType = entrada.mimeType || registro.blob.type || null;
            } else if (entrada.texto) {
                registro.texto = entrada.texto;
            } else {
                continue;
            }

            await salvarMedia(registro);
        } catch (e) { console.error(`Backup: falha ao restaurar a mídia "${entrada.id}"`, e); }
    }

    await exibirPolaroidSalva();
}

/**
 * Compatibilidade com backups do FORMATO ANTIGO (.json com mídias em
 * base64) — para quem ainda tiver um backup gerado antes desta correção.
 * Backups novos nunca mais saem nesse formato (ver gerarBackupZipBlob).
 */
async function aplicarBackupLegadoDeJson(backup) {
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

async function restaurarBackupDeArquivo(arquivo) {
    const statusEl = document.getElementById('restaurarStatus');
    statusEl.textContent = 'Lendo arquivo de backup...';
    statusEl.className = 'save-status pending';

    // CORREÇÃO (bug real: restaurar um backup com vários itens disparava um
    // envio pra nuvem PARA CADA item restaurado — cada salvarMedia() conta
    // como "mudança nova" e tenta sincronizar na hora. Isso desperdiçava
    // banda (reenviando o backup inteiro várias vezes seguidas) e, pior,
    // o location.reload() logo abaixo podia interromper um desses envios
    // no meio, deixando a nuvem com dados incompletos. Suprime esses
    // disparos durante a restauração (mesma proteção já usada quando a
    // nuvem manda um backup pra este aparelho) — a sincronização de
    // recarrega abaixo). A sincronização de verdade acontece uma vez só,
    // de forma limpa, no próximo carregamento da página (via
    // sincronizarNaAbertura, chamada assim que a página recarrega abaixo).
    __auroraAplicandoBackupRemoto = true;
    try {
        const nome = (arquivo.name || '').toLowerCase();
        if (nome.endsWith('.json')) {
            // Formato antigo — mantido só por compatibilidade com backups já existentes.
            const texto = await arquivo.text();
            const backup = JSON.parse(texto);
            await aplicarBackupLegadoDeJson(backup);
        } else {
            // Formato novo (.zip) — o padrão de hoje em diante.
            const dados = await arquivo.arrayBuffer();
            await aplicarBackupDeZip(dados);
        }
        statusEl.textContent = 'Backup restaurado com sucesso! Recarregando...';
        statusEl.className = 'save-status ok';
        setTimeout(() => location.reload(), 1200);
    } catch (err) {
        console.error('Falha ao restaurar backup', err);
        statusEl.textContent = 'Não foi possível ler esse arquivo de backup. Confira se é o arquivo .zip gerado por este site.';
        statusEl.className = 'save-status err';
    } finally {
        __auroraAplicandoBackupRemoto = false;
    }
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

    document.getElementById('btnLembreteBackupAgora').addEventListener('click', baixarBackupCompleto);
    document.getElementById('btnLembreteBackupDepois').addEventListener('click', adiarLembreteBackup);
    verificarLembreteBackup();
}
