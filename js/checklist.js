/**
 * CHECKLIST.JS — "Nosso Checklist" (checklist.html)
 * Lista de programas/experiências do casal (CHECKLIST_ENCONTROS, em
 * js/config.js). Progresso salvo via obterConfiguracao/salvarConfiguracao
 * ('aurora_checklist_encontros'), sincronizado entre aparelhos.
 * Estado salvo: objeto só com os itens marcados, chave "<catIdx>_<itemIdx>".
 */

const CHECKLIST_CHAVE_CONFIG = 'aurora_checklist_encontros';

// Itens adicionados pelo casal direto na tela (fora de CHECKLIST_ENCONTROS):
// { id, catIdx, texto, criadoEm }, com "id" único e "catIdx" apontando pra
// uma categoria já existente. Usa o mesmo objeto de estado dos itens
// originais, com "id" como chave.
const CHECKLIST_ITENS_CUSTOM_CHAVE_CONFIG = 'aurora_checklist_itens_customizados';
const CHECKLIST_ALTERACOES_CHAVE_CONFIG = 'aurora_checklist_alteracoes_em';

// Estado em memória (carregado uma vez em montarChecklist), só mutado e
// persistido localmente a cada mudança, sem reler o banco — evita perder
// marcações ao tocar vários checkboxes em sequência rápida.
let __checklistEstadoAtual = null;

// Itens customizados em memória, mesmo princípio do estado acima.
let __checklistItensCustomizados = null;
let __checklistAlteracoesEm = null;
let __checklistFilaSalvar = Promise.resolve();

// Último percentual visto pela barra de progresso geral, pra detectar o
// INSTANTE em que ela cruza 25/50/75/100% (ver checklistAtualizarProgresso)
// e disparar celebrarMomento() só nessa hora, não a cada item marcado.
// Começa null: a primeira chamada (ao montar a página) só define a
// baseline, sem celebrar nada — senão abriria a tela de "checklist
// completo" toda vez que alguém já com 100% desse F5 na página.
let __checklistPercentualAnterior = null;

function checklistTotalItens() {
    const totalOriginal = CHECKLIST_ENCONTROS.reduce((soma, cat) => soma + cat.itens.length, 0);
    return totalOriginal + (__checklistItensCustomizados ? __checklistItensCustomizados.filter(item => !item.excluidoEm).length : 0);
}

function checklistItensCustomizadosDaCategoria(catIdx) {
    if (!__checklistItensCustomizados) return [];
    return __checklistItensCustomizados.filter(item => !item.excluidoEm && Number(item.catIdx) === Number(catIdx));
}

async function checklistCarregarEstadoDoBanco() {
    try {
        const bruto = await obterConfiguracao(CHECKLIST_CHAVE_CONFIG);
        const estado = bruto ? JSON.parse(bruto) : {};
        return (estado && typeof estado === 'object' && !Array.isArray(estado)) ? estado : {};
    } catch (e) {
        console.error('Falha ao ler o checklist salvo:', e);
        return {};
    }
}

async function checklistCarregarItensCustomizadosDoBanco() {
    try {
        const bruto = await obterConfiguracao(CHECKLIST_ITENS_CUSTOM_CHAVE_CONFIG);
        const lista = bruto ? JSON.parse(bruto) : [];
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        console.error('Falha ao ler os itens adicionados no checklist:', e);
        return [];
    }
}

/** Atualiza o cartão de progresso geral + o contador de cada categoria, sem redesenhar a lista inteira. */
function checklistAtualizarProgresso(estado) {
    const total = checklistTotalItens();
    const idsValidos = new Set();
    CHECKLIST_ENCONTROS.forEach((cat, catIdx) => cat.itens.forEach((_, itemIdx) => idsValidos.add(`${catIdx}_${itemIdx}`)));
    (__checklistItensCustomizados || []).filter(item => !item.excluidoEm).forEach(item => idsValidos.add(item.id));
    const feitos = Object.keys(estado).filter(id => estado[id] && idsValidos.has(id)).length;
    const faltam = total - feitos;
    const percentual = total > 0 ? Math.round((feitos / total) * 100) : 0;

    const textoEl = document.getElementById('checklistProgressoTexto');
    const percentualEl = document.getElementById('checklistProgressoPercentual');
    const faltamEl = document.getElementById('checklistProgressoFaltam');
    const barraEl = document.getElementById('checklistProgressoBarra');

    if (textoEl) textoEl.textContent = `${feitos} de ${total} feitos`;
    if (percentualEl) percentualEl.textContent = `${percentual}%`;
    if (barraEl) barraEl.style.width = `${percentual}%`;
    if (faltamEl) {
        faltamEl.textContent = faltam === 0
            ? 'Checklist completo. Já vivemos tudo isso juntos! 🎉'
            : `Faltam ${faltam} pra completar a lista inteira.`;
    }

    document.querySelectorAll('[data-checklist-cat-contador]').forEach(el => {
        const catIdx = el.getAttribute('data-checklist-cat-contador');
        const cat = CHECKLIST_ENCONTROS[catIdx];
        if (!cat) return;
        const customizadosDaCategoria = checklistItensCustomizadosDaCategoria(catIdx);
        const totalCategoria = cat.itens.length + customizadosDaCategoria.length;
        const feitosOriginais = cat.itens.filter((_, itemIdx) => estado[`${catIdx}_${itemIdx}`]).length;
        const feitosCustom = customizadosDaCategoria.filter(item => estado[item.id]).length;
        el.textContent = `${feitosOriginais + feitosCustom} de ${totalCategoria}`;
    });

    // Dispara a "comemoração" (som + vibração já existentes, ver
    // celebrarMomento em js/utils.js) só no INSTANTE em que a barra cruza
    // 25/50/75/100%, não a cada item marcado. Na primeiríssima chamada
    // (ao montar a página) __checklistPercentualAnterior ainda é null:
    // só define a baseline aqui, sem comemorar nada — senão a tela de
    // "checklist completo" abriria de novo toda vez que alguém com 100%
    // desse F5 na página.
    if (__checklistPercentualAnterior !== null) {
        [25, 50, 75, 100].forEach(marco => {
            if (percentual >= marco && __checklistPercentualAnterior < marco) {
                celebrarMomento(marco === 100 ? 1.4 : 1);
                if (marco === 100) mostrarCelebracaoChecklistCompleto();
            }
        });
    }
    __checklistPercentualAnterior = percentual;
}

// Marca/desmarca um item (original ou customizado) pelo id final.
window.addEventListener('poloni:nuvem-atualizada', async () => {
    try {
        await __checklistFilaSalvar;
        __checklistEstadoAtual = await checklistCarregarEstadoDoBanco();
        __checklistAlteracoesEm = await checklistCarregarAlteracoesDoBanco();
        __checklistItensCustomizados = await checklistCarregarItensCustomizadosDoBanco();
        checklistRenderizarLista();
    } catch (erro) { console.error('Falha ao atualizar o checklist:', erro); }
});

async function checklistAlternarItem(id, marcado) {
    if (!__checklistEstadoAtual) __checklistEstadoAtual = await checklistCarregarEstadoDoBanco();
    if (!__checklistAlteracoesEm) __checklistAlteracoesEm = await checklistCarregarAlteracoesDoBanco();
    __checklistEstadoAtual[id] = Boolean(marcado);
    __checklistAlteracoesEm[id] = Date.now();
    checklistAtualizarProgresso(__checklistEstadoAtual); // atualiza a tela na hora, sem esperar o banco
    const estadoSnapshot = JSON.stringify(__checklistEstadoAtual);
    const versoesSnapshot = JSON.stringify(__checklistAlteracoesEm);
    __checklistFilaSalvar = __checklistFilaSalvar.then(async () => {
        await salvarConfiguracao(CHECKLIST_CHAVE_CONFIG, estadoSnapshot);
        await salvarConfiguracao(CHECKLIST_ALTERACOES_CHAVE_CONFIG, versoesSnapshot);
    });
    await __checklistFilaSalvar;
}

// Escapa o texto antes de jogar no innerHTML (itens customizados vêm de um <textarea>).
function checklistEscaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function checklistHtmlItem(id, texto, marcado, removivel) {
    const textoSeguro = checklistEscaparHtml(texto);
    const idSeguro = escaparHtml(String(id));
    return `
        <div class="checklist-item-linha">
            <label class="checklist-item${marcado ? ' checklist-item-feito' : ''}${removivel ? ' checklist-item-personalizado' : ''}" for="checklistItem_${idSeguro}">
                <input type="checkbox" id="checklistItem_${idSeguro}" data-checklist-id="${idSeguro}" ${marcado ? 'checked' : ''}>
                <span class="checklist-item-check"><i class="bi bi-check-lg"></i></span>
                <span class="checklist-item-texto">${textoSeguro}</span>
            </label>
            ${removivel ? `<button type="button" class="checklist-item-remover" data-remover-id="${idSeguro}" aria-label="Remover este item"><i class="bi bi-x-lg"></i></button>` : ''}
        </div>
    `;
}

async function checklistCarregarAlteracoesDoBanco() {
    try {
        const bruto = await obterConfiguracao(CHECKLIST_ALTERACOES_CHAVE_CONFIG);
        const mapa = bruto ? JSON.parse(bruto) : {};
        return mapa && typeof mapa === 'object' && !Array.isArray(mapa) ? mapa : {};
    } catch (_) { return {}; }
}

function checklistHtmlCategoria(cat, catIdx, estado) {
    const itensOriginaisHtml = cat.itens
        .map((texto, itemIdx) => {
            const id = `${catIdx}_${itemIdx}`;
            return checklistHtmlItem(id, texto, !!estado[id], false);
        })
        .join('');

    const itensCustomHtml = checklistItensCustomizadosDaCategoria(catIdx)
        .map(item => checklistHtmlItem(item.id, item.texto, !!estado[item.id], true))
        .join('');

    return `
        <section class="checklist-categoria" id="checklistCat_${catIdx}">
            <div class="checklist-categoria-header">
                <p class="checklist-categoria-titulo"><span class="checklist-categoria-emoji">${cat.emoji}</span>${cat.nome}</p>
                <span class="checklist-categoria-contador" data-checklist-cat-contador="${catIdx}"></span>
            </div>
            <div class="checklist-categoria-itens">${itensOriginaisHtml}${itensCustomHtml}</div>
        </section>
    `;
}

/** Liga os eventos (marcar/desmarcar, remover) da lista atual — chamada de novo a cada re-renderização. */
function checklistLigarEventosDaLista(container) {
    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', async (evt) => {
            const id = evt.target.getAttribute('data-checklist-id');
            evt.target.closest('.checklist-item').classList.toggle('checklist-item-feito', evt.target.checked);
            if (evt.target.checked) celebrarMomento(0.7);
            await checklistAlternarItem(id, evt.target.checked);
        });
    });

    container.querySelectorAll('[data-remover-id]').forEach(botao => {
        botao.addEventListener('click', async (evt) => {
            evt.preventDefault();
            const id = botao.getAttribute('data-remover-id');
            await checklistRemoverItemCustomizado(id);
        });
    });
}

/** Redesenha a lista inteira a partir do estado já em memória (sem reler o banco) — usada ao montar a página e após adicionar/remover um item customizado. */
function checklistRenderizarLista() {
    const container = document.getElementById('checklistCategorias');
    if (!container) return;
    const estado = __checklistEstadoAtual || {};

    container.innerHTML = CHECKLIST_ENCONTROS.map((cat, catIdx) => checklistHtmlCategoria(cat, catIdx, estado)).join('');
    checklistLigarEventosDaLista(container);
    checklistAtualizarProgresso(estado);
}

function checklistGerarIdCustomizado() {
    return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Adiciona um item novo numa categoria já existente (escolhida pelo casal), salva e sincroniza como qualquer config pequena. */
async function checklistAdicionarItemCustomizado(catIdx, texto) {
    const textoLimpo = (texto || '').trim();
    if (!textoLimpo) return;
    if (!__checklistItensCustomizados) __checklistItensCustomizados = await checklistCarregarItensCustomizadosDoBanco();

    __checklistItensCustomizados.push({
        id: checklistGerarIdCustomizado(),
        catIdx: Number(catIdx),
        texto: textoLimpo,
        criadoEm: Date.now()
    });

    await salvarConfiguracao(CHECKLIST_ITENS_CUSTOM_CHAVE_CONFIG, JSON.stringify(__checklistItensCustomizados));
    checklistRenderizarLista();
}

/** Remove um item customizado (nunca um item original da lista) e a marcação dele, se houver. */
async function checklistRemoverItemCustomizado(id) {
    if (!confirm('Remover este item da lista? Essa ação não pode ser desfeita, e também remove ele do outro aparelho na próxima sincronização.')) return;
    if (!__checklistItensCustomizados) __checklistItensCustomizados = await checklistCarregarItensCustomizadosDoBanco();
    if (!__checklistEstadoAtual) __checklistEstadoAtual = await checklistCarregarEstadoDoBanco();
    if (!__checklistAlteracoesEm) __checklistAlteracoesEm = await checklistCarregarAlteracoesDoBanco();

    __checklistItensCustomizados = __checklistItensCustomizados.map(item => item.id === id
        ? Object.assign({}, item, { excluidoEm: new Date().toISOString() })
        : item);
    __checklistEstadoAtual[id] = false;
    __checklistAlteracoesEm[id] = Date.now();

    await salvarConfiguracao(CHECKLIST_ITENS_CUSTOM_CHAVE_CONFIG, JSON.stringify(__checklistItensCustomizados));
    await salvarConfiguracao(CHECKLIST_CHAVE_CONFIG, JSON.stringify(__checklistEstadoAtual));
    await salvarConfiguracao(CHECKLIST_ALTERACOES_CHAVE_CONFIG, JSON.stringify(__checklistAlteracoesEm));
    checklistRenderizarLista();
}

/** Preenche o <select> do modal "Adicionar item" com as categorias já existentes em CHECKLIST_ENCONTROS. */
function checklistPreencherSelectDeCategorias() {
    const select = document.getElementById('checklistSelectCategoria');
    if (!select) return;
    select.innerHTML = CHECKLIST_ENCONTROS.map((cat, catIdx) => `<option value="${catIdx}">${cat.emoji} ${cat.nome}</option>`).join('');
}

/** Liga o botão "Adicionar item", o modal (abrir/fechar/enviar) e a trava de scroll de fundo (mesmo mecanismo usado nos outros overlays do site, em js/utils.js). */
function iniciarModalAdicionarItemChecklist() {
    const overlay = document.getElementById('checklistModalOverlay');
    const btnAbrir = document.getElementById('btnChecklistAdicionarItem');
    const btnCancelar = document.getElementById('btnChecklistCancelarAdicionar');
    const form = document.getElementById('checklistFormAdicionar');
    const inputTexto = document.getElementById('checklistInputTexto');
    const selectCategoria = document.getElementById('checklistSelectCategoria');
    if (!overlay || !btnAbrir || !form) return;

    const abrir = () => {
        overlay.classList.remove('d-none');
        bloquearScrollFundoLembranca();
        setTimeout(() => { if (inputTexto) inputTexto.focus(); }, 50);
    };
    const fechar = () => {
        overlay.classList.add('d-none');
        desbloquearScrollFundoLembranca();
        form.reset();
    };

    btnAbrir.addEventListener('click', abrir);
    if (btnCancelar) btnCancelar.addEventListener('click', fechar);
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) fechar(); });

    form.addEventListener('submit', async (evt) => {
        evt.preventDefault();
        if (!selectCategoria || !inputTexto || !inputTexto.value.trim()) return;
        await checklistAdicionarItemCustomizado(selectCategoria.value, inputTexto.value);
        fechar();
    });
}

/** Botão flutuante que abre um menuzinho pra pular direto pra qualquer uma
 * das 9 categorias (rolagem suave), sem precisar descer pela lista de 132
 * itens toda vez. Montado uma vez só (categorias são fixas em
 * CHECKLIST_ENCONTROS), chamado depois que a lista real já está na tela. */
function iniciarNavegacaoCategoriasChecklist() {
    const wrap = document.getElementById('checklistNavFlutuante');
    const botao = document.getElementById('btnChecklistNavToggle');
    const menu = document.getElementById('checklistNavMenu');
    if (!wrap || !botao || !menu) return;

    menu.innerHTML = CHECKLIST_ENCONTROS.map((cat, catIdx) => `
        <button type="button" class="checklist-nav-item" data-ir-para-categoria="${catIdx}">
            <span class="checklist-nav-item-emoji">${cat.emoji}</span>${cat.nome}
        </button>
    `).join('');

    const fechar = () => {
        wrap.classList.remove('aberto');
        botao.setAttribute('aria-expanded', 'false');
    };
    const alternar = () => {
        const abrindo = !wrap.classList.contains('aberto');
        wrap.classList.toggle('aberto', abrindo);
        botao.setAttribute('aria-expanded', String(abrindo));
    };

    botao.addEventListener('click', (evt) => { evt.stopPropagation(); alternar(); });

    menu.querySelectorAll('[data-ir-para-categoria]').forEach(item => {
        item.addEventListener('click', () => {
            const catIdx = item.getAttribute('data-ir-para-categoria');
            const secao = document.getElementById(`checklistCat_${catIdx}`);
            fechar();
            if (!secao) return;
            // Compensa o header fixo (ver .galeria-header) pra não esconder
            // o título da categoria logo abaixo do topo.
            const topoComFolga = secao.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: topoComFolga, behavior: 'smooth' });
        });
    });

    // Clicar fora fecha o menu; ESC também, pra quem usa teclado/leitor de tela.
    document.addEventListener('click', (evt) => { if (!wrap.contains(evt.target)) fechar(); });
    document.addEventListener('keydown', (evt) => { if (evt.key === 'Escape') fechar(); });

    wrap.classList.remove('d-none');
}

/** Tela cheia de celebração ao completar 100% do checklist (ver chamada em
 * checklistAtualizarProgresso). Mesmo espírito visual da vinheta de
 * abertura do site — ver .checklist-celebracao-overlay em css/style.css. */
function mostrarCelebracaoChecklistCompleto() {
    const overlay = document.getElementById('checklistCelebracaoOverlay');
    if (!overlay) return;
    overlay.classList.remove('d-none');
    bloquearScrollFundoLembranca(); // mesma trava usada no lightbox/modais do site
    // Precisa de um frame pra o navegador registrar o d-none saindo antes
    // de aplicar a classe que dispara a transição de opacidade — senão o
    // fade-in não roda (o navegador junta as duas mudanças num só passo).
    requestAnimationFrame(() => overlay.classList.add('checklist-celebracao-visivel'));
}

function fecharCelebracaoChecklistCompleto() {
    const overlay = document.getElementById('checklistCelebracaoOverlay');
    if (!overlay) return;
    overlay.classList.remove('checklist-celebracao-visivel');
    desbloquearScrollFundoLembranca();
    setTimeout(() => overlay.classList.add('d-none'), 400);
}

async function montarChecklist() {
    const container = document.getElementById('checklistCategorias');
    if (!container) return;

    const carregando = document.getElementById('checklistCarregando');
    __checklistEstadoAtual = await checklistCarregarEstadoDoBanco();
    __checklistItensCustomizados = await checklistCarregarItensCustomizadosDoBanco();
    __checklistAlteracoesEm = await checklistCarregarAlteracoesDoBanco();

    checklistRenderizarLista();
    checklistPreencherSelectDeCategorias();
    iniciarNavegacaoCategoriasChecklist();

    if (carregando) carregando.classList.add('d-none');
    container.classList.add('checklist-categorias-visivel');

    // Reforço: a página só fica "alta" (com os 132 itens) a partir daqui —
    // antes disso ela é só o cabeçalho + card de progresso + spinner. Se
    // sobrou algum scroll residual de antes desse momento (ex.: navegador
    // tentando restaurar posição, mesmo com history.scrollRestoration
    // manual, ver checklist.html), garante que a pessoa sempre vê o topo
    // (card de progresso) assim que a lista de verdade aparece.
    window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        iniciarBloqueioDesktop();
    } catch (e) {
        return; // BLOQUEIO_DESKTOP_ATIVO: tela de bloqueio já exibida, para tudo o mais
    }

    bloquearZoom();

    if (typeof prepararDadosParaEntrada === 'function') {
        try { await prepararDadosParaEntrada(); } catch (e) { console.error('Falha ao sincronizar o checklist com a nuvem:', e); }
    }

    await montarChecklist();
    iniciarModalAdicionarItemChecklist();
    consultarAtualizacoesEmSegundoPlano();

    const btnFecharCelebracao = document.getElementById('btnFecharCelebracaoChecklist');
    if (btnFecharCelebracao) btnFecharCelebracao.addEventListener('click', fecharCelebracaoChecklistCompleto);
});
