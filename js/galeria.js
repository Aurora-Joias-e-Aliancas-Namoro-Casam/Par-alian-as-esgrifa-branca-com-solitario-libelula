/**
 * ============================================================================
 * GALERIA.JS — Álbum permanente de lembranças (item 4 do prompt de melhorias)
 * ============================================================================
 * Lê o padrão documentado em js/config.js (TOTAL_FOTOS_GALERIA, TIPO_GALERIA,
 * YOUTUBE_GALERIA, getAssetGaleria e GALERIA_LEGENDAS) e monta o masonry.
 * Cada item pode ser: foto (padrão), vídeo local (arquivo em
 * assets/img/galeria/) ou vídeo do YouTube (roda embutido, sem precisar de
 * arquivo — ótimo pra vídeos grandes). Vídeos (locais ou YouTube) aparecem
 * com um ícone de play por cima da capa. Itens que ainda não existirem no
 * disco (onerror) simplesmente não aparecem — assim a página nunca quebra
 * enquanto o álbum estiver sendo preenchido aos poucos.
 * ============================================================================
 */

let __galeriaFotosCarregadas = 0;

function montarGaleria() {
    const masonry = document.getElementById('galeriaMasonry');
    const vazio = document.getElementById('galeriaVazio');
    if (!masonry) return;

    const total = (typeof TOTAL_FOTOS_GALERIA === 'number' && TOTAL_FOTOS_GALERIA > 0) ? TOTAL_FOTOS_GALERIA : 0;

    if (total === 0) {
        vazio.classList.remove('d-none');
        return;
    }

    for (let numero = 1; numero <= total; numero++) {
        const legenda = (typeof GALERIA_LEGENDAS === 'object' && GALERIA_LEGENDAS[numero]) ? GALERIA_LEGENDAS[numero] : '';
        const ehVideo = ehVideoGaleria(numero);
        const ehYoutube = ehYoutubeGaleria(numero);
        const tipo = ehYoutube ? 'youtube' : (ehVideo ? 'video' : 'foto');

        const item = document.createElement('figure');
        item.className = (tipo !== 'foto') ? 'galeria-item galeria-item-video m-0' : 'galeria-item m-0';

        let src; // para foto/video: caminho do arquivo. Para youtube: o ID do vídeo.

        if (tipo === 'youtube') {
            const idYoutube = extrairIdYoutube((typeof YOUTUBE_GALERIA === 'object' && YOUTUBE_GALERIA[numero]) || '');
            if (!idYoutube) continue; // número marcado como youtube mas sem link cadastrado ainda — pula, não quebra a página
            src = idYoutube;

            const capa = document.createElement('img');
            capa.loading = 'lazy';
            capa.alt = legenda || `Vídeo do YouTube ${numero}`;
            // hqdefault sempre existe pra qualquer vídeo público/não-listado do YouTube, sem precisar de chave de API.
            capa.src = `https://img.youtube.com/vi/${idYoutube}/hqdefault.jpg`;
            capa.onload = () => { __galeriaFotosCarregadas++; observarRevelacao(item); };
            capa.onerror = () => { item.remove(); verificarSeGaleriaFicouVazia(); };

            const iconePlay = document.createElement('div');
            iconePlay.className = 'galeria-video-play galeria-video-play-youtube';
            iconePlay.innerHTML = '<i class="bi bi-youtube"></i>';

            item.appendChild(capa);
            item.appendChild(iconePlay);
        } else if (tipo === 'video') {
            src = getAssetGaleria(numero);

            const video = document.createElement('video');
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'metadata';
            video.src = `${src}#t=0.5`; // pede o frame de 0.5s como "capa" (evita quadro preto do início em alguns vídeos)

            video.onerror = () => { item.remove(); verificarSeGaleriaFicouVazia(); };
            video.onloadedmetadata = () => { __galeriaFotosCarregadas++; observarRevelacao(item); };

            const iconePlay = document.createElement('div');
            iconePlay.className = 'galeria-video-play';
            iconePlay.innerHTML = '<i class="bi bi-play-fill"></i>';

            item.appendChild(video);
            item.appendChild(iconePlay);
        } else {
            src = getAssetGaleria(numero);

            const img = document.createElement('img');
            img.loading = 'lazy';
            img.alt = legenda || `Lembrança ${numero}`;
            img.src = src;

            img.onerror = () => { item.remove(); verificarSeGaleriaFicouVazia(); };
            img.onload = () => { __galeriaFotosCarregadas++; observarRevelacao(item); };

            item.appendChild(img);
        }

        if (legenda) {
            const cap = document.createElement('figcaption');
            cap.className = 'galeria-legenda';
            cap.textContent = legenda;
            item.appendChild(cap);
        }

        item.addEventListener('click', () => abrirLightbox(src, legenda, tipo));
        masonry.appendChild(item);
    }

    // Se, depois de tentar carregar tudo, nada existir de fato, mostra o estado vazio.
    setTimeout(verificarSeGaleriaFicouVazia, 1500);
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

function abrirLightbox(src, legenda, tipo) {
    const overlay = document.getElementById('galeriaLightbox');
    const img = document.getElementById('galeriaLightboxImg');
    const video = document.getElementById('galeriaLightboxVideo');
    const youtubeWrap = document.getElementById('galeriaLightboxYoutubeWrap');
    const youtube = document.getElementById('galeriaLightboxYoutube');
    const cap = document.getElementById('galeriaLightboxLegenda');

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
    } else if (tipo === 'video') {
        video.classList.remove('d-none');
        video.src = src;
        video.currentTime = 0;
        video.play().catch(() => { /* autoplay bloqueado é normal — a pessoa só toca em play */ });
    } else {
        img.classList.remove('d-none');
        img.src = src;
    }

    cap.textContent = legenda || '';
    overlay.classList.add('aberto');
}

function fecharLightbox() {
    document.getElementById('galeriaLightbox').classList.remove('aberto');
    const video = document.getElementById('galeriaLightboxVideo');
    if (video) { video.pause(); }
    const youtube = document.getElementById('galeriaLightboxYoutube');
    if (youtube) { youtube.src = ''; } // para a reprodução do YouTube ao fechar
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
    document.addEventListener('keydown', (evt) => { if (evt.key === 'Escape') fecharLightbox(); });
});
