/**
 * ============================================================================
 * STORE.JS — Lógica da "loja" (home falsa da joalheria)
 * ============================================================================
 * Contém: vinheta de abertura, carrossel promocional, miniaturas do
 * produto, cupom falso, seleção de tamanhos/gravações e navegação para o
 * checkout. Tudo aqui é decoração para a ilusão de e-commerce real.
 */

const pedido = { tamMasc: '', tamFem: '', tamSolitario: '', gravMasc: '', gravFem: '' };

/* ---------------- Vinheta de abertura (uma vez por sessão) ---------------- */
function iniciarVinheta() {
    const tela = document.getElementById('vinhetaAbertura');
    if (!tela) return;

    // Se o pedido já aconteceu, o texto já foi trocado por um script embutido
    // no <head>/HTML (roda antes de qualquer script externo, pra "AURORA
    // JOIAS" nunca aparecer nem por um instante — ver index.html). Aqui só
    // deixamos a tela como está, visível; quem esconde é
    // esconderVinhetaCarregamento(), chamada em js/main.js assim que a
    // decisão do que mostrar for tomada (pode levar alguns segundos, por
    // causa da sincronização com a nuvem).
    if (tela.classList.contains('vinheta-modo-retorno')) return;

    const jaExibida = sessionStorage.getItem('aurora_vinheta_exibida');
    if (jaExibida) { tela.style.display = 'none'; return; }
    sessionStorage.setItem('aurora_vinheta_exibida', '1');

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        tela.style.display = 'none';
        return;
    }

    setTimeout(() => {
        tela.classList.add('vinheta-saida');
        setTimeout(() => { tela.style.display = 'none'; }, 750);
    }, 2400);
}

/**
 * Esconde a tela de carregamento pós-pedido ("Para meu amor") assim que o
 * site já sabe o que vai mostrar. Não faz nada se a vinheta não estiver
 * nesse modo (ex.: primeiro acesso, onde ela já se esconde sozinha com um
 * timer fixo) — chamada sempre em js/main.js, incondicionalmente.
 */
function esconderVinhetaCarregamento() {
    const tela = document.getElementById('vinhetaAbertura');
    if (!tela || !tela.classList.contains('vinheta-modo-retorno')) return;
    tela.classList.add('vinheta-saida');
    setTimeout(() => { tela.style.display = 'none'; }, 750);
}

/* ---------------- Cupom falso (detalhe de imersão) ---------------- */
let cupomFalsoTimeoutId = null;

function iniciarCupomFalso() {
    if (localStorage.getItem('aurora_stage') === 'final') return;
    if (localStorage.getItem('aurora_data_pedido')) return;
    cupomFalsoTimeoutId = setTimeout(() => {
        const loja = document.getElementById('lojaScreen');
        if (!loja || loja.style.display === 'none') return;
        document.getElementById('cupomPopup').classList.remove('d-none');
    }, 7000);
}

/**
 * Cancela o popup do cupom assim que o usuário avança para o checkout.
 * CORREÇÃO: antes, o timer de 7s do cupom não sabia que a pessoa já tinha
 * saído da "loja" (o checkout é um overlay fixo por cima, então
 * `lojaScreen` nunca era formalmente escondido) — isso podia fazer o
 * cupom aparecer por cima do checkout e travar o botão "Confirmar
 * Pagamento" até ser fechado manualmente.
 */
function cancelarCupomFalsoPendente() {
    if (cupomFalsoTimeoutId) { clearTimeout(cupomFalsoTimeoutId); cupomFalsoTimeoutId = null; }
}

function fecharCupomFalso() {
    document.getElementById('cupomPopup').classList.add('d-none');
}

/* ---------------- Carrossel promocional ---------------- */
let promoSlideAtual = 0;
let promoIntervalo = null;

function irParaSlide(indice) {
    const slides = document.querySelectorAll('.promo-slide');
    const dots = document.querySelectorAll('#promoIndicators button');
    if (!slides.length) return;
    promoSlideAtual = ((indice % slides.length) + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('d-none', i !== promoSlideAtual));
    dots.forEach((d, i) => d.classList.toggle('active', i === promoSlideAtual));
}

function iniciarCarrosselPromocional() {
    document.querySelectorAll('#promoIndicators button').forEach(dot => {
        dot.addEventListener('click', () => { irParaSlide(parseInt(dot.dataset.go, 10)); reiniciarAutoRotacaoPromo(); });
    });
    reiniciarAutoRotacaoPromo();
}

function reiniciarAutoRotacaoPromo() {
    if (promoIntervalo) clearInterval(promoIntervalo);
    promoIntervalo = setInterval(() => irParaSlide(promoSlideAtual + 1), 4500);
}

/* ---------------- Miniaturas do produto ---------------- */
function iniciarThumbsProduto() {
    const thumbs = document.querySelectorAll('.thumb-item');
    const principal = document.getElementById('imagemPrincipalProduto');
    if (!thumbs.length || !principal) return;
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            thumbs.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            principal.src = thumb.dataset.img;
        });
    });
}

/* ---------------- Carrega os placeholders de imagem da loja ---------------- */
function carregarImagensLoja() {
    aplicarImagemPlaceholder(document.getElementById('imagemPrincipalProduto'), 'imagem_produto_principal', 'Foto principal do produto');
    document.querySelectorAll('.thumb-item img').forEach((img, i) => {
        const ids = ['imagem_produto_principal', 'imagem_produto_detalhe', 'imagem_produto_estojo', 'imagem_produto_par'];
        aplicarImagemPlaceholder(img, ids[i] || ids[0], 'Miniatura do produto');
        img.closest('.thumb-item').dataset.img = getAsset(ids[i] || ids[0]);
    });

    const destaques = [
        ['destaqueFlorRosa', 'imagem_colecao_flor_rosa'],
        ['destaqueLibelula', 'imagem_colecao_libelula'],
        ['destaquePrata', 'imagem_colecao_prata'],
        ['destaqueEstojos', 'imagem_colecao_estojos']
    ];
    destaques.forEach(([elId, placeholderId]) => aplicarImagemPlaceholder(document.getElementById(elId), placeholderId, 'Destaque da coleção'));

    const relacionados = [
        ['relacionadoColar', 'imagem_relacionado_colar'],
        ['relacionadoBrinco', 'imagem_relacionado_brinco'],
        ['relacionadoPulseira', 'imagem_relacionado_pulseira'],
        ['relacionadoEstojo', 'imagem_relacionado_estojo']
    ];
    relacionados.forEach(([elId, placeholderId]) => aplicarImagemPlaceholder(document.getElementById(elId), placeholderId, 'Produto relacionado'));
}

/* ---------------- Resumo dinâmico do checkout ---------------- */
function atualizarResumoCheckout() {
    document.getElementById('resumoTamanhos').textContent =
        `Aro masculino: ${pedido.tamMasc} · Aro feminino: ${pedido.tamFem} · Solitário: ${pedido.tamSolitario}`;
    const gravacoes = [];
    if (pedido.gravMasc) gravacoes.push(`Masculina: "${pedido.gravMasc}"`);
    if (pedido.gravFem) gravacoes.push(`Feminina: "${pedido.gravFem}"`);
    document.getElementById('resumoGravacoes').textContent = gravacoes.length ? `Gravações — ${gravacoes.join(' · ')}` : '';
}

/* ---------------- Tela de processamento do "Comprar Agora" ---------------- */
function iniciarProcessamentoCompra(onFinish) {
    const overlay = document.getElementById('processingOverlay');
    const itens = document.querySelectorAll('#processingSteps li');
    overlay.style.display = 'flex';
    itens.forEach(li => { li.classList.remove('active', 'done'); li.querySelector('i').className = 'bi bi-circle'; });

    let passo = 0;
    function proximoPasso() {
        if (passo > 0) {
            itens[passo - 1].classList.remove('active');
            itens[passo - 1].classList.add('done');
            itens[passo - 1].querySelector('i').className = 'bi bi-check-circle-fill text-success';
        }
        if (passo >= itens.length) {
            setTimeout(() => { overlay.style.display = 'none'; onFinish(); }, 500);
            return;
        }
        itens[passo].classList.add('active');
        passo++;
        setTimeout(proximoPasso, 700 + Math.random() * 400);
    }
    proximoPasso();
}

/* ---------------- Preenche os valores padrão de tamanho/gravação ---------------- */
function preencherValoresPadraoPedido() {
    if (typeof PEDIDO_PADRAO === 'undefined') return;
    const campos = [
        ['tamanhoMasc', PEDIDO_PADRAO.aroMasc],
        ['tamanhoFem', PEDIDO_PADRAO.aroFem],
        ['tamanhoSolitario', PEDIDO_PADRAO.aroSolitario],
        ['gravacaoMasc', PEDIDO_PADRAO.gravacaoMasc],
        ['gravacaoFem', PEDIDO_PADRAO.gravacaoFem]
    ];
    campos.forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el && valor && !el.value) el.value = valor;
    });
}

/* ---------------- Inicialização da tela de loja ---------------- */
function iniciarLoja() {
    carregarImagensLoja();
    iniciarCarrosselPromocional();
    iniciarThumbsProduto();
    iniciarVinheta();
    iniciarCupomFalso();
    preencherValoresPadraoPedido();

    document.getElementById('btnFecharCupom').addEventListener('click', fecharCupomFalso);
    document.getElementById('btnFecharCupomBtn').addEventListener('click', fecharCupomFalso);

    document.getElementById('btnFecharManutencao').addEventListener('click', () => {
        document.getElementById('maintenancePopup').style.display = 'none';
    });

    document.getElementById('freteBtn').addEventListener('click', () => {
        document.getElementById('freteResult').classList.remove('d-none');
    });

    document.getElementById('btnIrParaCheckout').addEventListener('click', () => {
        pedido.tamMasc = document.getElementById('tamanhoMasc').value;
        pedido.tamFem = document.getElementById('tamanhoFem').value;
        pedido.tamSolitario = document.getElementById('tamanhoSolitario').value;
        pedido.gravMasc = document.getElementById('gravacaoMasc').value.trim();
        pedido.gravFem = document.getElementById('gravacaoFem').value.trim();
        const erroBox = document.getElementById('selecaoErro');

        if (!pedido.tamMasc || !pedido.tamFem || !pedido.tamSolitario || !pedido.gravMasc || !pedido.gravFem) {
            erroBox.classList.remove('d-none');
            erroBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        erroBox.classList.add('d-none');

        iniciarProcessamentoCompra(() => {
            atualizarResumoCheckout();
            cancelarCupomFalsoPendente();
            document.getElementById('cupomPopup').classList.add('d-none');
            document.getElementById('lojaScreen').style.display = 'none';
            document.getElementById('checkoutScreen').style.display = 'block';
            window.scrollTo(0, 0);
        });
    });
}
