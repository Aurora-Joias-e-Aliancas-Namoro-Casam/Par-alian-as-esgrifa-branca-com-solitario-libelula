/**
 * EXPORT.JS — Exportar lembranças (carta em PNG/PDF, certificado de namoro,
 * Polaroid) e o backup/restauração completos (também usados pela
 * sincronização entre aparelhos, ver sync.js).
 */

/* ----------------------------------------------------------------------
   LEMBRANÇAS PRA IMPRIMIR — constelação e carta física com QR code. Ambas
   leem TIMELINE_MARCOS / textoVersiculoBase() na hora de gerar a imagem.
   ---------------------------------------------------------------------- */

function mostrarStatusExportar(mensagem, tipo) {
    const statusEl = document.getElementById('exportarStatus');
    if (!statusEl) return;
    statusEl.textContent = mensagem;
    statusEl.className = tipo ? `save-status ${tipo}` : 'save-status';
}

/** Cartão postal do "Nosso mapa" — um card por lugar, com foto (se já tiver sido adicionada) + nome + texto. */
// Calcula quantas colunas usar e o tamanho de foto que cabe para qualquer
// quantidade de itens, sem cortar nem espremer.
function calcularGradeParaCaber(quantidade, larguraDisponivel, alturaDisponivel, tamanhoMaximoFoto, tamanhoMinimoFoto) {
    quantidade = Math.max(1, quantidade);
    let melhor = null;
    for (let colunas = 1; colunas <= quantidade; colunas++) {
        const linhas = Math.ceil(quantidade / colunas);
        const larguraPorItem = larguraDisponivel / colunas;
        const alturaPorItem = alturaDisponivel / linhas;
        const tamanhoFoto = Math.min(larguraPorItem, alturaPorItem, tamanhoMaximoFoto);
        if (!melhor || tamanhoFoto > melhor.tamanhoFoto) melhor = { colunas, linhas, tamanhoFoto };
    }
    melhor.tamanhoFoto = Math.max(tamanhoMinimoFoto, melhor.tamanhoFoto);
    return melhor;
}

/** Constelação pra imprimir — reaproveita TIMELINE_MARCOS, sempre no visual escuro/estrelado. */
async function gerarConstelacao() {
    if (typeof html2canvas !== 'function') { mostrarStatusExportar('Não foi possível carregar o exportador de imagem. Verifique sua conexão.', 'err'); return; }
    mostrarStatusExportar('Gerando a constelação...', 'pending');

    try {
        const el = document.getElementById('constelacaoExportavel');

        const lista = document.getElementById('constelacaoLista');
        lista.innerHTML = '';

        const larguraUtil = IMPRIMIVEL_LARGURA_PX - 140;
        const alturaUtil = IMPRIMIVEL_ALTURA_PX - 360;
        const { colunas, tamanhoFoto } = calcularGradeParaCaber(TIMELINE_MARCOS.length, larguraUtil, alturaUtil, 220, 64);
        lista.style.gridTemplateColumns = `repeat(${colunas}, 1fr)`;

        const fonteData = Math.max(14, Math.min(22, tamanhoFoto * 0.13));

        for (const marco of TIMELINE_MARCOS) {
            const item = document.createElement('div');
            item.className = 'constelacao-item' + (marco.ehPedido ? ' constelacao-item-pedido' : '');
            const fotoSrc = await resolverFotoPlaceholderOuAsset(marco.foto);
            const tamanhoEsteItem = marco.ehPedido ? tamanhoFoto * 1.18 : tamanhoFoto;
            item.innerHTML = `
                <span class="constelacao-item-estrela" aria-hidden="true">✦</span>
                <img src="${fotoSrc}" alt="${marco.data || ''}" style="width:${tamanhoEsteItem}px; height:${tamanhoEsteItem}px;">
                <p class="constelacao-item-data" style="font-size:${fonteData}px;">${marco.data || ''}</p>`;
            lista.appendChild(item);
        }

        const canvas = await html2canvas(el, { backgroundColor: '#0f0810', width: IMPRIMIVEL_LARGURA_PX, height: IMPRIMIVEL_ALTURA_PX, scale: 1 });
        await baixarCanvasComoPng(canvas, 'nosso-ceu.png');
        mostrarStatusExportar('Constelação exportada com sucesso. Pode imprimir no tamanho 10x15cm.', 'ok');
    } catch (err) {
        console.error('Falha ao exportar a constelação', err);
        mostrarStatusExportar('Não foi possível exportar a constelação.', 'err');
    }
}

// Tenta o formato flexível (arquivoBase) e cai para o fixo (getAsset) se não achar.
async function resolverFotoPlaceholderOuAsset(id) {
    const item = PLACEHOLDERS[id];
    if (item && item.arquivoBase) return resolverFotoPlaceholder(id);
    return getAsset(id);
}

/** Carta física com QR code — mesmo texto/carinho da carta final, pensada pra imprimir em papel A4 e guardar de verdade. */
async function gerarCartaFisica() {
    if (typeof html2canvas !== 'function' || typeof window.jspdf === 'undefined') { mostrarStatusExportar('Não foi possível carregar o exportador de PDF. Verifique sua conexão.', 'err'); return; }
    mostrarStatusExportar('Gerando a carta física...', 'pending');

    try {
        const textoFinal = textoVersiculoBase().replace(/\{AMOR\}/g, NOME_DELA);
        document.getElementById('cartaFisicaTexto').textContent = textoFinal;
        document.getElementById('cartaFisicaAssinatura').textContent = TEXTOS.assinaturaCartaFinal;

        const qrWrap = document.getElementById('cartaFisicaQrWrap');
        const qrDiv = document.getElementById('cartaFisicaQr');
        qrDiv.innerHTML = '';
        if (typeof URL_DO_SITE !== 'undefined' && URL_DO_SITE && typeof qrcode === 'function') {
            try {
                const qr = qrcode(0, 'M');
                qr.addData(URL_DO_SITE);
                qr.make();
                qrDiv.innerHTML = qr.createSvgTag({ scalable: true });
                qrWrap.classList.remove('d-none');
            } catch (e) {
                console.error('Não foi possível gerar o QR code da carta física:', e);
                qrWrap.classList.add('d-none');
            }
        } else {
            qrWrap.classList.add('d-none'); // sem URL_DO_SITE configurada ainda (js/config.js) — a carta sai só com o texto, normalmente
        }

        const canvas = await html2canvas(document.getElementById('cartaFisicaExportavel'), { backgroundColor: '#FBF7F0', scale: 2 });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const larguraA4 = 210, alturaA4 = 297, margem = 15;
        const larguraImagemMM = larguraA4 - margem * 2;
        const alturaImagemMM = larguraImagemMM * (canvas.height / canvas.width);
        const alturaPaginaMM = alturaA4 - margem * 2;

        // Se a carta couber numa página, centraliza; se for mais comprida
        // que A4, divide automaticamente em quantas páginas forem necessárias.
        if (alturaImagemMM <= alturaPaginaMM) {
            const yInicial = margem + (alturaPaginaMM - alturaImagemMM) / 2;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margem, yInicial, larguraImagemMM, alturaImagemMM);
        } else {
            const pxPorMM = canvas.width / larguraImagemMM;
            const alturaPaginaPX = Math.floor(alturaPaginaMM * pxPorMM);
            let yAtualPX = 0;
            let primeiraPagina = true;

            while (yAtualPX < canvas.height) {
                const alturaFatiaPX = Math.min(alturaPaginaPX, canvas.height - yAtualPX);
                const canvasFatia = document.createElement('canvas');
                canvasFatia.width = canvas.width;
                canvasFatia.height = alturaFatiaPX;
                const ctx = canvasFatia.getContext('2d');
                ctx.fillStyle = '#FBF7F0';
                ctx.fillRect(0, 0, canvasFatia.width, canvasFatia.height);
                ctx.drawImage(canvas, 0, yAtualPX, canvas.width, alturaFatiaPX, 0, 0, canvas.width, alturaFatiaPX);

                const alturaFatiaMM = alturaFatiaPX / pxPorMM;
                if (!primeiraPagina) pdf.addPage();
                pdf.addImage(canvasFatia.toDataURL('image/png'), 'PNG', margem, margem, larguraImagemMM, alturaFatiaMM);

                yAtualPX += alturaFatiaPX;
                primeiraPagina = false;
            }
        }

        const blobPdf = pdf.output('blob'); // pdf.save() sozinho não faz nada no Safari do iPhone, mesmo bug do PNG
        await salvarOuCompartilharArquivo(blobPdf, 'nossa-carta.pdf', 'application/pdf');
        mostrarStatusExportar('Carta física exportada com sucesso. Pode imprimir em papel A4.', 'ok');
    } catch (err) {
        console.error('Falha ao exportar a carta física', err);
        mostrarStatusExportar('Não foi possível exportar a carta física.', 'err');
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
    const jaEstavaAberto = !modal.classList.contains('d-none');
    modal.classList.remove('d-none');
    if (!jaEstavaAberto) bloquearScrollFundoLembranca(); // repetirFotoPolaroid() chama isto de novo com o modal já aberto — não trava duas vezes

    // Pré-preenche a legenda com a data padrão (Polaroid de Aniversário),
    // só na primeira abertura — assim não sobrescreve o que a pessoa já
    // tiver digitado ao tirar a foto de novo (repetirFotoPolaroid).
    if (!jaEstavaAberto) {
        const legendaInput = document.getElementById('polaroidLegendaInput');
        if (legendaInput && !legendaInput.value) legendaInput.value = TEXTOS.polaroidFrasePadrao;
    }
    document.getElementById('polaroidCameraErro').classList.add('d-none');
    document.getElementById('polaroidCameraPreviewWrap').classList.remove('d-none');
    document.getElementById('polaroidCameraConfirmWrap').classList.add('d-none');

    try {
        polaroidCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        document.getElementById('polaroidCameraVideo').srcObject = polaroidCameraStream;
    } catch (err) {
        console.error('Não foi possível abrir a câmera para a Polaroid:', err);
        const erroEl = document.getElementById('polaroidCameraErro');
        erroEl.textContent = instrucoesDesbloquearPermissaoMidia(err);
        erroEl.classList.remove('d-none');
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
    if (modal) { modal.classList.add('d-none'); desbloquearScrollFundoLembranca(); }
}

function capturarFotoPolaroid() {
    const video = document.getElementById('polaroidCameraVideo');
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // A câmera entrega o frame não espelhado (só a TELA espelha o preview
    // via CSS), então espelhamos aqui também para bater com o que foi visto.
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
        await baixarCanvasComoPng(canvas, 'nosso-momento-polaroid.png'); // download local: mantém PNG (qualidade máxima, é só um arquivo)

        // JPEG reduz o tamanho (a foto não tem transparência a perder).
        const blobPolaroid = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.88));
        if (blobPolaroid) {
            await salvarMedia({ id: 'polaroid_gerada', tipo: 'polaroid_gerada', blob: blobPolaroid, mimeType: 'image/jpeg' });
            await exibirPolaroidSalva();
        }

        mostrarStatusExportar('Polaroid gerada, baixada e salva com sucesso, vai aparecer em qualquer aparelho.', 'ok');
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
            atribuirObjectURLGerenciado(wrap.querySelector('img'), registro.blob);
            wrap.classList.remove('d-none');
        } else {
            wrap.classList.add('d-none');
        }
    } catch (e) { console.error('Falha ao carregar a polaroid salva', e); }
}

/* ---------------- Helpers de exportação ---------------- */
async function baixarCanvasComoPng(canvas, nomeArquivo) {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Não foi possível gerar a imagem a partir do canvas.');
    return salvarOuCompartilharArquivo(blob, nomeArquivo, 'image/png');
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

/**
 * Lê uma configuração e tenta interpretar como JSON, sem derrubar o
 * backup inteiro se um valor individual estiver corrompido ou num
 * formato antigo incompatível (ex.: dado salvo por uma versão bem
 * anterior do site, antes de virar JSON.stringify). Antes, um único
 * JSON.parse() malformado dentro do manifesto abortava a função inteira
 * — e como tanto o botão "Backup" quanto a sincronização automática
 * chamam a mesma função, isso fazia parecer que "o backup parou de
 * funcionar" (a real causa era só um campo específico, não o backup
 * como um todo).
 */
async function obterConfigJSON(chave) {
    const bruto = await obterConfiguracao(chave);
    if (!bruto) return null;
    try {
        return JSON.parse(bruto);
    } catch (e) {
        console.error(`Backup: o valor salvo em "${chave}" não é um JSON válido — ignorando só esse campo neste backup (o resto continua normalmente).`, e);
        return null;
    }
}

async function sha256BlobSeguro(blob) {
    if (!blob || typeof crypto === 'undefined' || !crypto.subtle) return null;
    const bytes = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function chaveConfigEhTecnica(chave) {
    return chave === 'aurora_atualizado_em' || chave === 'aurora_sync_dirty' ||
        chave === 'aurora_sync_revision' || chave.startsWith('aurora_sync_') || chave.startsWith('aurora_galeria_cache_');
}

/** Gera o backup completo como um Blob .zip (usado tanto pelo botão "Backup" quanto pela sincronização — ver sync.js). */
async function gerarBackupZipBlob() {
    if (typeof JSZip === 'undefined') throw new Error('Não foi possível carregar o gerador de backup (JSZip). Verifique sua conexão.');

    const zip = new JSZip();
    const pastaMedia = zip.folder('media');

    const manifest = {
        formato: 'poloni-backup',
        versao: 4,
        schemaBanco: 4,
        criadoEm: new Date().toISOString(),
        // Última alteração local, usada por js/sync.js para decidir "puxar" ou "empurrar".
        atualizadoEm: parseInt(await obterConfiguracao('aurora_atualizado_em'), 10) || Date.now(),
        nomeDela: NOME_DELA,
        nomeDele: NOME_DELE,
        dataInicioRelacionamento: await obterOuCriarDataPrimeiroAcesso(),
        dataPedido: await obterConfiguracao('aurora_data_pedido'),
        stage: await obterConfiguracao('aurora_stage'),
        regrasContrato: await obterConfigJSON('aurora_regras_contrato'),
        quizRespostas: await obterConfigJSON('aurora_quiz_respostas'),
        videoPedidoYoutube: await obterConfiguracao('aurora_video_pedido_youtube'),
        checklistEncontros: await obterConfigJSON('aurora_checklist_encontros'),
        checklistItensCustomizados: await obterConfigJSON('aurora_checklist_itens_customizados'),
        mapaLugaresExtra: await obterConfigJSON('aurora_mapa_lugares_extra'),
        // Campos novos e opcionais (quadro de previsões, termômetro do dia,
        // cartas condicionais liberadas e mural da Ana) — backups
        // antigos simplesmente não têm essas chaves (fica undefined) e
        // continuam restaurando normalmente; aplicarBackupDeZip só grava
        // cada uma se ela existir no manifesto (mesmo padrão dos campos acima).
        previsoesRespostasGabriel: await obterConfigJSON('aurora_previsoes_gabriel'),
        previsoesRespostasAna: await obterConfigJSON('aurora_previsoes_ana'),
        previsoesCriadoEm: await obterConfiguracao('aurora_previsoes_criado_em') || null,
        previsoesAnaSenhaHash: await obterConfiguracao('aurora_previsoes_ana_senha_hash') || null,
        termometroLista: await obterConfigJSON('aurora_termometro_lista'),
        cartasCondicionaisLiberadas: await obterConfigJSON('aurora_cartas_condicionais_liberadas'),
        muralAna: await obterConfigJSON('aurora_mural_ana'),
        primeirasVezes: await obterConfigJSON('aurora_primeiras_vezes'),
        contratoFechado: await obterConfiguracao('aurora_contrato_fechado') || null,
        configuracoes: {},
        medias: [],
        integridade: { algoritmo: 'SHA-256' },
        estatisticas: { configuracoes: 0, medias: 0, bytesMidia: 0 }
    };

    // Além dos campos históricos acima, exporta todas as configurações
    // sentimentais. Isso torna o formato preparado para recursos futuros:
    // uma chave nova não fica fora do backup por esquecimento manual.
    try {
        const configuracoes = await db.configuracoes.toArray();
        for (const item of configuracoes) {
            if (!item || !item.chave || chaveConfigEhTecnica(item.chave)) continue;
            manifest.configuracoes[item.chave] = item.valor;
        }

        // Recuperação do espelho: se uma escrita recente chegou ao
        // localStorage mas a transação do IndexedDB falhou, o relógio local é
        // maior. Inclui essa versão no backup para que a nuvem nunca receba o
        // valor antigo apenas porque o banco estava temporariamente bloqueado.
        try {
            const relogiosDb = tentarJSON(manifest.configuracoes.aurora_config_modificados_em || '{}');
            const relogiosLocal = tentarJSON(localStorage.getItem('aurora_config_modificados_em') || '{}');
            const relogiosUnidos = Object.assign({}, relogiosDb && typeof relogiosDb === 'object' ? relogiosDb : {});
            for (const [chave, tempo] of Object.entries(relogiosLocal && typeof relogiosLocal === 'object' ? relogiosLocal : {})) {
                const tempoLocal = timestampSeguro(tempo);
                const tempoDb = timestampSeguro(relogiosUnidos[chave]);
                if (tempoLocal > tempoDb && !chaveConfigEhTecnica(chave)) {
                    const valorLocal = localStorage.getItem(chave);
                    if (valorLocal !== null) manifest.configuracoes[chave] = valorLocal;
                }
                relogiosUnidos[chave] = Math.max(tempoDb, tempoLocal);
            }
            if (Object.keys(relogiosUnidos).length) {
                manifest.configuracoes.aurora_config_modificados_em = JSON.stringify(relogiosUnidos);
            }
        } catch (_) { /* IndexedDB já forneceu a cópia principal */ }
        // Espelho agregado no ZIP mantém compatibilidade com aparelhos antigos.
        // A escrita diária no navegador continua sendo um registro por mensagem.
        const mensagensIndividuais = Object.entries(manifest.configuracoes)
            .filter(([chave]) => chave.startsWith('aurora_mural_item:')).map(([, valor]) => JSON.parse(valor));
        if (mensagensIndividuais.length) {
            manifest.muralAna = unirItensMural([tentarJSON(manifest.configuracoes.aurora_mural_ana || '[]') || [], mensagensIndividuais]);
            manifest.configuracoes.aurora_mural_ana = JSON.stringify(manifest.muralAna);
        }
        manifest.estatisticas.configuracoes = Object.keys(manifest.configuracoes).length;
    } catch (e) {
        await registrarDiagnosticoSeguro('backup.listar_configuracoes', e);
        throw new Error('Não foi possível ler todas as configurações para o backup. Nada foi enviado.');
    }

    let todosRegistros = [];
    try { todosRegistros = await db.media.toArray(); }
    catch (e) {
        await registrarDiagnosticoSeguro('backup.listar_midias', e);
        throw new Error('Não foi possível ler todas as mídias para o backup. O backup anterior foi preservado.');
    }

    for (const registro of todosRegistros) {
        if (registro.tipo === 'diagnostico') continue; // arquivo de teste técnico, não faz parte da experiência

        const entrada = { id: registro.id, tipo: registro.tipo, subtipo: registro.subtipo || null, criadoEm: registro.criadoEm || Date.now(), atualizadoEm: registro.atualizadoEm || registro.criadoEm || Date.now(), excluidoEm: registro.excluidoEm || null };

        try {
            if (registro.blob) {
                if (!registro.blob.size) {
                    await registrarDiagnosticoSeguro('backup.midia_vazia', new Error('Blob com zero bytes'), { id: registro.id, tipo: registro.tipo });
                    throw new Error(`A mídia "${registro.id}" está vazia. O backup anterior foi preservado.`);
                }
                const nomeArquivo = `${registro.id}.${extensaoParaMime(registro.mimeType || registro.blob.type)}`;
                const ambienteNode = typeof process !== 'undefined' && process.versions && process.versions.node;
                const conteudoZip = ambienteNode ? new Uint8Array(await registro.blob.arrayBuffer()) : registro.blob;
                pastaMedia.file(nomeArquivo, conteudoZip);
                entrada.arquivo = nomeArquivo;
                entrada.mimeType = registro.mimeType || registro.blob.type || null;
                entrada.tamanho = registro.blob.size;
                entrada.sha256 = await sha256BlobSeguro(registro.blob);
                manifest.estatisticas.bytesMidia += registro.blob.size;
            } else if (registro.texto) {
                entrada.texto = registro.texto; // ex: assinatura (dataURL pequeno) ou mensagem de texto para o futuro
                entrada.sha256Texto = await sha256BlobSeguro(new Blob([registro.texto], { type: 'text/plain' }));
            } else {
                continue;
            }
            manifest.medias.push(entrada);
        } catch (e) {
            await registrarDiagnosticoSeguro('backup.empacotar_midia', e, { id: registro.id, tipo: registro.tipo });
            throw new Error(`Não foi possível incluir a mídia "${registro.id}" no backup. O backup anterior foi preservado.`);
        }
    }

    manifest.estatisticas.medias = manifest.medias.length;

    zip.file('manifest.json', JSON.stringify(manifest), { compression: 'DEFLATE', compressionOptions: { level: 6 } });
    // Cabeçalhos estáveis: uma mensagem nova não altera os bytes das fotos/vídeos.
    for (const arquivo of Object.values(zip.files)) arquivo.date = new Date('2000-01-01T00:00:00Z');
    // Sem compressão adicional (STORE): mídia já vem comprimida (MP4/JPEG),
    // recomprimir só gastaria processamento à toa.
    const ambienteNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    const tipoSaida = ambienteNode ? 'uint8array' : 'blob';
    const gerado = await zip.generateAsync({ type: tipoSaida, compression: 'STORE' });
    return tipoSaida === 'blob' ? gerado : new Blob([gerado], { type: 'application/zip' });
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
    await salvarConfiguracao('aurora_lembrete_backup_adiado_em', String(Date.now()), false, false);
    esconderLembreteBackup();
}

async function baixarBackupCompleto() {
    const botao = document.getElementById('btnBackup');
    const textoOriginal = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Preparando backup...';

    try {
        const blob = await gerarBackupZipBlob();
        await salvarOuCompartilharArquivo(blob, `backup-nossa-historia-${new Date().toISOString().slice(0, 10)}.zip`, 'application/zip');

        // Registra quando o último backup manual foi feito — usado pelo
        // lembrete de backup (ver verificarLembreteBackup) pra não incomodar
        // toda vez, só quando já faz tempo que ninguém baixa uma cópia.
        await salvarConfiguracao('aurora_ultimo_backup_manual', String(Date.now()), false, false);
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
function manifestParaConfiguracoes(manifest) {
    const saida = Object.assign({}, manifest.configuracoes || {});
    const antigos = {
        aurora_data_pedido: manifest.dataPedido,
        aurora_primeiro_acesso: manifest.dataInicioRelacionamento,
        aurora_stage: manifest.stage,
        aurora_regras_contrato: manifest.regrasContrato,
        aurora_quiz_respostas: manifest.quizRespostas,
        aurora_video_pedido_youtube: manifest.videoPedidoYoutube,
        aurora_checklist_encontros: manifest.checklistEncontros,
        aurora_checklist_itens_customizados: manifest.checklistItensCustomizados,
        aurora_mapa_lugares_extra: manifest.mapaLugaresExtra,
        aurora_previsoes_gabriel: manifest.previsoesRespostasGabriel,
        aurora_previsoes_ana: manifest.previsoesRespostasAna,
        aurora_previsoes_criado_em: manifest.previsoesCriadoEm,
        aurora_previsoes_ana_senha_hash: manifest.previsoesAnaSenhaHash,
        aurora_termometro_lista: manifest.termometroLista,
        aurora_cartas_condicionais_liberadas: manifest.cartasCondicionaisLiberadas,
        aurora_mural_ana: manifest.muralAna,
        aurora_primeiras_vezes: manifest.primeirasVezes,
        aurora_contrato_fechado: manifest.contratoFechado
    };
    for (const [chave, valor] of Object.entries(antigos)) {
        if (valor === undefined || valor === null || chave in saida) continue;
        saida[chave] = typeof valor === 'string' ? valor : JSON.stringify(valor);
    }
    return saida;
}

function tentarJSON(valor) {
    if (typeof valor !== 'string') return valor;
    try { return JSON.parse(valor); } catch (_) { return valor; }
}

function timestampSeguro(valor) {
    if (!valor) return 0;
    const numero = Number(valor);
    if (Number.isFinite(numero)) return numero;
    const data = Date.parse(valor);
    return Number.isFinite(data) ? data : 0;
}

function mesclarArrayPreservando(a, b) {
    const resultado = [];
    const posicoesPorId = new Map();
    const vistosSemId = new Set();
    for (const item of [...a, ...b]) {
        const temId = item && typeof item === 'object' && item.id;
        if (!temId) {
            const identidade = JSON.stringify(item);
            if (!vistosSemId.has(identidade)) {
                vistosSemId.add(identidade);
                resultado.push(item);
            }
            continue;
        }

        if (!posicoesPorId.has(item.id)) {
            posicoesPorId.set(item.id, resultado.length);
            resultado.push(Object.assign({}, item));
            continue;
        }

        // Quando há relógio por registro, a edição mais recente vira a
        // canônica. Sem relógio, o local prevalece e campos exclusivos do
        // outro aparelho ainda são incorporados.
        const indice = posicoesPorId.get(item.id);
        const atual = resultado[indice];
        const tempoAtual = timestampSeguro(atual.atualizadoEm || atual.criadoEm || atual.data);
        const tempoItem = timestampSeguro(item.atualizadoEm || item.criadoEm || item.data);
        const unido = tempoItem > tempoAtual ? Object.assign({}, atual, item) : Object.assign({}, item, atual);
        const exclusaoMaisNova = Math.max(timestampSeguro(item.excluidoEm), timestampSeguro(atual.excluidoEm));
        if (exclusaoMaisNova > Math.max(tempoAtual, tempoItem)) {
            unido.excluidoEm = new Date(exclusaoMaisNova).toISOString();
        } else if (Math.max(tempoAtual, tempoItem) > exclusaoMaisNova) {
            delete unido.excluidoEm;
        }
        resultado[indice] = unido;
    }
    return resultado;
}

function mesclarConfiguracaoPreservando(chave, local, remoto, conflitos, relogios = {}) {
    if (local === undefined || local === null || local === '') return remoto;
    if (remoto === undefined || remoto === null || remoto === '' || local === remoto) return local;
    const a = tentarJSON(local);
    const b = tentarJSON(remoto);
    if (['aurora_config_modificados_em', 'aurora_config_excluidas_em', 'aurora_checklist_alteracoes_em'].includes(chave) &&
        a && b && typeof a === 'object' && typeof b === 'object') {
        const unido = Object.assign({}, a);
        for (const [id, valor] of Object.entries(b)) unido[id] = Math.max(Number(unido[id]) || 0, Number(valor) || 0);
        return JSON.stringify(unido);
    }
    if (Array.isArray(a) && Array.isArray(b)) return JSON.stringify(mesclarArrayPreservando(a, b));
    if (chave === 'aurora_checklist_encontros' && a && b && typeof a === 'object' && typeof b === 'object') {
        const unido = Object.assign({}, b, a);
        for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) unido[id] = Boolean(a[id] || b[id]);
        return JSON.stringify(unido);
    }
    if (chave === 'aurora_cartas_condicionais_confirmacoes' && a && b && typeof a === 'object' && typeof b === 'object') {
        const unido = {};
        for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
            const localItem = a[id] && typeof a[id] === 'object' ? a[id] : {};
            const remotoItem = b[id] && typeof b[id] === 'object' ? b[id] : {};
            unido[id] = {
                ana: Boolean(localItem.ana || remotoItem.ana),
                gabriel: Boolean(localItem.gabriel || remotoItem.gabriel)
            };
        }
        return JSON.stringify(unido);
    }
    if (chave === 'aurora_stage') return (local === 'final' || remoto === 'final') ? 'final' : local;

    // Valores simples (texto, senha hash, estágio intermediário, flags etc.)
    // precisam convergir para a edição mais recente. Os relógios por chave
    // são gravados atomicamente com o valor em db.js. Na ausência de relógio
    // (backup legado), mantém o comportamento conservador: local canônico e
    // remoto preservado no diário de conflitos.
    const tempoLocal = timestampSeguro(relogios.modificadosLocal && relogios.modificadosLocal[chave]);
    const tempoRemoto = timestampSeguro(relogios.modificadosRemotos && relogios.modificadosRemotos[chave]);
    if (tempoRemoto > tempoLocal) return remoto;
    if (tempoLocal > tempoRemoto) return local;
    conflitos.push({ chave, valorPreservado: remoto, detectadoEm: new Date().toISOString() });
    return local;
}

function mesclarChecklistVersionado(estadoLocal = {}, estadoRemoto = {}, versoesLocal = {}, versoesRemoto = {}) {
    const resultado = {};
    for (const id of new Set([...Object.keys(estadoLocal || {}), ...Object.keys(estadoRemoto || {})])) {
        const tempoLocal = Number(versoesLocal && versoesLocal[id]) || 0;
        const tempoRemoto = Number(versoesRemoto && versoesRemoto[id]) || 0;
        resultado[id] = tempoLocal === tempoRemoto
            ? Boolean((estadoLocal && estadoLocal[id]) || (estadoRemoto && estadoRemoto[id]))
            : (tempoLocal > tempoRemoto ? Boolean(estadoLocal && estadoLocal[id]) : Boolean(estadoRemoto && estadoRemoto[id]));
    }
    return resultado;
}

async function validarEPrepararBackupZip(zipDados) {
    if (typeof JSZip === 'undefined') throw new Error('Não foi possível carregar o leitor de backup (JSZip). Verifique sua conexão.');
    const zip = await JSZip.loadAsync(zipDados, { checkCRC32: true });
    const manifestArquivo = zip.file('manifest.json');
    if (!manifestArquivo) throw new Error('Backup inválido: manifest.json não encontrado.');
    const manifest = JSON.parse(await manifestArquivo.async('string'));
    if (!manifest || !manifest.versao || !Array.isArray(manifest.medias)) throw new Error('Backup inválido: manifesto incompatível.');

    const registros = [];
    for (const entrada of manifest.medias) {
        if (!entrada || !entrada.id || !entrada.tipo) throw new Error('Backup inválido: mídia sem identidade persistente.');
        const registro = { id: entrada.id, tipo: entrada.tipo, subtipo: entrada.subtipo || undefined, criadoEm: entrada.criadoEm || Date.now(), atualizadoEm: entrada.atualizadoEm || entrada.criadoEm || Date.now(), excluidoEm: entrada.excluidoEm || undefined };
        if (entrada.arquivo) {
            const arquivoZip = zip.file(`media/${entrada.arquivo}`);
            if (!arquivoZip) throw new Error(`Backup incompleto: mídia "${entrada.id}" ausente.`);
            const ambienteNode = typeof process !== 'undefined' && process.versions && process.versions.node;
            if (!ambienteNode) registro.blob = await arquivoZip.async('blob');
            else registro.blob = new Blob([await arquivoZip.async('uint8array')], { type: entrada.mimeType || 'application/octet-stream' });
            registro.mimeType = entrada.mimeType || registro.blob.type || null;
            if (!registro.blob.size) throw new Error(`Backup inválido: mídia "${entrada.id}" possui zero bytes.`);
            if (entrada.tamanho && registro.blob.size !== entrada.tamanho) throw new Error(`Backup corrompido: tamanho de "${entrada.id}" não confere.`);
            if (entrada.sha256) {
                const hash = await sha256BlobSeguro(registro.blob);
                if (hash && hash !== entrada.sha256) throw new Error(`Backup corrompido: checksum de "${entrada.id}" não confere.`);
            }
        } else if (typeof entrada.texto === 'string') {
            registro.texto = entrada.texto;
            if (entrada.sha256Texto) {
                const hashTexto = await sha256BlobSeguro(new Blob([entrada.texto], { type: 'text/plain' }));
                if (hashTexto && hashTexto !== entrada.sha256Texto) throw new Error(`Backup corrompido: checksum do texto "${entrada.id}" não confere.`);
            }
        } else {
            throw new Error(`Backup inválido: mídia "${entrada.id}" não possui conteúdo.`);
        }
        registros.push(registro);
    }
    return { manifest, registros };
}

// Restauração append-first: valida tudo antes e aplica em uma transação.
// Nada é apagado. Conflitos são preservados com outra identidade.
async function aplicarBackupDeZip(zipDados) {
    const preparado = await validarEPrepararBackupZip(zipDados);
    const configuracoesRemotas = manifestParaConfiguracoes(preparado.manifest);
    const configsAtuais = new Map((await db.configuracoes.toArray()).map(x => [x.chave, x.valor]));
    const conflitos = tentarJSON(configsAtuais.get('aurora_conflitos_preservados') || '[]');
    const conflitosLista = Array.isArray(conflitos) ? conflitos : [];
    const configsMescladas = [];
    const estadoChecklistLocal = tentarJSON(configsAtuais.get('aurora_checklist_encontros') || '{}');
    const estadoChecklistRemoto = tentarJSON(configuracoesRemotas.aurora_checklist_encontros || '{}');
    const versoesChecklistLocal = tentarJSON(configsAtuais.get('aurora_checklist_alteracoes_em') || '{}');
    const versoesChecklistRemoto = tentarJSON(configuracoesRemotas.aurora_checklist_alteracoes_em || '{}');
    const modificadosLocal = tentarJSON(configsAtuais.get('aurora_config_modificados_em') || '{}');
    const modificadosRemotos = tentarJSON(configuracoesRemotas.aurora_config_modificados_em || '{}');
    const estadoChecklistMesclado = mesclarChecklistVersionado(estadoChecklistLocal, estadoChecklistRemoto, versoesChecklistLocal, versoesChecklistRemoto);

    for (const [chave, remotoBruto] of Object.entries(configuracoesRemotas)) {
        if (chaveConfigEhTecnica(chave)) continue;
        const remoto = typeof remotoBruto === 'string' ? remotoBruto : JSON.stringify(remotoBruto);
        const valor = chave === 'aurora_checklist_encontros'
            ? JSON.stringify(estadoChecklistMesclado)
            : mesclarConfiguracaoPreservando(chave, configsAtuais.get(chave), remoto, conflitosLista, { modificadosLocal, modificadosRemotos });
        configsMescladas.push({ chave, valor });
    }
    if (conflitosLista.length) configsMescladas.push({ chave: 'aurora_conflitos_preservados', valor: JSON.stringify(conflitosLista.slice(-100)) });

    const configsMescladasMapa = new Map(configsMescladas.map(item => [item.chave, item.valor]));
    const modificados = tentarJSON(configsMescladasMapa.get('aurora_config_modificados_em') || configsAtuais.get('aurora_config_modificados_em') || '{}');
    const excluidas = tentarJSON(configsMescladasMapa.get('aurora_config_excluidas_em') || configsAtuais.get('aurora_config_excluidas_em') || '{}');
    const configsParaExcluir = Object.entries(excluidas && typeof excluidas === 'object' ? excluidas : {})
        .filter(([chave, excluidoEm]) =>
            typeof chaveConfigPodeSerApagada === 'function' &&
            chaveConfigPodeSerApagada(chave) &&
            Number(excluidoEm) > Number(modificados && modificados[chave] || 0))
        .map(([chave]) => chave);
    const exclusoesSet = new Set(configsParaExcluir);

    const mediasAtuais = new Map((await db.media.toArray()).map(x => [x.id, x]));
    const mediasParaGravar = [];
    for (const remoto of preparado.registros) {
        const local = mediasAtuais.get(remoto.id);
        if (!local) { mediasParaGravar.push(remoto); continue; }
        if (remoto.excluidoEm && local.excluidoEm) {
            if (timestampSeguro(remoto.excluidoEm) > timestampSeguro(local.excluidoEm)) mediasParaGravar.push(Object.assign({}, local, { excluidoEm: remoto.excluidoEm, atualizadoEm: remoto.excluidoEm }));
            continue;
        }
        if (remoto.excluidoEm && !local.excluidoEm) {
            if (timestampSeguro(remoto.excluidoEm) >= timestampSeguro(local.atualizadoEm || local.criadoEm || 0)) {
                mediasParaGravar.push(Object.assign({}, local, { excluidoEm: remoto.excluidoEm, atualizadoEm: remoto.excluidoEm }));
            }
            continue;
        }
        if (local.excluidoEm && !remoto.excluidoEm) {
            if (timestampSeguro(remoto.atualizadoEm || remoto.criadoEm || 0) > timestampSeguro(local.excluidoEm)) mediasParaGravar.push(remoto);
            continue;
        }
        const localTamanho = local.blob ? local.blob.size : String(local.texto || '').length;
        const remotoTamanho = remoto.blob ? remoto.blob.size : String(remoto.texto || '').length;
        if (local.blob && remoto.blob && localTamanho === remotoTamanho) {
            const [hashLocal, hashRemoto] = await Promise.all([sha256BlobSeguro(local.blob), sha256BlobSeguro(remoto.blob)]);
            if (hashLocal && hashLocal === hashRemoto) continue;
        } else if (!local.blob && !remoto.blob && local.texto === remoto.texto) {
            continue;
        }
        const remotoEhMaisNovo = timestampSeguro(remoto.atualizadoEm || remoto.criadoEm || 0) > timestampSeguro(local.atualizadoEm || local.criadoEm || 0);
        const manterComoAlternativo = remotoEhMaisNovo ? local : remoto;
        const sufixo = manterComoAlternativo.blob ? (await sha256BlobSeguro(manterComoAlternativo.blob) || gerarIdUnico('hash')).slice(0, 10) : gerarIdUnico('texto').slice(-10);
        if (remotoEhMaisNovo) mediasParaGravar.push(remoto);

        // A gravação local já preserva a versão substituída imediatamente.
        // Ao mesclar um backup, não duplica essa mesma cópia com outro id.
        const alternativasExistentes = [...mediasAtuais.values()].filter(item => item.idOriginal === remoto.id);
        let jaPreservada = false;
        for (const alternativa of alternativasExistentes) {
            if (alternativa.blob && manterComoAlternativo.blob && alternativa.blob.size === manterComoAlternativo.blob.size) {
                const [hashAlternativa, hashPreservar] = await Promise.all([
                    sha256BlobSeguro(alternativa.blob),
                    sha256BlobSeguro(manterComoAlternativo.blob)
                ]);
                if (hashAlternativa && hashAlternativa === hashPreservar) { jaPreservada = true; break; }
            } else if (!alternativa.blob && !manterComoAlternativo.blob && alternativa.texto === manterComoAlternativo.texto) {
                jaPreservada = true;
                break;
            }
        }
        if (!jaPreservada) {
            mediasParaGravar.push(Object.assign({}, manterComoAlternativo, { id: `${remoto.id}__preservado_${sufixo}`, idOriginal: remoto.id }));
        }
    }

    await db.transaction('rw', db.configuracoes, db.media, async () => {
        // Revalidar dentro da transação evita sobrescrever uma mensagem digitada
        // enquanto o download e os hashes estavam sendo processados.
        const configsAgora = await db.configuracoes.toArray();
        const assinaturaConfigs = itens => JSON.stringify([...itens]
            .filter(([chave]) => !chaveConfigEhTecnica(chave)).sort(([a], [b]) => a.localeCompare(b)));
        const assinaturaMedias = itens => JSON.stringify([...itens].map(item =>
            [item.id, item.atualizadoEm, item.criadoEm, item.excluidoEm, item.blob?.size, item.texto])
            .sort(([a], [b]) => String(a).localeCompare(String(b))));
        if (assinaturaConfigs(configsAtuais) !== assinaturaConfigs(configsAgora.map(item => [item.chave, item.valor])) ||
            assinaturaMedias(mediasAtuais.values()) !== assinaturaMedias(await db.media.toArray())) {
            throw new Error('Os dados locais mudaram durante a atualização. A sincronização será repetida sem sobrescrever suas alterações.');
        }
        const configsValidas = configsMescladas.filter(item => !exclusoesSet.has(item.chave));
        if (configsValidas.length) await db.configuracoes.bulkPut(configsValidas);
        if (configsParaExcluir.length) await db.configuracoes.bulkDelete(configsParaExcluir);
        if (mediasParaGravar.length) await db.media.bulkPut(mediasParaGravar);
    });
    for (const item of configsMescladas) {
        try {
            if (exclusoesSet.has(item.chave)) localStorage.removeItem(item.chave);
            else localStorage.setItem(item.chave, typeof item.valor === 'string' ? item.valor : JSON.stringify(item.valor));
        } catch (_) { /* IndexedDB continua sendo a cópia durável */ }
    }
    for (const chave of configsParaExcluir) {
        try { localStorage.removeItem(chave); } catch (_) { /* IndexedDB continua sendo a fonte de verdade */ }
    }
    try { await exibirPolaroidSalva(); } catch (_) { /* página pode não possuir o componente */ }
    return { manifest: preparado.manifest, configuracoesAplicadas: configsMescladas.length, mediasNovas: mediasParaGravar.length };
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
    if (backup.checklistEncontros) await salvarConfiguracao('aurora_checklist_encontros', JSON.stringify(backup.checklistEncontros));
    if (backup.checklistItensCustomizados) await salvarConfiguracao('aurora_checklist_itens_customizados', JSON.stringify(backup.checklistItensCustomizados));

    if (backup.assinatura) await salvarMedia({ id: 'assinatura', tipo: 'assinatura', texto: backup.assinatura });

    if (backup.video) {
        const blobVideo = dataURLParaBlob(backup.video);
        await salvarMedia({ id: 'video_pedido', tipo: 'video_pedido', blob: blobVideo, mimeType: backup.videoMime || 'video/webm' });
    }

    if (backup.polaroidGerada) {
        await salvarMedia({ id: 'polaroid_gerada', tipo: 'polaroid_gerada', blob: dataURLParaBlob(backup.polaroidGerada) });
    }

    if (Array.isArray(backup.mensagensFuturo)) {
        for (const item of backup.mensagensFuturo) {
            const id = item.id || gerarIdUnico('futuro');
            if (await obterMedia(id)) continue;
            await salvarMedia({
                id,
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
            const id = item.id || gerarIdUnico('lembranca');
            if (await obterMedia(id)) continue;
            await salvarMedia({ id, tipo: 'lembranca', blob: dataURLParaBlob(item.imagem), criadoEm: item.criadoEm || Date.now() });
        }
    }

    await exibirPolaroidSalva();
}

async function restaurarBackupDeArquivo(arquivo) {
    const statusEl = document.getElementById('restaurarStatus');
    statusEl.textContent = 'Lendo arquivo de backup...';
    statusEl.className = 'save-status pending';
    let restaurado = false;

    // Suprime envios à nuvem durante a restauração (cada item restaurado
    // dispararia um envio); a sincronização de verdade acontece uma vez só,
    // no próximo carregamento da página.
    __auroraAplicandoBackupRemoto = true;
    try {
        const nome = (arquivo.name || '').toLowerCase();
        if (nome.endsWith('.json')) {
            // Formato antigo, compatibilidade com backups já existentes.
            const texto = await arquivo.text();
            const backup = JSON.parse(texto);
            await aplicarBackupLegadoDeJson(backup);
        } else {
            // Formato novo (.zip), padrão atual.
            const dados = await arquivo.arrayBuffer();
            await aplicarBackupDeZip(dados);
        }
        await salvarConfiguracao('aurora_sync_dirty', '1', false, false);
        try { window.__auroraSyncDirtyMemoria = true; } catch (_) { /* ambiente sem window */ }
        restaurado = true;
        statusEl.textContent = 'Backup validado e mesclado com sucesso. Os dados atuais foram preservados.';
        statusEl.className = 'save-status ok';
    } catch (err) {
        console.error('Falha ao restaurar backup', err);
        const codigo = await registrarDiagnosticoSeguro('backup.restauracao_manual', err, { nome: arquivo && arquivo.name ? arquivo.name.slice(-120) : '' });
        statusEl.textContent = `Não foi possível restaurar. Os dados atuais não foram alterados.${codigo ? ` Código: ${codigo}` : ''}`;
        statusEl.className = 'save-status err';
    } finally {
        __auroraAplicandoBackupRemoto = false;
    }

    // Uma restauração manual é uma alteração local deliberada. Publica a
    // união imediatamente e só informa conclusão total depois da confirmação
    // remota; se a rede falhar, o dirty persiste e o retry automático assume.
    if (restaurado && typeof syncEstaConfigurado === 'function' && syncEstaConfigurado() && typeof publicarComIndicadorVisivel === 'function') {
        statusEl.textContent = 'Backup restaurado. Confirmando a união na nuvem...';
        statusEl.className = 'save-status pending';
        try {
            await publicarComIndicadorVisivel();
            statusEl.textContent = 'Backup validado, mesclado e confirmado na nuvem com sucesso.';
            statusEl.className = 'save-status ok';
        } catch (err) {
            if (typeof tratarFalhaEnvioAutomatico === 'function') tratarFalhaEnvioAutomatico(err);
            statusEl.textContent = 'Backup restaurado neste aparelho. A confirmação na nuvem ficou pendente e será tentada novamente.';
            statusEl.className = 'save-status err';
        }
    }
    return restaurado;
}

function iniciarModuloExport() {
    const maisOpcoesOverlay = document.getElementById('maisOpcoesOverlay');
    document.getElementById('btnMaisOpcoes').addEventListener('click', () => { maisOpcoesOverlay.classList.remove('d-none'); maisOpcoesOverlay.scrollTop = 0; bloquearScrollFundoLembranca(); });
    document.getElementById('btnFecharMaisOpcoes').addEventListener('click', () => { maisOpcoesOverlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); });
    maisOpcoesOverlay.addEventListener('click', (evt) => { if (evt.target === maisOpcoesOverlay) { maisOpcoesOverlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); } });

    document.getElementById('btnExportarConstelacao').addEventListener('click', () => gerarConstelacao());
    document.getElementById('btnExportarCartaFisica').addEventListener('click', gerarCartaFisica);

    // O clique abre a câmera em vez de gerar a Polaroid direto.
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

// Exporta apenas funções puras quando o arquivo é carregado pelos testes
// automatizados do repositório. No navegador, `module` não existe.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        tentarJSON,
        mesclarArrayPreservando,
        mesclarConfiguracaoPreservando,
        mesclarChecklistVersionado,
        timestampSeguro,
        manifestParaConfiguracoes,
        sha256BlobSeguro,
        gerarBackupZipBlob,
        validarEPrepararBackupZip,
        aplicarBackupDeZip
    };
}
