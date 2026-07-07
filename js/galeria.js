/**
 * ============================================================================
 * GALERIA.JS — Álbum permanente de lembranças (item 4 do prompt de melhorias)
 * ============================================================================
 * Lê o padrão documentado em js/config.js (TOTAL_FOTOS_GALERIA, getAssetGaleria
 * e GALERIA_LEGENDAS) e monta o masonry. Fotos que ainda não existirem no
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
        const src = getAssetGaleria(numero);

        const item = document.createElement('figure');
        item.className = 'galeria-item m-0';

        const img = document.createElement('img');
        img.loading = 'lazy';
        img.alt = legenda || `Lembrança ${numero}`;
        img.src = src;

        img.onerror = () => { item.remove(); verificarSeGaleriaFicouVazia(); };
        img.onload = () => {
            __galeriaFotosCarregadas++;
            observarRevelacao(item);
        };

        item.appendChild(img);
        if (legenda) {
            const cap = document.createElement('figcaption');
            cap.className = 'galeria-legenda';
            cap.textContent = legenda;
            item.appendChild(cap);
        }

        item.addEventListener('click', () => abrirLightbox(src, legenda));
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

function abrirLightbox(src, legenda) {
    const overlay = document.getElementById('galeriaLightbox');
    const img = document.getElementById('galeriaLightboxImg');
    const cap = document.getElementById('galeriaLightboxLegenda');
    img.src = src;
    cap.textContent = legenda || '';
    overlay.classList.add('aberto');
}

function fecharLightbox() {
    document.getElementById('galeriaLightbox').classList.remove('aberto');
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
