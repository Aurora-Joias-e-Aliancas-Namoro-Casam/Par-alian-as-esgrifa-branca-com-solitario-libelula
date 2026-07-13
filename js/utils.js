/**
 * ============================================================================
 * UTILS.JS — Funções utilitárias compartilhadas
 * ============================================================================
 */

/* ---------------- Substituição segura de imagens (placeholders) ---------------- */
/**
 * Aplica getAsset() a uma <img> e prepara um "onerror" elegante: se o
 * arquivo real ainda não foi enviado para o /assets, mostra um quadro com
 * ícone + legenda em vez de um ícone de imagem quebrada.
 */
function gerarSvgPlaceholderComLegenda(legenda) {
    const texto = (legenda || 'Adicione esta foto').slice(0, 40);
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
            <rect width="400" height="400" fill="#f3e6e8"/>
            <path d="M200 240c-34-24-62-48-62-79a38 38 0 0 1 62-29 38 38 0 0 1 62 29c0 31-28 55-62 79z" fill="#e0b4bc"/>
            <text x="200" y="300" font-family="sans-serif" font-size="15" fill="#8f4d57" text-anchor="middle">${texto}</text>
        </svg>
    `);
}

/**
 * Aplica getAsset() a uma <img> e prepara um "onerror" elegante: se o
 * arquivo real ainda não foi enviado para o /assets, mostra uma imagem de
 * substituição (ícone + legenda) em vez do ícone de imagem quebrada do
 * navegador. Mantém sempre um elemento <img> de verdade (em vez de trocar
 * por uma <div>), para que trocas futuras de "src" (ex: miniaturas do
 * produto) continuem funcionando normalmente.
 */
function aplicarImagemPlaceholder(imgEl, placeholderId, legenda) {
    if (!imgEl) return;
    imgEl.dataset.placeholderId = placeholderId;
    imgEl.onerror = function () {
        if (this.dataset.fallbackAplicado) return;
        this.dataset.fallbackAplicado = '1';
        this.src = gerarSvgPlaceholderComLegenda(legenda);
    };
    imgEl.src = getAsset(placeholderId);
}

/**
 * Rede de segurança global: qualquer <img> do site que falhe ao carregar
 * (arquivo de placeholder ainda não enviado, link quebrado, etc.) recebe
 * uma imagem de substituição elegante em vez do ícone padrão de "imagem
 * quebrada" do navegador. Complementa aplicarImagemPlaceholder() para os
 * casos em que o src é trocado dinamicamente (ex: miniaturas do produto).
 */
const SVG_PLACEHOLDER_GENERICO = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="#f3e6e8"/>
        <path d="M200 260c-40-28-72-56-72-92a44 44 0 0 1 72-34 44 44 0 0 1 72 34c0 36-32 64-72 92z" fill="#e0b4bc"/>
    </svg>
`);

function iniciarFallbackImagensGlobais() {
    document.addEventListener('error', (e) => {
        const el = e.target;
        if (el && el.tagName === 'IMG' && !el.dataset.fallbackAplicado && el.src !== SVG_PLACEHOLDER_GENERICO) {
            el.dataset.fallbackAplicado = '1';
            el.src = SVG_PLACEHOLDER_GENERICO;
        }
    }, true);
}

/* ---------------- Bloqueio de zoom (pinça, duplo toque e gestos) ---------------- */
function bloquearZoom() {
    // Pinça em iOS Safari dispara eventos "gesture*" que ignoram o
    // user-scalable=no do viewport — precisam ser bloqueados manualmente.
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());

    // Pinça em navegadores baseados em Chromium chega como touchmove
    // com 2+ toques simultâneos.
    document.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    // Duplo toque para zoom.
    let ultimoToque = 0;
    document.addEventListener('touchend', (e) => {
        const agora = Date.now();
        if (agora - ultimoToque <= 300) e.preventDefault();
        ultimoToque = agora;
    }, { passive: false });

    document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault();
    });
}

/* ---------------- Orientação de tela ---------------- */
function ehPaisagem() {
    const angle = (screen.orientation && typeof screen.orientation.angle === 'number')
        ? screen.orientation.angle
        : window.orientation || 0;
    if (angle === 90 || angle === -90 || angle === 270) return true;
    return window.innerWidth > window.innerHeight;
}

/* ---------------- Tipos de mídia suportados por navegador ---------------- */
function getSupportedMimeType() {
    const tipos = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    for (const t of tipos) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
}

/** Detecta iOS (iPhone/iPad/iPod) — inclui o caso do iPadOS moderno, que se disfarça de "Macintosh" mas tem tela de toque. */
function ehIOS() {
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    // iPadOS 13+ reporta como "Macintosh", só diferenciável pelo suporte a toque.
    return ua.includes('Macintosh') && navigator.maxTouchPoints > 1;
}

function getSupportedMimeTypeParaModo(modo) {
    if (modo === 'video') return getSupportedMimeType();
    const tiposAudio = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    for (const t of tiposAudio) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
}

/* ----------------------------------------------------------------------
   BITRATES DE GRAVAÇÃO (evita estourar o limite de 50MB do Supabase)
   ----------------------------------------------------------------------
   Sem esses limites, o MediaRecorder usa o bitrate padrão do navegador,
   que costuma ser bem mais alto do que o necessário para uma tela de
   celular (em alguns navegadores, 8Mbps+ para 720p) — um vídeo de 1-2
   minutos nesse bitrate facilmente passa de 50-100MB. Com os valores
   abaixo, um vídeo de 720p em ~2 minutos fica em torno de 20-30MB,
   mantendo qualidade boa para visualização no celular.
   ---------------------------------------------------------------------- */
const OPCOES_GRAVACAO_VIDEO = { videoBitsPerSecond: 2_000_000, audioBitsPerSecond: 96_000 }; // ~2Mbps vídeo + 96kbps áudio
const OPCOES_GRAVACAO_AUDIO = { audioBitsPerSecond: 96_000 };

/* ----------------------------------------------------------------------
   ESPELHAMENTO REAL DO VÍDEO GRAVADO (não só a pré-visualização)
   ----------------------------------------------------------------------
   Em alguns aparelhos/navegadores, o stream BRUTO da câmera frontal já
   vem espelhado por baixo dos panos (não é um efeito visual — é assim
   que o próprio arquivo gravado sai). Um espelhamento por CSS (como o
   usado na pré-visualização da Polaroid) só muda o que aparece NA TELA;
   não afeta o que o MediaRecorder efetivamente grava. Pra corrigir o
   ARQUIVO de verdade, é preciso redesenhar cada quadro num <canvas>
   espelhado e gravar a partir dele — é isso que criarStreamEspelhado()
   faz abaixo, devolvendo um novo MediaStream (vídeo espelhado + o áudio
   original, sem processamento) pronto para o MediaRecorder.
   ---------------------------------------------------------------------- */
function criarStreamEspelhado(streamOriginal) {
    // Navegador sem suporte a captureStream (raro) — devolve o stream original sem espelhar, pra não quebrar a gravação.
    if (!streamOriginal || typeof HTMLCanvasElement === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
        return { stream: streamOriginal, parar: () => {} };
    }

    const trilhaVideo = streamOriginal.getVideoTracks()[0];
    const config = (trilhaVideo && trilhaVideo.getSettings) ? trilhaVideo.getSettings() : {};
    const largura = config.width || 1280;
    const altura = config.height || 720;

    const videoOrigem = document.createElement('video');
    videoOrigem.muted = true;
    videoOrigem.playsInline = true;
    videoOrigem.srcObject = streamOriginal;
    videoOrigem.play().catch(() => { /* alguns navegadores exigem interação — o loop abaixo espera o readyState mesmo assim */ });

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');

    let ativo = true;
    function desenharQuadro() {
        if (!ativo) return;
        if (videoOrigem.readyState >= 2) {
            ctx.save();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoOrigem, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
        requestAnimationFrame(desenharQuadro);
    }
    desenharQuadro();

    let streamCanvas, streamFinal;
    try {
        streamCanvas = canvas.captureStream(30);
        streamFinal = new MediaStream([...streamCanvas.getVideoTracks(), ...streamOriginal.getAudioTracks()]);
    } catch (e) {
        console.error('Falha ao espelhar o vídeo via canvas, gravando sem espelhar:', e);
        ativo = false;
        return { stream: streamOriginal, parar: () => {} };
    }

    return {
        stream: streamFinal,
        parar: () => { ativo = false; videoOrigem.pause(); videoOrigem.srcObject = null; }
    };
}
function montarOpcoesMediaRecorder(modo) {
    const mimeType = getSupportedMimeTypeParaModo(modo);

    // CORREÇÃO (bug relatado: vídeo do pedido não salvava no iPhone): o
    // WebKit do iOS (Safari e também o Chrome no iPhone, que usa o mesmo
    // motor por exigência da Apple) tem bugs conhecidos onde informar
    // videoBitsPerSecond/audioBitsPerSecond — mesmo dentro de valores
    // razoáveis — faz o MediaRecorder gravar um arquivo vazio ou
    // corrompido, SEM lançar nenhum erro visível no JavaScript. Como essa
    // otimização de tamanho não é confiável nesse ambiente, no iOS usamos
    // só o mimeType (o vídeo pode ficar um pouco maior, mas grava de
    // verdade — o que importa muito mais aqui).
    if (ehIOS()) return mimeType ? { mimeType } : {};

    const bitrate = modo === 'video' ? OPCOES_GRAVACAO_VIDEO : OPCOES_GRAVACAO_AUDIO;
    return mimeType ? { mimeType, ...bitrate } : { ...bitrate };
}

/* ---------------- Fundo dinâmico do <body> (corrige "áreas brancas") ----------------
   Durante o bounce-scroll do iOS (ou quando o conteúdo é mais curto que a
   tela), o navegador revela a cor de fundo do <body>. Se o body estivesse
   sempre off-white, telas escuras (romance, suspense, flashback) mostrariam
   um "flash" branco feio no topo/rodapé. Alternamos a cor de fundo do body
   junto com a troca de tela. */
function definirFundoBody(cor) {
    document.body.style.backgroundColor = cor;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', cor);
}

const CORES_FUNDO = {
    claro: '#FAF9F6',
    escuro: '#241419'
};

/* ---------------- Formatação de datas/tempo ---------------- */
function formatarDataPedido(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Igual a formatarDataPedido, mas incluindo a hora exata (usada no
 * certificado de namoro — "às 20h47", por exemplo — para registrar o
 * momento exato do pedido, não só o dia).
 */
function formatarDataPedidoComHora(iso) {
    const d = new Date(iso);
    const dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataStr}, às ${horaStr}`;
}

function formatarDataHoraMensagem(iso) {
    const d = new Date(iso);
    const dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataStr} às ${horaStr}`;
}

function formatarTempoPlaylist(segundos) {
    if (!isFinite(segundos) || segundos < 0) segundos = 0;
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${String(seg).padStart(2, '0')}`;
}

function gerarIdUnico(prefixo) {
    return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------------- Conversão DataURL -> Blob (usada ao restaurar backups antigos, ver js/export.js) ---------------- */
function dataURLParaBlob(dataUrl) {
    const partes = dataUrl.split(',');
    const mimeMatch = partes[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : '';
    const binario = atob(partes[1]);
    const array = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) array[i] = binario.charCodeAt(i);
    return new Blob([array], { type: mime });
}

/* ----------------------------------------------------------------------
   COMPRESSÃO DE IMAGENS NO NAVEGADOR (evita estourar o limite de 50MB do
   Supabase e deixa a sincronização entre aparelhos mais rápida)
   ----------------------------------------------------------------------
   Fotos de celular hoje em dia costumam ter vários MB mesmo sendo
   exibidas em uma tela pequena. Antes de salvar, redimensionamos (lado
   maior limitado) e reexportamos como JPEG — sem precisar de nenhuma
   biblioteca externa, só <canvas>, que já existe em qualquer navegador.
   Isso normalmente reduz o arquivo em 60-85% sem perda visível no
   celular. Em qualquer falha, devolve o arquivo original sem alterações
   — comprimir nunca deve impedir a pessoa de salvar a foto.
   ---------------------------------------------------------------------- */
async function comprimirImagem(arquivo, { larguraMaxima = 1600, alturaMaxima = 1600, qualidade = 0.82 } = {}) {
    if (!arquivo || !arquivo.type || !arquivo.type.startsWith('image/')) return { blob: arquivo, mimeType: arquivo ? arquivo.type : '' };
    if (arquivo.type === 'image/gif') return { blob: arquivo, mimeType: arquivo.type }; // GIF animado perderia a animação passando pelo canvas

    try {
        const fonte = await carregarFonteDeImagem(arquivo);
        if (!fonte) return { blob: arquivo, mimeType: arquivo.type };

        const largura = fonte.width, altura = fonte.height;
        const escala = Math.min(1, larguraMaxima / largura, alturaMaxima / altura);
        const larguraFinal = Math.max(1, Math.round(largura * escala));
        const alturaFinal = Math.max(1, Math.round(altura * escala));

        const canvas = document.createElement('canvas');
        canvas.width = larguraFinal;
        canvas.height = alturaFinal;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(fonte, 0, 0, larguraFinal, alturaFinal);
        if (fonte.close) fonte.close(); // libera memória se for um ImageBitmap

        const blobComprimido = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', qualidade));
        if (!blobComprimido) return { blob: arquivo, mimeType: arquivo.type };

        // Só usa o resultado comprimido se ele realmente ficou menor — fotos já
        // pequenas/comprimidas às vezes ficam maiores ao reexportar como JPEG.
        if (blobComprimido.size >= arquivo.size) return { blob: arquivo, mimeType: arquivo.type };

        return { blob: blobComprimido, mimeType: 'image/jpeg' };
    } catch (e) {
        console.error('Falha ao comprimir imagem, salvando o arquivo original:', e);
        return { blob: arquivo, mimeType: arquivo.type };
    }
}

/** Decodifica um File/Blob de imagem em algo que dá pra desenhar num canvas (createImageBitmap, com fallback via <img>). */
async function carregarFonteDeImagem(arquivo) {
    try {
        if (window.createImageBitmap) return await createImageBitmap(arquivo);
    } catch (e) { /* alguns formatos (ex: HEIC sem suporte no navegador) falham aqui — cai no fallback abaixo */ }

    return await new Promise((resolve) => {
        const url = URL.createObjectURL(arquivo);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
    });
}
