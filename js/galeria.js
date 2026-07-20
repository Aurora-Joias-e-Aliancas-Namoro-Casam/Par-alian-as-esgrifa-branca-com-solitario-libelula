/**
 * ============================================================================
 * GALERIA.JS — Álbum permanente de lembranças
 * ============================================================================
 * 100% estático: os itens são arquivos colocados manualmente em
 * assets/img/galeria/ (galeria_1.jpg, galeria_2.mp4, ...) ou links do
 * YouTube (GALERIA_YOUTUBE em js/config.js). Não usa banco de dados nem
 * sincronização — só HTML/CSS/JS lendo arquivos do próprio repositório.
 *
 * DESCOBERTA AUTOMÁTICA: em vez de exigir configurar quantos itens
 * existem e qual o tipo de cada um, o site tenta cada número em
 * sequência (galeria_1, galeria_2, ...) contra cada extensão aceita
 * (fotos e vídeos, ver GALERIA_EXTENSOES_FOTO/VIDEO em js/config.js) e
 * usa a primeira que encontrar — o tipo (foto ou vídeo) é decidido pela
 * própria extensão do arquivo que existir. Para de procurar depois de
 * alguns números seguidos sem encontrar nada, então não precisa
 * "reservar" números nem editar nenhuma configuração ao adicionar itens.
 * ============================================================================
 */

let __galeriaFotosCarregadas = 0;
const GALERIA_MAX_NUMERO = 500;       // teto de segurança, nunca deve ser alcançado na prática
const GALERIA_LACUNA_PARA_PARAR = 6;  // depois de 6 números seguidos sem nada, para de procurar

// Lista ordenada de tudo que entrou na galeria (fotos, vídeos locais e do
// YouTube), na mesma ordem em que aparecem na grade — usada para navegar
// entre itens (anterior/próxima) dentro do lightbox.
let __galeriaItens = [];

/** Confere (via HEAD, sem baixar o arquivo inteiro) se um caminho existe no servidor. */
async function galeriaArquivoExiste(caminho) {
    try {
        const resposta = await fetch(caminho, { method: 'HEAD', cache: 'no-store' });
        return resposta.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Tenta descobrir o item "galeria_N" testando cada extensão de foto e
 * vídeo aceita, em paralelo. Devolve { caminho, tipo } da primeira que
 * existir, ou `null` se nenhuma existir.
 */
async function galeriaDescobrirItem(numero) {
    // Testa cada extensão tanto em minúsculo quanto em MAIÚSCULO — celular
    // (principalmente iPhone) às vezes salva/exporta com extensão em
    // maiúsculo (ex.: IMG.MOV), e servidores estáticos (GitHub Pages, etc.)
    // costumam ser case-sensitive, então "galeria_2.mov" não bate com
    // "galeria_2.MOV" se testarmos só uma forma.
    const candidatos = [
        ...GALERIA_EXTENSOES_FOTO.flatMap(ext => ([
            { ext, tipo: 'foto' },
            { ext: ext.toUpperCase(), tipo: 'foto' }
        ])),
        ...GALERIA_EXTENSOES_VIDEO.flatMap(ext => ([
            { ext, tipo: 'video' },
            { ext: ext.toUpperCase(), tipo: 'video' }
        ]))
    ];

    const resultados = await Promise.all(candidatos.map(async (c) => {
        const caminho = `${PASTA_GALERIA}/galeria_${numero}.${c.ext}`;
        const existe = await galeriaArquivoExiste(caminho);
        return existe ? { caminho, tipo: c.tipo } : null;
    }));

    return resultados.find(r => r !== null) || null;
}

async function montarGaleria() {
    const masonry = document.getElementById('galeriaMasonry');
    if (!masonry) return;

    const TAMANHO_LOTE = 8; // testa vários números em paralelo por vez — bem mais rápido que um por um conforme a galeria cresce
    let proximoNumero = 1;
    let lacunaAtual = 0;

    while (proximoNumero <= GALERIA_MAX_NUMERO && lacunaAtual < GALERIA_LACUNA_PARA_PARAR) {
        const numerosDoLote = [];
        for (let i = 0; i < TAMANHO_LOTE; i++) numerosDoLote.push(proximoNumero + i);

        const resultados = await Promise.all(numerosDoLote.map(n => galeriaDescobrirItem(n)));

        for (let i = 0; i < resultados.length; i++) {
            if (resultados[i]) {
                lacunaAtual = 0;
                adicionarItemNaGrade(numerosDoLote[i], resultados[i].caminho, resultados[i].tipo, masonry);
            } else {
                lacunaAtual++;
                if (lacunaAtual >= GALERIA_LACUNA_PARA_PARAR) break; // já sabe que vai parar — não precisa olhar o resto do lote
            }
        }

        proximoNumero += TAMANHO_LOTE;
    }

    montarItensYoutube(masonry);

    setTimeout(verificarSeGaleriaFicouVazia, 1200);
}

function adicionarItemNaGrade(numero, src, tipo, masonry) {
    const legenda = (typeof GALERIA_LEGENDAS === 'object' && GALERIA_LEGENDAS[numero]) ? GALERIA_LEGENDAS[numero] : '';

    const item = document.createElement('figure');
    item.className = (tipo === 'video') ? 'galeria-item galeria-item-video m-0' : 'galeria-item m-0';

    if (tipo === 'video') {
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.src = `${src}#t=0.5`; // pede o frame de 0.5s como "capa" (evita quadro preto do início em alguns vídeos)

        // Proteção: alguns vídeos gravados direto do celular (metadata no
        // fim do arquivo, codecs variados) não disparam onloadedmetadata de
        // forma confiável em todo navegador — sem essa proteção, o item
        // ficava preso invisível (opacity: 0) pra sempre, dando a
        // impressão de que "o vídeo não carregou". revelarUmaVez() garante
        // que o item aparece de qualquer forma depois de um tempo, mesmo
        // sem o evento, e cancela o timeout se o evento realmente disparar.
        let jaRevelado = false;
        const revelarUmaVez = () => {
            if (jaRevelado) return;
            jaRevelado = true;
            clearTimeout(timeoutRevelacao);
            __galeriaFotosCarregadas++;
            observarRevelacao(item);
        };
        const timeoutRevelacao = setTimeout(revelarUmaVez, 2500);

        video.onloadedmetadata = revelarUmaVez;
        video.onloadeddata = revelarUmaVez; // fallback extra — dispara em mais casos que onloadedmetadata
        video.onerror = () => { clearTimeout(timeoutRevelacao); item.remove(); verificarSeGaleriaFicouVazia(); };

        const iconePlay = document.createElement('div');
        iconePlay.className = 'galeria-video-play';
        iconePlay.innerHTML = '<i class="bi bi-play-fill"></i>';

        item.appendChild(video);
        item.appendChild(iconePlay);
    } else {
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.alt = legenda || `Lembrança ${numero}`;
        img.src = src;
        img.onload = () => { __galeriaFotosCarregadas++; observarRevelacao(item); };
        img.onerror = () => { item.remove(); verificarSeGaleriaFicouVazia(); };

        item.appendChild(img);
    }

    if (legenda) {
        const cap = document.createElement('figcaption');
        cap.className = 'galeria-legenda';
        cap.textContent = legenda;
        item.appendChild(cap);
    }

    const indice = __galeriaItens.length;
    __galeriaItens.push({ src, legenda, tipo });
    item.addEventListener('click', () => abrirLightbox(indice));
    masonry.appendChild(item);
}

function montarItensYoutube(masonry) {
    if (!Array.isArray(GALERIA_YOUTUBE)) return;

    GALERIA_YOUTUBE.forEach((entrada) => {
        const idYoutube = extrairIdYoutube((entrada && entrada.link) || '');
        if (!idYoutube) return;
        const legenda = (entrada && entrada.legenda) || '';

        const item = document.createElement('figure');
        item.className = 'galeria-item galeria-item-video m-0';

        const capa = document.createElement('img');
        capa.loading = 'lazy';
        capa.alt = legenda || 'Vídeo do YouTube';
        // hqdefault sempre existe pra qualquer vídeo público/não-listado do YouTube, sem precisar de chave de API.
        capa.src = `https://img.youtube.com/vi/${idYoutube}/hqdefault.jpg`;
        capa.onload = () => { __galeriaFotosCarregadas++; observarRevelacao(item); };
        capa.onerror = () => { item.remove(); verificarSeGaleriaFicouVazia(); };

        const iconePlay = document.createElement('div');
        iconePlay.className = 'galeria-video-play galeria-video-play-youtube';
        iconePlay.innerHTML = '<i class="bi bi-youtube"></i>';

        item.appendChild(capa);
        item.appendChild(iconePlay);

        if (legenda) {
            const cap = document.createElement('figcaption');
            cap.className = 'galeria-legenda';
            cap.textContent = legenda;
            item.appendChild(cap);
        }

        const indice = __galeriaItens.length;
        __galeriaItens.push({ src: idYoutube, legenda, tipo: 'youtube' });
        item.addEventListener('click', () => abrirLightbox(indice));
        masonry.appendChild(item);
    });
}

function verificarSeGaleriaFicouVazia() {
    const masonry = document.getElementById('galeriaMasonry');
    const vazio = document.getElementById('galeriaVazio');
    if (masonry && masonry.children.length === 0) vazio.classList.remove('d-none');
}

let __galeriaObserver = null;
function observarRevelacao(item) {
    if (!('IntersectionObserver' in window)) { item.classList.add('visivel'); return; }
    if (!__galeriaObserver) {
        __galeriaObserver = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('visivel');
                    __galeriaObserver.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.15 });
    }
    __galeriaObserver.observe(item);
}

let __galeriaIndiceAtual = 0;

function abrirLightbox(indice) {
    const item = __galeriaItens[indice];
    if (!item) return;
    __galeriaIndiceAtual = indice;

    const { src, legenda, tipo } = item;

    const overlay = document.getElementById('galeriaLightbox');
    const img = document.getElementById('galeriaLightboxImg');
    const video = document.getElementById('galeriaLightboxVideo');
    const youtubeWrap = document.getElementById('galeriaLightboxYoutubeWrap');
    const youtube = document.getElementById('galeriaLightboxYoutube');
    const cap = document.getElementById('galeriaLightboxLegenda');
    const download = document.getElementById('galeriaLightboxDownload');

    img.classList.add('d-none');
    video.classList.add('d-none');
    youtubeWrap.classList.add('d-none');
    video.pause();
    video.removeAttribute('src');
    video.load();
    youtube.src = '';
    img.src = '';

    if (tipo === 'youtube') {
        youtubeWrap.classList.remove('d-none');
        youtube.src = `https://www.youtube.com/embed/${src}?autoplay=1&rel=0&modestbranding=1`;
        download.classList.add('d-none'); // vídeo do YouTube não dá pra baixar por um link direto
    } else if (tipo === 'video') {
        video.classList.remove('d-none');
        video.src = src;
        video.currentTime = 0;
        video.play().catch(() => { /* autoplay bloqueado é normal — a pessoa só toca em play */ });
        download.classList.remove('d-none');
        download.href = src;
        download.download = src.split('/').pop();
    } else {
        img.classList.remove('d-none');
        img.src = src;
        download.classList.remove('d-none');
        download.href = src;
        download.download = src.split('/').pop();
    }

    cap.textContent = legenda || '';
    atualizarBotoesNavegacaoLightbox();
    bloquearScrollFundo();
    overlay.classList.add('aberto');
}

function atualizarBotoesNavegacaoLightbox() {
    const prev = document.getElementById('galeriaLightboxPrev');
    const next = document.getElementById('galeriaLightboxNext');
    const mostrarNav = __galeriaItens.length > 1;
    if (prev) prev.classList.toggle('d-none', !mostrarNav);
    if (next) next.classList.toggle('d-none', !mostrarNav);
}

function lightboxItemAnterior() {
    if (__galeriaItens.length < 2) return;
    const novoIndice = (__galeriaIndiceAtual - 1 + __galeriaItens.length) % __galeriaItens.length;
    abrirLightbox(novoIndice);
}

function lightboxProximoItem() {
    if (__galeriaItens.length < 2) return;
    const novoIndice = (__galeriaIndiceAtual + 1) % __galeriaItens.length;
    abrirLightbox(novoIndice);
}

// Impede que o conteúdo por trás role enquanto o lightbox está aberto —
// trava tanto o scroll normal quanto o "bounce" do Safari/iOS, guardando a
// posição atual para restaurar exatamente onde a pessoa estava ao fechar.
let __galeriaScrollSalvo = 0;
function bloquearScrollFundo() {
    __galeriaScrollSalvo = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('galeria-scroll-lock');
    document.body.style.top = `-${__galeriaScrollSalvo}px`;
}

function desbloquearScrollFundo() {
    document.documentElement.classList.remove('galeria-scroll-lock');
    document.body.style.top = '';
    window.scrollTo(0, __galeriaScrollSalvo);
}

function fecharLightbox() {
    document.getElementById('galeriaLightbox').classList.remove('aberto');
    const video = document.getElementById('galeriaLightboxVideo');
    if (video) { video.pause(); }
    const youtube = document.getElementById('galeriaLightboxYoutube');
    if (youtube) { youtube.src = ''; } // para a reprodução do YouTube ao fechar
    desbloquearScrollFundo();
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        iniciarBloqueioDesktop();
    } catch (e) {
        return; // BLOQUEIO_DESKTOP_ATIVO: tela de bloqueio já exibida, para tudo o mais
    }

    montarGaleria();

    document.getElementById('galeriaLightboxClose').addEventListener('click', fecharLightbox);
    document.getElementById('galeriaLightbox').addEventListener('click', (evt) => {
        if (evt.target.id === 'galeriaLightbox') fecharLightbox();
    });
    document.getElementById('galeriaLightboxPrev').addEventListener('click', (evt) => { evt.stopPropagation(); lightboxItemAnterior(); });
    document.getElementById('galeriaLightboxNext').addEventListener('click', (evt) => { evt.stopPropagation(); lightboxProximoItem(); });

    document.addEventListener('keydown', (evt) => {
        const overlay = document.getElementById('galeriaLightbox');
        if (!overlay.classList.contains('aberto')) return;
        if (evt.key === 'Escape') fecharLightbox();
        if (evt.key === 'ArrowLeft') lightboxItemAnterior();
        if (evt.key === 'ArrowRight') lightboxProximoItem();
    });

    // Navegação por swipe (arrastar o dedo) — o gesto mais natural no celular.
    let __swipeXInicial = null;
    const overlay = document.getElementById('galeriaLightbox');
    overlay.addEventListener('touchstart', (evt) => {
        __swipeXInicial = evt.touches[0].clientX;
    }, { passive: true });
    overlay.addEventListener('touchend', (evt) => {
        if (__swipeXInicial === null) return;
        const deltaX = evt.changedTouches[0].clientX - __swipeXInicial;
        __swipeXInicial = null;
        const LIMIAR_SWIPE = 50; // px mínimos para contar como swipe (evita confundir com toque/scroll)
        if (Math.abs(deltaX) < LIMIAR_SWIPE) return;
        if (deltaX > 0) lightboxItemAnterior(); else lightboxProximoItem();
    }, { passive: true });
});
