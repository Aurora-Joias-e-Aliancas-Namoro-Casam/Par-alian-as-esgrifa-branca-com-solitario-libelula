/**
 * ============================================================================
 * DESKTOP-BLOCK.JS — Bloqueia o uso em computadores (Prioridade 1, item 9)
 * ============================================================================
 * A experiência foi desenhada para celular (fotos em tela cheia, gravação de
 * câmera, vibração, etc.) e não faz sentido — nem funciona bem — em telas
 * grandes de computador. Detectamos o dispositivo e, se não for um celular,
 * mostramos uma tela elegante com QR Code para abrir no celular.
 *
 * Critério de detecção: um celular real tem ponteiro "grosso" (dedo) e não
 * tem "hover" de mouse. Isso é mais confiável do que apenas checar a largura
 * da tela (que falha com janelas de desktop redimensionadas ou emuladores).
 */
function ehDispositivoMovel() {
    const semHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
    const ponteiroGrosso = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const larguraRazoavel = Math.min(window.innerWidth, window.innerHeight) <= 600;
    return semHover && ponteiroGrosso && larguraRazoavel;
}

/**
 * BYPASS PRA TESTES NO COMPUTADOR — digite a sequência abaixo em qualquer
 * lugar da página (não precisa clicar em nada primeiro) para liberar o
 * site no desktop. Fica lembrado neste navegador (localStorage), então só
 * precisa digitar uma vez por computador/navegador. Continua escutando
 * mesmo com a tela de bloqueio visível, porque o listener é registrado no
 * "document", não em algo dentro do body (que é apagado ao bloquear).
 */
const CHAVE_BYPASS_DESKTOP = 'aurora_bypass_desktop_teste';
const SEQUENCIA_BYPASS_DESKTOP = 'abrirauroradesktop'; // digite isso (rápido, tudo minúsculo) pra liberar o desktop

function bypassDesktopAtivo() {
    try { return localStorage.getItem(CHAVE_BYPASS_DESKTOP) === '1'; } catch (e) { return false; }
}

function iniciarEscutaBypassDesktop() {
    if (window.__aurora_escutandoBypassDesktop) return; // evita registrar o listener duas vezes
    window.__aurora_escutandoBypassDesktop = true;

    let buffer = '';
    document.addEventListener('keydown', (evt) => {
        if (evt.key.length !== 1) return; // ignora Shift, Enter, setas etc.
        buffer = (buffer + evt.key.toLowerCase()).slice(-SEQUENCIA_BYPASS_DESKTOP.length);
        if (buffer === SEQUENCIA_BYPASS_DESKTOP) {
            try {
                // Alterna: se já estava liberado, digitar de novo BLOQUEIA de novo (útil pra não deixar destravado num PC compartilhado).
                localStorage.setItem(CHAVE_BYPASS_DESKTOP, bypassDesktopAtivo() ? '0' : '1');
            } catch (e) { /* ignora se o storage estiver bloqueado */ }
            location.reload();
        }
    });
}

function iniciarBloqueioDesktop() {
    iniciarEscutaBypassDesktop(); // escuta sempre — tanto liberado quanto bloqueado
    if (ehDispositivoMovel() || bypassDesktopAtivo()) return; // segue normalmente

    const overlay = document.createElement('div');
    overlay.id = 'desktopBlockOverlay';
    overlay.innerHTML = `
        <div class="desktop-block-card">
            <i class="bi bi-phone text-rosegold desktop-block-icon"></i>
            <p class="desktop-block-eyebrow">Aryah Joias</p>
            <h1 class="desktop-block-title">Esta experiência foi criada para o celular</h1>
            <p class="desktop-block-texto">Para preservar cada detalhe — fotos, sons e um pequeno segredo guardado no caminho — abra este link no seu smartphone.</p>
            <div id="desktopBlockQr" class="desktop-block-qr" aria-label="QR Code para abrir no celular"></div>
            <p class="desktop-block-hint">Aponte a câmera do seu celular para o código acima.</p>
        </div>
    `;
    document.body.innerHTML = '';
    document.body.appendChild(overlay);

    // Gera o QR Code apontando para a própria URL do site, usando a
    // biblioteca leve "qrcode-generator" (carregada via CDN no <head>).
    try {
        const qr = qrcode(0, 'M');
        qr.addData(window.location.href);
        qr.make();
        document.getElementById('desktopBlockQr').innerHTML = qr.createSvgTag({ scalable: true });
    } catch (e) {
        console.error('Não foi possível gerar o QR Code:', e);
        document.getElementById('desktopBlockQr').textContent = window.location.href;
    }

    // Interrompe qualquer outra inicialização do site.
    throw new Error('BLOQUEIO_DESKTOP_ATIVO');
}
