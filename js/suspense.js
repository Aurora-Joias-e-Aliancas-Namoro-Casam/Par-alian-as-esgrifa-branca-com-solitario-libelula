/**
 * ============================================================================
 * SUSPENSE.JS — Sequência "Enquanto confirmamos seu pedido" até a carta final
 * ============================================================================
 * Ordem da experiência:
 *   1. Loader de "processando pagamento"
 *   2. Perguntas românticas (o botão "Não" nunca é alcançável de verdade)
 *   3. Galeria de fotos (polaroids)
 *   4. Texto digitado
 *   5. Assinatura
 *   6. Rastreio da entrega (para antes de chegar a 0km)
 *   7. Verificação de identidade -> pede para virar o celular e gravar
 *   8. Foto final + carta (o toque na carta é o que dispara a música — ver
 *      iniciarCartaFinal() para o porquê disso resolver o bug do autoplay)
 * ============================================================================
 */

/* ---------------- Perguntas românticas ---------------- */
let perguntaAtual = 0;

function mostrarPergunta() {
    const p = PERGUNTAS_SUSPENSE[perguntaAtual];
    document.getElementById('questionText').textContent = p.texto;
    document.getElementById('btnYes').textContent = p.sim;
    document.getElementById('btnNo').textContent = p.nao;
    resetarBotaoNaoFujao();

    const dots = document.getElementById('questionDots');
    dots.innerHTML = '';
    PERGUNTAS_SUSPENSE.forEach((_, i) => {
        const span = document.createElement('span');
        if (i < perguntaAtual) span.classList.add('done');
        dots.appendChild(span);
    });
}

/**
 * A brincadeira do botão "Não" (Prioridade 4): a cada tentativa de toque,
 * o botão foge para uma posição aleatória dentro do card e uma mensagem
 * divertida aparece. Depois de algumas fugas, o botão passa a se esquivar
 * também do dedo que se aproxima (via pointerenter), tornando praticamente
 * impossível de tocar — sempre de forma leve e bem-humorada, nunca hostil.
 */
const MENSAGENS_BOTAO_FUJAO = [
    'Ih, ele fugiu! Tenta de novo 😄',
    'Esse botão parece que não quer ser encontrado...',
    'Quase! Mas não foi dessa vez 🏃',
    'Ele é rápido, hein?',
    'Acho que esse botão só existe de mentirinha 👀',
    'Vai por mim: tenta o outro 💛'
];
let tentativasBotaoNao = 0;

function resetarBotaoNaoFujao() {
    const btnNo = document.getElementById('btnNo');
    btnNo.style.position = 'relative';
    btnNo.style.left = '0px';
    btnNo.style.top = '0px';
    tentativasBotaoNao = 0;
    const legenda = document.getElementById('btnNoLegenda');
    if (legenda) legenda.textContent = '';
}

function fugirBotaoNao(origem) {
    const btnNo = origem;
    const card = document.getElementById('questionBox');
    tentativasBotaoNao++;

    const cardRect = card.getBoundingClientRect();
    const btnRect = btnNo.getBoundingClientRect();
    const margem = 10;
    const maxX = Math.max(0, cardRect.width - btnRect.width - margem * 2);
    const maxY = Math.max(0, 60); // desloca verticalmente pouco, o suficiente para escapar do dedo

    const novoX = Math.random() * maxX - maxX / 2;
    const novoY = (Math.random() - 0.5) * maxY;

    btnNo.style.position = 'relative';
    btnNo.style.transition = 'left 0.25s ease, top 0.25s ease';
    btnNo.style.left = `${novoX}px`;
    btnNo.style.top = `${novoY}px`;

    const legenda = document.getElementById('btnNoLegenda');
    if (legenda) {
        legenda.textContent = MENSAGENS_BOTAO_FUJAO[Math.min(tentativasBotaoNao - 1, MENSAGENS_BOTAO_FUJAO.length - 1)];
    }
}

function avancarPergunta() {
    perguntaAtual++;
    if (perguntaAtual < PERGUNTAS_SUSPENSE.length) {
        mostrarPergunta();
    } else {
        document.getElementById('questionBox').classList.add('d-none');
        iniciarGaleriaFotos();
    }
}

/* ---------------- Galeria de fotos (polaroids) ---------------- */
function carregarImagensPolaroid() {
    aplicarImagemPlaceholder(document.getElementById('foto1img'), 'imagem_casal_1', 'Nosso início');
    aplicarImagemPlaceholder(document.getElementById('foto2img'), 'imagem_casal_2', 'Nossos sorrisos');
    aplicarImagemPlaceholder(document.getElementById('foto3img'), 'imagem_casal_3', 'Nosso amor');
}

function iniciarGaleriaFotos() {
    document.getElementById('photoGallery').classList.remove('d-none');
    const fotos = ['foto1', 'foto2', 'foto3'];
    const intervaloEntreFotos = 1300;
    const tempoDeContemplacao = 5600;

    fotos.forEach((id, i) => {
        setTimeout(() => {
            const el = document.getElementById(id);
            el.style.display = 'block';
            requestAnimationFrame(() => { el.classList.add('foto-visivel'); });
        }, i * intervaloEntreFotos);
    });

    setTimeout(() => {
        document.getElementById('photoGallery').classList.add('d-none');
        iniciarDigitacao();
    }, fotos.length * intervaloEntreFotos + tempoDeContemplacao);
}

/* ---------------- Texto digitado ---------------- */
function iniciarDigitacao() {
    const mensagem = TEXTOS.digitacaoSuspense;
    const typingScreen = document.getElementById('typingScreen');
    const typedText = document.getElementById('typedText');
    typedText.textContent = '';
    typingScreen.style.display = 'block';

    let i = 0;
    const intervalo = setInterval(() => {
        typedText.textContent += mensagem.charAt(i);
        i++;
        if (i >= mensagem.length) {
            clearInterval(intervalo);
            setTimeout(() => { typingScreen.style.display = 'none'; iniciarAssinatura(); }, 1400);
        }
    }, 35);
}

/* ---------------- Assinatura (canvas com fundo transparente) ---------------- */
let sigCtx, sigTemTraco = false;

function pintarFundoBrancoCanvas(canvas, ctx) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function ajustarCanvasSignature(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = 160 * ratio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '160px';
    const ctx = canvas.getContext('2d');
    pintarFundoBrancoCanvas(canvas, ctx);
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2b2b2b';
    return ctx;
}

function coordsDoEvento(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const ponto = evt.touches ? evt.touches[0] : evt;
    return { x: ponto.clientX - rect.left, y: ponto.clientY - rect.top };
}

function iniciarSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    sigCtx = ajustarCanvasSignature(canvas);
    sigTemTraco = false;
    let desenhando = false;

    const comecar = (evt) => { evt.preventDefault(); desenhando = true; sigTemTraco = true; const { x, y } = coordsDoEvento(canvas, evt); sigCtx.beginPath(); sigCtx.moveTo(x, y); };
    const desenhar = (evt) => { if (!desenhando) return; evt.preventDefault(); const { x, y } = coordsDoEvento(canvas, evt); sigCtx.lineTo(x, y); sigCtx.stroke(); };
    const parar = () => { desenhando = false; };

    canvas.addEventListener('mousedown', comecar);
    canvas.addEventListener('mousemove', desenhar);
    window.addEventListener('mouseup', parar);
    canvas.addEventListener('touchstart', comecar, { passive: false });
    canvas.addEventListener('touchmove', desenhar, { passive: false });
    canvas.addEventListener('touchend', parar);

    document.getElementById('btnLimparAssinatura').onclick = () => {
        pintarFundoBrancoCanvas(canvas, sigCtx);
        sigTemTraco = false;
        document.getElementById('signatureHint').textContent = 'Toque e arraste para assinar';
        document.getElementById('signatureHint').style.color = '#999';
    };
}

function gerarAssinaturaTransparente(canvas) {
    const largura = canvas.width, altura = canvas.height;
    const origem = canvas.getContext('2d').getImageData(0, 0, largura, altura);
    const saida = document.createElement('canvas');
    saida.width = largura; saida.height = altura;
    const outCtx = saida.getContext('2d');
    const destino = outCtx.createImageData(largura, altura);

    for (let i = 0; i < origem.data.length; i += 4) {
        const r = origem.data[i], g = origem.data[i + 1], b = origem.data[i + 2];
        const luminosidade = (r + g + b) / 3;
        if (luminosidade > 245) {
            destino.data[i + 3] = 0;
        } else {
            destino.data[i] = r; destino.data[i + 1] = g; destino.data[i + 2] = b;
            destino.data[i + 3] = Math.min(255, Math.round((255 - luminosidade) * 1.15));
        }
    }
    outCtx.putImageData(destino, 0, 0);
    return saida.toDataURL('image/png');
}

function iniciarAssinatura() {
    document.getElementById('signatureScreen').classList.remove('d-none');
    iniciarSignaturePad();

    document.getElementById('btnConfirmarAssinatura').onclick = async () => {
        if (!sigTemTraco) {
            const hint = document.getElementById('signatureHint');
            hint.textContent = 'Assine antes de confirmar :)';
            hint.style.color = '#c0392b';
            return;
        }
        const canvas = document.getElementById('signatureCanvas');
        const assinaturaPng = gerarAssinaturaTransparente(canvas);

        await salvarMedia({ id: 'assinatura', tipo: 'assinatura', texto: assinaturaPng });
        if (!(await obterConfiguracao('aurora_data_pedido'))) {
            await salvarConfiguracao('aurora_data_pedido', new Date().toISOString(), true);
        }

        if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch (e) {} }

        document.getElementById('signatureScreen').classList.add('d-none');
        iniciarRastreio();
    };
}

/* ---------------- Rastreio da entrega ---------------- */
function iniciarRastreio() {
    document.getElementById('trackingScreen').classList.remove('d-none');
    let distancia = 100;
    const distEl = document.getElementById('trackingDistance');
    const barEl = document.getElementById('trackingBar');
    distEl.textContent = distancia + 'km';
    barEl.style.width = '0%';

    const distanciaParada = Math.floor(Math.random() * 4) + 3;

    const intervalo = setInterval(() => {
        distancia -= Math.ceil(Math.random() * 14) + 6;
        if (distancia <= distanciaParada) {
            distancia = distanciaParada;
            clearInterval(intervalo);
            distEl.textContent = distancia + 'km';
            barEl.style.width = (100 - distancia) + '%';
            setTimeout(() => {
                document.getElementById('trackingScreen').classList.add('d-none');
                iniciarVerificacaoIdentidade();
            }, 1400);
            return;
        }
        distEl.textContent = distancia + 'km';
        barEl.style.width = (100 - distancia) + '%';
    }, 550);
}

function iniciarVerificacaoIdentidade() {
    const tela = document.getElementById('verificacaoScreen');
    tela.classList.remove('d-none');
    tela.classList.add('reveal-up');
}

/* ---------------- Gravação de vídeo (verificação de identidade) ---------------- */
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let permissoesLiberadas = false;
let videoJaSalvo = false;
let aguardandoRetornoPortrait = false;

async function solicitarPermissoes() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
        });
        permissoesLiberadas = true;
        const preview = document.getElementById('videoPreview');
        if (preview) preview.srcObject = mediaStream;
    } catch (err) {
        permissoesLiberadas = false;
        console.error('Permissão de câmera/microfone negada:', err);
    }
}

function verificarOrientacao() {
    const orientacaoMsg = document.getElementById('orientacaoMsg');
    const conteudoGravacao = document.getElementById('conteudoGravacao');
    const permissaoNegadaMsg = document.getElementById('permissaoNegadaMsg');
    const videoScreen = document.getElementById('videoScreen');
    const postRecordScreen = document.getElementById('postRecordScreen');

    if (videoScreen.classList.contains('d-none')) return;
    if (aguardandoRetornoPortrait) return;

    if (!permissoesLiberadas) {
        orientacaoMsg.classList.add('d-none');
        conteudoGravacao.classList.add('d-none');
        postRecordScreen.classList.add('d-none');
        permissaoNegadaMsg.classList.remove('d-none');
        return;
    }
    permissaoNegadaMsg.classList.add('d-none');

    if (ehPaisagem()) {
        orientacaoMsg.classList.add('d-none');
        conteudoGravacao.classList.remove('d-none');
        const preview = document.getElementById('videoPreview');
        if (mediaStream && !preview.srcObject && !videoJaSalvo) preview.srcObject = mediaStream;
    } else {
        orientacaoMsg.classList.remove('d-none');
        conteudoGravacao.classList.add('d-none');
    }
}

window.addEventListener('orientationchange', verificarOrientacao);
window.addEventListener('resize', verificarOrientacao);
if (screen.orientation) screen.orientation.addEventListener('change', verificarOrientacao);

function iniciarTelaDeVideo() {
    document.getElementById('videoScreen').classList.remove('d-none');
    aguardandoRetornoPortrait = false;
    if (!permissoesLiberadas) {
        solicitarPermissoes().then(verificarOrientacao);
    } else {
        verificarOrientacao();
    }
}

function baixarVideoAutomaticamente(blob, mimeType) {
    try {
        const extensao = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedido-de-namoro.${extensao}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
        console.error('Falha ao baixar o vídeo automaticamente:', err);
    }
}

async function salvarVideoComSeguranca(blob, mimeType) {
    const statusEl = document.getElementById('saveStatus');
    if (statusEl) { statusEl.textContent = 'Salvando vídeo com segurança...'; statusEl.className = 'save-status pending'; }

    const sucesso = await salvarMedia({ id: 'video_pedido', tipo: 'video_pedido', blob, mimeType });

    // O download automático acontece sempre, como camada extra de segurança,
    // independentemente do resultado do IndexedDB.
    baixarVideoAutomaticamente(blob, mimeType);

    if (statusEl) {
        if (sucesso) {
            const tamanhoMB = (blob.size / (1024 * 1024)).toFixed(1);
            const proximoDoLimite = blob.size > 45 * 1024 * 1024; // aviso perto do limite padrão de 50MB do bucket
            statusEl.textContent = `Vídeo salvo com sucesso (${tamanhoMB}MB). Baixando uma cópia automaticamente...` +
                (proximoDoLimite ? ' Atenção: esse vídeo está grande — pode não sincronizar com a nuvem se o bucket tiver limite de 50MB (veja diagnostico.html).' : '');
            statusEl.className = proximoDoLimite ? 'save-status pending' : 'save-status ok';
        } else {
            statusEl.textContent = 'Não foi possível confirmar o salvamento interno, mas o download automático foi iniciado — não feche o app até ele terminar.';
            statusEl.className = 'save-status err';
        }
    }
    return sucesso;
}

function iniciarEsperaPortrait() {
    aguardandoRetornoPortrait = true;
    document.getElementById('orientacaoMsg').classList.add('d-none');
    document.getElementById('conteudoGravacao').classList.add('d-none');
    document.getElementById('permissaoNegadaMsg').classList.add('d-none');
    document.getElementById('postRecordScreen').classList.remove('d-none');

    const checar = () => {
        if (!aguardandoRetornoPortrait) return;
        if (!ehPaisagem()) {
            aguardandoRetornoPortrait = false;
            document.getElementById('postRecordScreen').classList.add('d-none');
            if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
            finalizarSequencia();
            window.removeEventListener('orientationchange', checar);
            window.removeEventListener('resize', checar);
            if (screen.orientation) screen.orientation.removeEventListener('change', checar);
        }
    };
    window.addEventListener('orientationchange', checar);
    window.addEventListener('resize', checar);
    if (screen.orientation) screen.orientation.addEventListener('change', checar);
    checar();
}

function voltarParaRegravacao() {
    document.getElementById('videoActions').classList.add('d-none');
    document.getElementById('saveStatus').textContent = '';
    const playback = document.getElementById('videoPlayback');
    playback.style.display = 'none';
    playback.removeAttribute('src');
    document.getElementById('videoPreview').style.display = 'block';
    document.getElementById('btnIniciarGravacao').classList.remove('d-none');
    videoJaSalvo = false;
    if (mediaStream) document.getElementById('videoPreview').srcObject = mediaStream;
}

/* ---------------- Foto final + confetes ---------------- */
function obterFormasRomanticas() {
    try {
        if (typeof confetti !== 'undefined' && typeof confetti.shapeFromText === 'function') {
            return ['❤️', '🌻', '✨'].map(emoji => confetti.shapeFromText({ text: emoji, scalar: 2.6 }));
        }
    } catch (e) { console.error('Não foi possível gerar formas de emoji para o confete, usando fallback.', e); }
    return null;
}

function dispararConfetesRomanticos() {
    if (typeof confetti !== 'function') return;
    const formas = obterFormasRomanticas();
    const duracao = 3000;
    const fim = Date.now() + duracao;
    (function disparar() {
        const opcoesBase = formas ? { shapes: formas, scalar: 2.6, gravity: 0.7 } : { colors: ['#B76E79', '#FAF9F6', '#ffffff'] };
        confetti(Object.assign({ particleCount: formas ? 3 : 4, angle: 60, spread: 70, origin: { x: 0 } }, opcoesBase));
        confetti(Object.assign({ particleCount: formas ? 3 : 4, angle: 120, spread: 70, origin: { x: 1 } }, opcoesBase));
        if (Date.now() < fim) requestAnimationFrame(disparar);
    })();
}

function finalizarSequencia() {
    document.getElementById('videoScreen').classList.add('d-none');
    document.getElementById('finalScreen').classList.remove('d-none');
    aplicarImagemPlaceholder(document.getElementById('finalPhoto'), 'imagem_foto_final', 'Nossa foto');

    if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch (e) {} }

    dispararConfetesRomanticos();
    iniciarCartaFinal();
}

/* ---------------- Carta final (envelope + 1 Coríntios 13) ----------------
   CORREÇÃO DE TIMING DA MÚSICA (Prioridade 1, item 2):
   A música agora só começa a tocar dentro do próprio clique que abre o
   envelope (função abrirEnvelope, abaixo). Isso resolve dois problemas de
   uma vez: (1) ela deixa de tocar antes da hora, porque literalmente não
   existe nenhum outro lugar no código que a inicie; e (2) ela passa a
   funcionar no Safari/iPhone, porque o play() acontece de forma síncrona
   dentro de um gesto real de toque do usuário — exatamente o que as regras
   de autoplay do iOS exigem. Antes, o play() era chamado no clique de
   "Confirmar Pagamento", mas o áudio só ficava audível bem depois (após o
   rastreio, a verificação e a gravação), o que várias vezes já não contava
   mais como "gesto recente" para o Safari. */
function iniciarCartaFinal() {
    const envelope = document.getElementById('envelope');
    const envelopeHint = document.getElementById('envelopeHint');
    const letterEyebrow = document.getElementById('letterEyebrow');
    const letterTextEl = document.getElementById('letterTextFinal');
    const letterSignoff = document.getElementById('letterSignoff');
    const continuarWrap = document.getElementById('finalContinuarWrap');
    if (!envelope || !letterTextEl) return;

    let jaAbriu = false;
    letterTextEl.innerHTML = '';
    letterTextEl.classList.remove('versiculo-visivel');
    letterEyebrow.classList.remove('visivel');
    letterSignoff.classList.remove('visivel');
    letterSignoff.textContent = TEXTOS.assinaturaCartaFinal;
    continuarWrap.classList.add('d-none');

    function montarHtmlVersiculo() {
        let contador = 0;
        return textoVersiculoBase().replace(/\{AMOR\}/g, () => `<span class="amor-swap" id="amorSwap${contador++}">amor</span>`);
    }

    function revelarVersiculo() {
        letterEyebrow.classList.add('visivel');
        letterTextEl.innerHTML = montarHtmlVersiculo();
        requestAnimationFrame(() => letterTextEl.classList.add('versiculo-visivel'));

        setTimeout(() => {
            const trocas = Array.from(letterTextEl.querySelectorAll('.amor-swap'));
            trocas.forEach((span, i) => {
                setTimeout(() => {
                    span.style.opacity = '0';
                    setTimeout(() => { span.textContent = NOME_DELA; span.style.opacity = '1'; }, 420);
                }, i * 900);
            });

            const tempoTotalTrocas = trocas.length * 900 + 900;
            setTimeout(() => {
                letterSignoff.classList.add('visivel');
                setTimeout(() => {
                    continuarWrap.classList.remove('d-none');
                    continuarWrap.classList.add('reveal-up');
                    // Correção da Prioridade 1, item 5: garante que o botão
                    // "Continuar" fique visível na tela assim que aparecer,
                    // em vez de exigir rolagem manual até bem mais abaixo.
                    setTimeout(() => continuarWrap.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
                }, 700);
            }, tempoTotalTrocas);
        }, 1200);
    }

    function abrirEnvelope() {
        if (jaAbriu) return;
        jaAbriu = true;
        envelopeHint.classList.remove('visivel');
        envelope.classList.add('aberto');

        // Início da música: aqui, e só aqui — ver comentário acima da função.
        const audio = document.getElementById('musicaFundo');
        audio.currentTime = 0;
        audio.play().catch(err => console.error('Música não pôde iniciar (autoplay bloqueado?):', err));

        setTimeout(revelarVersiculo, 900);
    }

    envelope.addEventListener('click', abrirEnvelope);

    requestAnimationFrame(() => {
        envelope.classList.add('envelope-visivel');
        setTimeout(() => envelopeHint.classList.add('visivel'), 500);
    });
}

/* ---------------- Flashback cinematográfico ---------------- */
function iniciarFlashback(aoTerminar) {
    const tela = document.getElementById('flashbackScreen');
    const flash = document.getElementById('flashbackFlash');
    const label = document.getElementById('flashbackLabel');
    const fotos = ['fbFoto1', 'fbFoto2', 'fbFoto3', 'fbFoto4', 'fbFoto5'];
    const legendas = ['onde tudo começou', 'as risadinhas de sempre', 'os perrengues que resolvemos juntos', 'os dias mais simples', 'e hoje, mais um capítulo'];

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { aoTerminar(); return; }

    tela.style.display = 'flex';
    fotos.forEach(id => document.getElementById(id).classList.remove('fb-ativa'));
    label.classList.remove('fb-visivel');
    label.textContent = '';

    const intervaloEntreFotos = 1500;
    fotos.forEach((id, i) => {
        setTimeout(() => {
            fotos.forEach(outroId => document.getElementById(outroId).classList.remove('fb-ativa'));
            document.getElementById(id).classList.add('fb-ativa');
            flash.classList.add('fb-piscar');
            setTimeout(() => flash.classList.remove('fb-piscar'), 90);

            label.classList.remove('fb-visivel');
            setTimeout(() => { label.textContent = legendas[i] || ''; label.classList.add('fb-visivel'); }, 350);
        }, i * intervaloEntreFotos);
    });

    const duracaoTotal = fotos.length * intervaloEntreFotos + 900;
    setTimeout(() => {
        tela.style.display = 'none';
        fotos.forEach(id => document.getElementById(id).classList.remove('fb-ativa'));
        label.classList.remove('fb-visivel');
        aoTerminar();
    }, duracaoTotal);
}

function carregarImagensFlashback() {
    for (let i = 1; i <= 5; i++) {
        aplicarImagemPlaceholder(document.getElementById(`fbFoto${i}`).querySelector('img'), `imagem_flashback_${i}`, 'Momento do casal');
    }
}

/* ---------------- Inicialização e wiring de eventos ---------------- */
function iniciarSuspense() {
    carregarImagensPolaroid();
    carregarImagensFlashback();

    document.getElementById('btnConfirmarPedido').addEventListener('click', (evt) => {
        evt.target.disabled = true;
        definirFundoBody(CORES_FUNDO.escuro);
        document.getElementById('suspenseOverlay').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('loaderSuspense').classList.add('d-none');
            perguntaAtual = 0;
            mostrarPergunta();
            document.getElementById('questionBox').classList.remove('d-none');
        }, 2000);
    });

    document.getElementById('btnYes').addEventListener('click', avancarPergunta);
    // O botão "Não" nunca completa uma resposta: ao ser tocado, apenas foge.
    document.getElementById('btnNo').addEventListener('click', (evt) => fugirBotaoNao(evt.currentTarget));
    document.getElementById('btnNo').addEventListener('pointerenter', (evt) => {
        // Depois de 2 tentativas, o botão passa a fugir também da aproximação do cursor/dedo.
        if (tentativasBotaoNao >= 2) fugirBotaoNao(evt.currentTarget);
    });

    document.getElementById('btnConfirmarIdentidade').addEventListener('click', () => {
        document.getElementById('verificacaoScreen').classList.add('d-none');
        iniciarTelaDeVideo();
    });

    document.getElementById('btnIniciarGravacao').addEventListener('click', async () => {
        if (!mediaStream) {
            await solicitarPermissoes();
            verificarOrientacao();
            if (!mediaStream) return;
        }
        recordedChunks = [];
        videoJaSalvo = false;
        document.getElementById('saveStatus').textContent = '';
        const mimeType = getSupportedMimeType();
        const opcoesGravacao = montarOpcoesMediaRecorder('video'); // limita o bitrate (ver utils.js) para não estourar 50MB
        try {
            mediaRecorder = new MediaRecorder(mediaStream, opcoesGravacao);
        } catch (e) {
            // Navegador antigo que não aceita videoBitsPerSecond/audioBitsPerSecond — cai para o padrão dele.
            mediaRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
        }

        mediaRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); };

        mediaRecorder.onstop = async () => {
            const tipoFinal = mediaRecorder.mimeType || 'video/webm';
            const gravacaoBlob = new Blob(recordedChunks, { type: tipoFinal });

            document.getElementById('videoPreview').style.display = 'none';
            const playback = document.getElementById('videoPlayback');
            playback.src = URL.createObjectURL(gravacaoBlob);
            playback.style.display = 'block';

            await salvarVideoComSeguranca(gravacaoBlob, tipoFinal);
            videoJaSalvo = true;

            setTimeout(() => { iniciarEsperaPortrait(); }, 900);
        };

        mediaRecorder.start();
        document.getElementById('btnIniciarGravacao').classList.add('d-none');
        document.getElementById('btnPararGravacao').classList.remove('d-none');
    });

    document.getElementById('btnPararGravacao').addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        document.getElementById('btnPararGravacao').classList.add('d-none');
    });

    document.getElementById('btnRegravar').addEventListener('click', voltarParaRegravacao);

    document.getElementById('btnRegravarPos').addEventListener('click', () => {
        aguardandoRetornoPortrait = false;
        document.getElementById('postRecordScreen').classList.add('d-none');
        voltarParaRegravacao();
        verificarOrientacao();
    });

    document.getElementById('btnPedirPermissaoNovamente').addEventListener('click', async () => {
        await solicitarPermissoes();
        verificarOrientacao();
    });

    document.getElementById('btnVerHistoria').addEventListener('click', async () => {
        await salvarConfiguracao('aurora_stage', 'final', true);
        iniciarFlashback(() => { goToRomancePage(); });
    });
}
