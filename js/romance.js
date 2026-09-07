/**
 * ROMANCE.JS — Página "Nossa História".
 * Reúne: contador vivo do relacionamento, timeline com fotos, "nossos
 * momentos", playlist, quiz, seleção de regras do contrato, lembranças
 * (prints salvos pelo usuário), cápsula do tempo e o easter egg do sobrenome.
 */

/* ---------------- Contador vivo do relacionamento ---------------- */
function calcularDuracaoRelacionamento(inicioIso) {
    const inicio = new Date(inicioIso);
    const agora = new Date();
    let anos = agora.getFullYear() - inicio.getFullYear();
    let meses = agora.getMonth() - inicio.getMonth();
    let dias = agora.getDate() - inicio.getDate();
    let horas = agora.getHours() - inicio.getHours();
    let minutos = agora.getMinutes() - inicio.getMinutes();
    let segundos = agora.getSeconds() - inicio.getSeconds();

    if (segundos < 0) { segundos += 60; minutos--; }
    if (minutos < 0) { minutos += 60; horas--; }
    if (horas < 0) { horas += 24; dias--; }
    if (dias < 0) { const ultimoDiaMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0).getDate(); dias += ultimoDiaMesAnterior; meses--; }
    if (meses < 0) { meses += 12; anos--; }

    return { anos: Math.max(0, anos), meses: Math.max(0, meses), dias: Math.max(0, dias), horas, minutos, segundos };
}

// obterOuCriarDataPrimeiroAcesso() foi movida pra js/utils.js (carregado
// nesta página antes de romance.js) — precisa ser compartilhada com
// diagnostico.html/checklist.html via js/export.js. Ver comentário lá.

let contadorVivoIntervalo = null;
let contadorVivoDataInicio = null;
let contadorVivoOuvintesRegistrados = false;

// Recalcula os 6 números. É "burra" de propósito (sempre lê a hora atual de
// verdade) — nunca soma "+1" em cima do valor anterior, então não existe
// como ela "travar" num número e ficar presa lá: se essa função rodar, o
// valor mostrado está sempre certo para o instante em que rodou.
//
// Cada número só é escrito no DOM (e só pisca, via atualizarNumeroContador)
// quando muda de verdade — antes ela reescrevia todos os 6 a cada segundo,
// então mesmo "dias" (que só muda uma vez por dia) recebia um innerText
// novo a cada tick do relógio, e isso é o que fazia o quadrado inteiro
// parecer "piscando a cada segundo" sem nunca ter mudado de valor.
function atualizarContadorVivo() {
    if (!contadorVivoDataInicio) return;
    try {
        const grid = document.getElementById('liveCounterGrid');
        if (!grid) return; // página trocou de tela, sem erro no console à toa
        const d = calcularDuracaoRelacionamento(contadorVivoDataInicio);
        atualizarNumeroContador('lcAnos', d.anos);
        atualizarNumeroContador('lcMeses', d.meses);
        atualizarNumeroContador('lcDias', d.dias);
        atualizarNumeroContador('lcHoras', String(d.horas).padStart(2, '0'));
        atualizarNumeroContador('lcMinutos', String(d.minutos).padStart(2, '0'));
        atualizarNumeroContador('lcSegundos', String(d.segundos).padStart(2, '0'));
    } catch (e) {
        console.error('Falha ao atualizar o contador "Juntos há" (não deve travar o resto do site):', e);
    }
}

// Escreve um número no DOM (e dispara o "pisca" do quadrado, via classe
// lc-atualizado — ver @keyframes lcFlash, css/style.css) só quando o texto
// realmente mudou. Se o valor for igual ao que já estava na tela, não mexe
// em nada — nem reescreve o texto, nem pisca.
function atualizarNumeroContador(idElemento, valorNovo) {
    const el = document.getElementById(idElemento);
    if (!el) return;
    const textoNovo = String(valorNovo);
    if (el.textContent === textoNovo) return;
    el.textContent = textoNovo;

    const unidade = el.closest('.lc-unit');
    if (!unidade) return;
    unidade.classList.remove('lc-atualizado');
    void unidade.offsetWidth; // força reflow, pra poder reiniciar a animação mesmo se ela piscou há pouquíssimo tempo
    unidade.classList.add('lc-atualizado');
}

async function iniciarContadorVivo() {
    const grid = document.getElementById('liveCounterGrid');
    if (!grid) return;
    if (contadorVivoIntervalo) clearInterval(contadorVivoIntervalo);

    // "Juntos há" agora conta a partir do pedido de verdade
    // (aurora_data_pedido — o mesmo valor fixo de "Nosso pedido: 01 de
    // agosto..." logo acima e do contrato), e não mais da primeira vez que
    // o site foi aberto neste aparelho. Antes, se o site fosse aberto pela
    // primeira vez bem depois do pedido de verdade (outro aparelho,
    // storage limpo, etc.), o contador ficava "atrasado" — contando a
    // partir da abertura, não do pedido — igual ao que aconteceu aqui.
    // aurora_data_pedido é regravado a cada abertura por
    // garantirDadosPermanentesDoPedido() (js/preservacao.js), então nunca
    // deveria faltar — mas se por algum motivo faltar mesmo assim, cai de
    // volta pro primeiro acesso, só pra não travar o contador.
    const dataPedido = await obterConfiguracao('aurora_data_pedido');
    contadorVivoDataInicio = dataPedido || await obterOuCriarDataPrimeiroAcesso();

    atualizarContadorVivo();
    contadorVivoIntervalo = setInterval(atualizarContadorVivo, 1000);

    // Celulares pausam/atrasam o setInterval quando a tela é bloqueada ou o
    // navegador vai para segundo plano por um bom tempo — em alguns
    // aparelhos, o timer não retoma sozinho depois disso, e é exatamente
    // isso que fazia o contador "parecer travado" (parava de marcar as
    // horas/minutos e, com o tempo, os dias). Esses dois eventos disparam
    // sempre que a aba volta a ficar visível/ativa e forçam: (1) um
    // recálculo imediato, certo na hora, e (2) o reinício do intervalo, pra
    // ele não continuar "morto" silenciosamente.
    if (!contadorVivoOuvintesRegistrados) {
        contadorVivoOuvintesRegistrados = true;
        const retomar = () => {
            if (document.visibilityState && document.visibilityState !== 'visible') return;
            atualizarContadorVivo();
            if (contadorVivoIntervalo) clearInterval(contadorVivoIntervalo);
            contadorVivoIntervalo = setInterval(atualizarContadorVivo, 1000);
        };
        document.addEventListener('visibilitychange', retomar);
        window.addEventListener('pageshow', retomar);
        window.addEventListener('focus', retomar);
    }
}

/* ---------------- Marcos do tempo juntos (1 semana, 1 mês, 3 meses... 10 anos) ----------------
 * Além do contador vivo (que atualiza segundo a segundo), a página também
 * comemora "datas redondas": 1 semana, cada mês até completar 1 ano, e
 * depois os anos (2, 3, 4, 5... até 10). Cada marco tem sua própria
 * mensagem — é só editar o texto de cada item de MARCOS_RELACIONAMENTO
 * abaixo, ou adicionar/remover marcos à vontade.
 *
 * Usa a mesma data do pedido de verdade (aurora_data_pedido, a mesma que
 * já é usada na cápsula do tempo e no "counterText") como ponto de
 * partida, e a hora do servidor (obterHoraConfiavel) — assim como no
 * especial de aniversário, evita que adiantar a data do celular destrave
 * a mensagem antes da hora.
 */
const MARCOS_RELACIONAMENTO = [
    { dias: 7,   texto: '1 semana juntos! 💛 Só o começo de tudo.' },
    { meses: 1,  texto: '1 mês juntos! 💕' },
    { meses: 2,  texto: '2 meses juntos! 💞' },
    { meses: 3,  texto: '3 meses juntos! 🥰' },
    { meses: 4,  texto: '4 meses juntos!' },
    { meses: 5,  texto: '5 meses juntos!' },
    { meses: 6,  texto: '6 meses juntos! Meio ano de nós dois. 💍' },
    { meses: 7,  texto: '7 meses juntos!' },
    { meses: 8,  texto: '8 meses juntos!' },
    { meses: 9,  texto: '9 meses juntos!' },
    { meses: 10, texto: '10 meses juntos!' },
    { meses: 11, texto: '11 meses juntos! Quase 1 ano...' },
    { anos: 1,   texto: '1 ano juntos! 🎂 Um ano inteiro de nós.' },
    { anos: 2,   texto: '2 anos juntos!' },
    { anos: 3,   texto: '3 anos juntos!' },
    { anos: 4,   texto: '4 anos juntos!' },
    { anos: 5,   texto: '5 anos juntos! 🥂' },
    { anos: 6,   texto: '6 anos juntos!' },
    { anos: 7,   texto: '7 anos juntos!' },
    { anos: 8,   texto: '8 anos juntos!' },
    { anos: 9,   texto: '9 anos juntos!' },
    { anos: 10,  texto: '10 anos juntos! 👑 Uma década.' },
];

// Soma o marco (dias, meses ou anos) na data base e devolve a data alvo
// em que ele deve "cair".
function calcularDataMarco(dataBaseIso, marco) {
    const data = new Date(dataBaseIso);
    if (marco.dias) data.setDate(data.getDate() + marco.dias);
    if (marco.meses) data.setMonth(data.getMonth() + marco.meses);
    if (marco.anos) data.setFullYear(data.getFullYear() + marco.anos);
    return data;
}

// Compara só o dia (ano/mês/dia), ignorando a hora — o marco vale o dia
// inteiro, não só o segundo exato em que ele completa.
function mesmoDia(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

async function verificarMarcoRelacionamento() {
    // Preferimos a data do pedido de verdade; se por algum motivo ela
    // ainda não existir, cai pra data do primeiro acesso (mesma base do
    // contador vivo), só pra função não travar por falta de dado.
    const dataBaseIso = (await obterConfiguracao('aurora_data_pedido')) || (await obterConfiguracao('aurora_primeiro_acesso'));
    if (!dataBaseIso) return;

    const agora = await obterHoraConfiavel();
    const marcoDeHoje = MARCOS_RELACIONAMENTO.find(marco => mesmoDia(calcularDataMarco(dataBaseIso, marco), agora));
    if (!marcoDeHoje) return;

    exibirMarcoRelacionamento(marcoDeHoje.texto);
}

/* Mostra a mensagem do marco. Se já existir um bloco #marcoRelacionamentoBloco
 * no HTML (com um elemento #marcoRelacionamentoTexto dentro), usa ele —
 * assim dá pra estilizar do jeito que quiser no CSS. Se ainda não existir,
 * cria um bloco simples sozinho logo abaixo do contador vivo, pra
 * funcionar mesmo sem mexer no HTML. */
function exibirMarcoRelacionamento(texto) {
    let bloco = document.getElementById('marcoRelacionamentoBloco');
    let textoEl;

    if (bloco) {
        textoEl = document.getElementById('marcoRelacionamentoTexto') || bloco;
    } else {
        bloco = document.createElement('div');
        bloco.id = 'marcoRelacionamentoBloco';
        bloco.style.cssText = 'margin:24px auto;padding:16px 22px;max-width:440px;text-align:center;border-radius:14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:#fff;font-size:1.15rem;line-height:1.4;';
        textoEl = document.createElement('span');
        bloco.appendChild(textoEl);

        const grid = document.getElementById('liveCounterGrid');
        if (grid && grid.parentElement) {
            grid.parentElement.insertBefore(bloco, grid.nextSibling);
        } else {
            document.body.prepend(bloco);
        }
    }

    textoEl.textContent = texto;
    bloco.classList.remove('d-none');
}

/* ---------------- Timeline ---------------- */
/* ---------------- "Nosso céu" (timeline em forma de constelação) ----------------
 * Mesma fonte de dados de sempre (TIMELINE_MARCOS, em js/config.js) — só
 * muda a apresentação: em vez de uma lista, cada marco vira uma estrela
 * numa constelação. Tocar na estrela abre um modal com a foto e o texto
 * daquele momento (mesmo conteúdo de antes, só que revelado sob demanda).
 */
function renderizarTimeline() {
    const constelacao = document.getElementById('ceuConstelacao');
    const fundo = document.getElementById('ceuFundoEstrelas');
    if (!constelacao) return;
    constelacao.innerHTML = '<span id="dataPedidoTimeline" class="d-none"></span>';

    // Estrelinhas de fundo, só decorativas (não clicáveis) — geradas uma
    // vez, posição e tamanho aleatórios, pra dar o clima de céu de verdade.
    if (fundo && !fundo.dataset.gerado) {
        fundo.dataset.gerado = '1';
        const TOTAL_ESTRELAS_FUNDO = 45;
        for (let i = 0; i < TOTAL_ESTRELAS_FUNDO; i++) {
            const estrela = document.createElement('span');
            estrela.className = 'ceu-estrela-fundo';
            estrela.style.left = `${Math.random() * 100}%`;
            estrela.style.top = `${Math.random() * 100}%`;
            const tamanho = 1 + Math.random() * 1.6;
            estrela.style.width = `${tamanho}px`;
            estrela.style.height = `${tamanho}px`;
            estrela.style.animationDelay = `${Math.random() * 4}s`;
            fundo.appendChild(estrela);
        }
    }

    // Zigue-zague descendo a tela — dá o efeito de constelação sem
    // depender de coordenadas fixas (funciona com qualquer quantidade de
    // marcos, caso a timeline cresça no futuro).
    const PADRAO_X = [22, 68, 32, 74, 26, 64]; // posições em % alternando pros dois lados, repete se precisar
    const ESPACO_VERTICAL_PX = 92; // distância entre uma estrela e a próxima, descendo a tela
    TIMELINE_MARCOS.forEach((marco, i) => {
        const estrela = document.createElement('button');
        estrela.type = 'button';
        estrela.className = 'ceu-estrela' + (marco.ehPedido ? ' ceu-estrela-pedido' : '');
        estrela.style.left = `${PADRAO_X[i % PADRAO_X.length]}%`;
        estrela.style.top = `${i * ESPACO_VERTICAL_PX + 30}px`;
        estrela.innerHTML = `<span class="ceu-estrela-brilho"></span><span class="ceu-estrela-label">${marco.data || ''}</span>`;
        estrela.addEventListener('click', () => abrirEstrelaModal(i));
        constelacao.appendChild(estrela);
    });

    // A altura do céu precisa acompanhar quantos marcos existem — cresce
    // sozinho se a timeline ganhar mais itens no futuro, sem cortar
    // nenhuma estrela nem sobrar espaço vazio demais.
    const container = document.getElementById('ceuEstreladoContainer');
    if (container) container.style.minHeight = `${TIMELINE_MARCOS.length * ESPACO_VERTICAL_PX + 100}px`;

    iniciarEstrelasCadentes();
    iniciarEasterEggDaLua();
}

/* ---------------- Easter egg da lua: 5 toques revelam uma mensagem em Morse ---------------- */
function iniciarEasterEggDaLua() {
    const lua = document.getElementById('ceuLua');
    const overlay = document.getElementById('luaEasterEggOverlay');
    if (!lua || !overlay || lua.dataset.easterEggIniciado) return;
    lua.dataset.easterEggIniciado = '1';

    const morseEl = document.getElementById('luaEasterEggMorse');

    contarToquesRepetidos(lua, 5, () => {
        morseEl.textContent = paraCodigoMorse(MENSAGEM_SECRETA_LUA);
        overlay.classList.remove('d-none');
        overlay.scrollTop = 0;
        bloquearScrollFundoLembranca();
        marcarEasterEggEncontrado('luaMorse');
    });

    const fecharLuaEasterEgg = () => { overlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); forcarRecalculoDeLayout(); };
    document.getElementById('btnFecharLuaEasterEgg').addEventListener('click', fecharLuaEasterEgg);
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) fecharLuaEasterEgg(); });
}

// Estrelas cadentes: puramente decorativas, cruzam o céu de vez em
// quando pra dar mais profundidade, em posições/tempos/direções
// aleatórios que se repetem em loop.
function iniciarEstrelasCadentes() {
    const camada = document.getElementById('ceuEstrelasCadentes');
    if (!camada || camada.dataset.gerado) return;
    camada.dataset.gerado = '1';

    const TOTAL_CADENTES = 5;
    for (let i = 0; i < TOTAL_CADENTES; i++) {
        const cadente = document.createElement('span');
        cadente.className = 'ceu-estrela-cadente';

        // Cruza de um lado do céu até o outro: às vezes indo pra direita,
        // às vezes pra esquerda, sempre descendo um pouco, nunca sempre
        // o mesmo trajeto. Como se estivesse vindo de longe: a POSIÇÃO
        // INICIAL já fica fora da área visível (menos de 0% ou mais de
        // 100%), então o começo do trajeto acontece escondido pelo
        // overflow:hidden da camada, e a estrela só "aparece" quando já
        // está cruzando de verdade, em vez de simplesmente surgir do nada
        // já dentro do céu.
        const indoDireita = Math.random() < 0.5;
        const distanciaX = 220 + Math.random() * 180; // 220 a 400px de travessia, cruzando de fora pra dentro e seguindo pro outro lado
        const dx = indoDireita ? distanciaX : -distanciaX;
        const dy = 50 + Math.random() * 110; // sempre descendo um pouco, em graus variados

        // Ângulo real do movimento, girado 180° para o rastro sempre ficar
        // atrás da estrela (não importa a direção que ela cruzar).
        const anguloMovimento = Math.atan2(dy, dx) * (180 / Math.PI);
        const anguloRastro = anguloMovimento + 180;

        cadente.style.setProperty('--cadente-dx', `${dx}px`);
        cadente.style.setProperty('--cadente-dy', `${dy}px`);
        cadente.style.setProperty('--cadente-rastro-rot', `${anguloRastro}deg`);
        cadente.style.top = `${Math.random() * 55}%`;
        cadente.style.left = indoDireita ? `${-25 - Math.random() * 15}%` : `${115 + Math.random() * 15}%`;
        cadente.style.animationDelay = `${Math.random() * 8 + i * 3}s`;
        cadente.style.animationDuration = `${2.4 + Math.random() * 1.6}s`;
        camada.appendChild(cadente);
    }

    iniciarNaveAlienigena(camada);
}

// Easter egg raro: uma navezinha alienígena cruza o céu bem devagar, em
// intervalos variáveis (não mais um relógio fixo de 3 em 3 minutos) — cada
// travessia sorteia direção, posição vertical, distância, curva do arco,
// tamanho, brilho e duração, pra nunca parecer a mesma navezinha repetindo
// sempre o mesmo trajeto. A distância do trajeto é calculada em pixels a
// partir da largura real do céu (percentagem não funciona aqui, pois
// translate() em % é relativo ao próprio elemento, não ao contêiner).
function iniciarNaveAlienigena(camada) {
    function cruzarUmaVez() {
        if (!document.body.contains(camada)) return; // saiu de "Nossa História" — não continua gerando em segundo plano nem agenda a próxima
        const nave = document.createElement('div');
        nave.className = 'ceu-nave-alienigena';
        nave.innerHTML = '<span class="ceu-nave-cupula"></span><span class="ceu-nave-corpo"></span><span class="ceu-nave-luz ceu-nave-luz-1"></span><span class="ceu-nave-luz ceu-nave-luz-2"></span><span class="ceu-nave-luz ceu-nave-luz-3"></span>';
        const indoDireita = Math.random() < 0.5;

        // Faixa vertical de partida bem mais ampla que antes (era só
        // 10%-60%), e a folga fora da tela também varia, pra não sair
        // sempre do mesmo pontinho de cada lado.
        nave.style.top = `${4 + Math.random() * 68}%`;
        nave.style.left = indoDireita ? `${-28 - Math.random() * 14}%` : `${114 + Math.random() * 14}%`;

        // Largura real da camada (ou da janela, como fallback), com uma
        // folga que também varia — nem toda navezinha atravessa a tela
        // inteira do mesmo jeito.
        const largura = camada.getBoundingClientRect().width || window.innerWidth;
        const distancia = largura * (0.82 + Math.random() * 0.5) + 90;
        nave.style.setProperty('--nave-dx', `${indoDireita ? distancia : -distancia}px`);

        // Arco de voo: às vezes sobe no meio do caminho, às vezes desce, com
        // intensidades diferentes, e termina em alturas diferentes — antes
        // esse arco era sempre fixo (-14px no meio, 6px no fim), fazendo
        // toda navezinha parecer clone da anterior.
        const direcaoDoArco = Math.random() < 0.5 ? -1 : 1;
        nave.style.setProperty('--nave-dy-meio', `${(direcaoDoArco * (6 + Math.random() * 30)).toFixed(0)}px`);
        nave.style.setProperty('--nave-dy-fim', `${(-15 + Math.random() * 45).toFixed(0)}px`);

        // Tamanho e brilho levemente diferentes a cada travessia.
        nave.style.setProperty('--nave-escala', (0.72 + Math.random() * 0.65).toFixed(2));
        nave.style.setProperty('--nave-opacidade', (0.65 + Math.random() * 0.35).toFixed(2));

        // Velocidade variável (9s a 20s, era sempre 16s fixo).
        const duracao = 9 + Math.random() * 11;
        nave.style.animationDuration = `${duracao.toFixed(1)}s`;

        camada.appendChild(nave);
        nave.addEventListener('animationend', () => nave.remove());

        agendarProximaTravessia();
    }

    function agendarProximaTravessia() {
        // Intervalo variável entre 2 e 5 minutos reais (em vez de sempre
        // exatos 3 minutos) — evita o padrão "sempre no mesmo instante,
        // sempre parecendo a mesma nave indo pro mesmo lugar".
        const proximaEmMs = (2 + Math.random() * 3) * 60 * 1000;
        setTimeout(cruzarUmaVez, proximaEmMs);
    }

    setTimeout(cruzarUmaVez, 30000 + Math.random() * 60000); // primeira aparição entre 30s e 1min30s, pra não depender só de quem fica minutos olhando
}

function iniciarFechamentoEstrelaModal() {
    const overlay = document.getElementById('estrelaModalOverlay');
    const fechar = document.getElementById('btnFecharEstrelaModal');
    if (!overlay || overlay.dataset.iniciado === '1') return;
    overlay.dataset.iniciado = '1';
    const fecharEstrelaModal = () => {
        overlay.classList.add('d-none');
        desbloquearScrollFundoLembranca();
        forcarRecalculoDeLayout(); // evita espaço vazio no fim da tela (ver js/utils.js)
    };
    fechar.addEventListener('click', fecharEstrelaModal);
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) fecharEstrelaModal(); });
}

// Guarda qual estrela está aberta no momento, pra "anterior"/"próxima"
// saberem de onde partir (ver estrelaModalAnterior/estrelaModalProxima).
let estrelaIndiceAtual = 0;

async function abrirEstrelaModal(indice) {
    const marco = TIMELINE_MARCOS[indice];
    if (!marco) return;
    estrelaIndiceAtual = indice;
    const overlay = document.getElementById('estrelaModalOverlay');
    // Esta função também é chamada ao navegar entre lembranças com o modal
    // já aberto; como bloquearScrollFundoLembranca() usa contagem de
    // referências (js/utils.js), só trava aqui se estava realmente fechado.
    const jaEstavaAberto = !overlay.classList.contains('d-none');
    const foto = document.getElementById('estrelaModalFoto');
    const dataEl = document.getElementById('estrelaModalData');
    const textoEl = document.getElementById('estrelaModalTexto');

    // Setas de navegação: escondidas nas pontas (não dá "próxima" na
    // última estrela nem "anterior" na primeira) — é uma linha do tempo,
    // então não faz sentido dar a volta como no lightbox de fotos.
    const btnAnterior = document.getElementById('btnEstrelaAnterior');
    const btnProxima = document.getElementById('btnEstrelaProxima');
    if (btnAnterior) btnAnterior.classList.toggle('d-none', indice <= 0);
    if (btnProxima) btnProxima.classList.toggle('d-none', indice >= TIMELINE_MARCOS.length - 1);

    // resolverFotoPlaceholderOuAsset (js/export.js) resolve a extensão real
    // do arquivo (.jpg/.jpeg/.png/.webp) em vez de assumir .jpg fixo.
    const fotoSrc = await resolverFotoPlaceholderOuAsset(marco.foto);
    foto.dataset.placeholderId = marco.foto;
    foto.onerror = function () {
        if (this.dataset.fallbackAplicado) return;
        this.dataset.fallbackAplicado = '1';
        this.src = gerarSvgPlaceholderComLegenda('Foto do momento');
    };
    foto.src = fotoSrc;

    const nomeEstrela = marco.data || '';
    dataEl.textContent = nomeEstrela;
    textoEl.textContent = marco.texto || '';
    overlay.classList.remove('d-none');
    overlay.scrollTop = 0; // sempre abre mostrando o começo do texto, nunca no meio
    if (!jaEstavaAberto) bloquearScrollFundoLembranca();

    foto.onclick = async () => {
        const todasFotos = await Promise.all(TIMELINE_MARCOS.map(m => resolverFotoPlaceholderOuAsset(m.foto)));
        const todasLegendas = TIMELINE_MARCOS.map(m => m.data || '');
        abrirLightboxGaleria(todasFotos, indice, todasLegendas);
    };
}

function estrelaModalAnterior() {
    if (estrelaIndiceAtual > 0) abrirEstrelaModal(estrelaIndiceAtual - 1);
}
function estrelaModalProxima() {
    if (estrelaIndiceAtual < TIMELINE_MARCOS.length - 1) abrirEstrelaModal(estrelaIndiceAtual + 1);
}

// Setas do teclado (← →) navegam entre as estrelas enquanto o modal
// estiver aberto — só reage se o modal da estrela estiver visível, pra
// não capturar as setas quando a pessoa está em outra parte da página.
document.addEventListener('keydown', (evt) => {
    const overlay = document.getElementById('estrelaModalOverlay');
    if (!overlay || overlay.classList.contains('d-none')) return;
    if (evt.key === 'ArrowLeft') estrelaModalAnterior();
    else if (evt.key === 'ArrowRight') estrelaModalProxima();
});

/* ---------------- "Nossos momentos" (mesa de fotos) ---------------- */
async function iniciarGaleriaMomentos() {
    const galeria = document.getElementById('momentosGallery');
    if (!galeria) return;
    const cartoes = Array.from(galeria.querySelectorAll('.table-photo'));

    // O manifesto do deploy é a fonte autoritativa. Antes o cache local era
    // usado primeiro e podia apontar para fotos removidas/renomeadas, deixando
    // alguns cartões vazios de forma aparentemente aleatória.
    let fotos = [];
    const cacheExistente = galeriaLerCache(); // aceita parcial ou completo
    const fotosEmCache = cacheExistente
        ? cacheExistente
            .filter(item => item.tipo === 'foto')
            .map(item => ({ numero: item.numero, caminho: item.caminho }))
        : [];

    try {
        const manifesto = await galeriaCarregarManifesto();
        if (manifesto !== null) {
            fotos = manifesto
                .filter(item => item.tipo === 'foto')
                .map(item => ({ numero: item.numero, caminho: item.caminho }));
            galeriaSalvarCacheSeMelhor(manifesto, true);
        } else if (fotosEmCache.length) {
            fotos = fotosEmCache;
        } else {
            fotos = await descobrirFotosParaDestaque();
        }
    } catch (e) {
        fotos = fotosEmCache;
    }

    // Se nenhuma foto foi achada (ex.: instabilidade de rede), refaz com a
    // varredura completa e exaustiva da Galeria antes de aceitar que não há fotos.
    if (fotos.length === 0) {
        try {
            const todosOsItens = await galeriaEscanearCompleta(null, null);
            fotos = todosOsItens.filter(item => item.tipo === 'foto').map(item => ({ numero: item.numero, caminho: item.caminho }));
        } catch (e) {
            // mantém o que a varredura já tinha achado (nada, nesse caso)
        }
    }

    galeriaRevalidarEmSegundoPlano(); // atualiza o cache em segundo plano, sem travar a tela

    // Escolhe fotos espalhadas pela numeração (evita várias seguidas, que
    // costumam ser do mesmo dia/momento).
    let escolhidas = escolherFotosEspalhadas(fotos, cartoes.length);

    // Se existir ao menos 1 foto real mas menos que o total de cartões,
    // repete as existentes para preencher, em vez de deixar quadros vazios.
    if (escolhidas.length > 0 && escolhidas.length < cartoes.length) {
        const preenchidas = [];
        for (let i = 0; i < cartoes.length; i++) preenchidas.push(escolhidas[i % escolhidas.length]);
        escolhidas = preenchidas;
    }

    // Os 4 cartões são fixos e sempre precisam mostrar algo: reserva outras
    // fotos candidatas e, se uma escolhida falhar ao carregar, tenta a
    // próxima reserva automaticamente antes de desistir.
    const jaEscolhidos = new Set(escolhidas);
    const reservas = fotos.map(f => f.caminho).filter((caminho) => !jaEscolhidos.has(caminho));

    // Só considera a mesa "pronta" quando cada <img> escolhida terminar de
    // carregar de verdade (não só confirmar via HEAD que o arquivo existe),
    // com um limite de tempo de segurança para nunca travar a experiência.
    const LIMITE_ESPERA_FOTO_MS = 15000;
    const promessasDeCarregamento = [];

    cartoes.forEach((cartao, i) => {
        const img = cartao.querySelector('img');
        if (escolhidas[i]) {
            cartao.classList.remove('d-none');
            cartao.style.cursor = 'pointer';
            cartao.onclick = () => abrirLightboxGaleria(escolhidas, i);

            promessasDeCarregamento.push(new Promise((resolve) => {
                let jaResolveu = false;
                let timeoutGeral = null;
                const finalizar = () => {
                    if (jaResolveu) return;
                    jaResolveu = true;
                    if (timeoutGeral) clearTimeout(timeoutGeral);
                    resolve();
                };

                const tentarCarregar = (caminho, tentativa = 0) => {
                    img.onload = finalizar;
                    img.onerror = () => {
                        // Uma falha isolada de CDN/rede não invalida a foto.
                        // Repete a mesma URL uma vez sem cache antes de trocar.
                        if (tentativa < 1) {
                            tentarCarregar(caminho, tentativa + 1);
                            return;
                        }
                        // Não carregou de verdade — tenta a próxima reserva.
                        const proxima = reservas.shift();
                        if (proxima) {
                            escolhidas[i] = proxima;
                            cartao.onclick = () => abrirLightboxGaleria(escolhidas, i);
                            tentarCarregar(proxima, 0);
                            return;
                        }
                        aplicarImagemPlaceholder(img, null, 'Foto do casal'); // sem mais reservas: cai no placeholder
                        cartao.style.cursor = '';
                        cartao.onclick = null;
                        finalizar();
                    };
                    img.alt = 'Foto do casal';
                    img.dataset.fallbackControlado = '1';
                    const separador = caminho.includes('?') ? '&' : '?';
                    img.src = tentativa > 0 ? `${caminho}${separador}recarregar=${Date.now()}` : caminho;
                    if (img.complete && img.naturalWidth > 0) finalizar(); // já estava no cache do navegador — não precisa esperar evento nenhum
                };

                tentarCarregar(escolhidas[i]);
                timeoutGeral = setTimeout(() => {
                    if (jaResolveu) return;
                    img.onload = null;
                    img.onerror = null;
                    aplicarImagemPlaceholder(img, null, 'Foto do casal');
                    cartao.style.cursor = '';
                    cartao.onclick = null;
                    finalizar();
                }, LIMITE_ESPERA_FOTO_MS);
            }));
        } else {
            // Só chega aqui se a galeria não tiver NENHUMA foto real ainda
            // (site recém criado) — cai no mesmo SVG "adicione esta foto"
            // usado no resto do site, em vez de simplesmente sumir ou quebrar.
            aplicarImagemPlaceholder(img, null, 'Foto do casal');
            cartao.style.cursor = '';
            cartao.onclick = null;
        }
    });

    await Promise.all(promessasDeCarregamento);
}

/* ---------------- Quiz do casal ---------------- */
let quizIndiceAtual = 0;
let quizRespostasEscolhidas = [];
let quizAcertos = 0; // pontuação (item 3 do prompt de correções)

function renderizarQuizDots() {
    const dots = document.getElementById('quizDots');
    if (!dots) return;
    dots.innerHTML = '';
    QUIZ_PERGUNTAS.forEach((_, i) => {
        const span = document.createElement('span');
        if (i < quizIndiceAtual) span.classList.add('done');
        dots.appendChild(span);
    });
}

function mostrarPerguntaQuiz() {
    const p = QUIZ_PERGUNTAS[quizIndiceAtual];
    renderizarQuizDots();
    document.getElementById('quizPergunta').textContent = p.pergunta;

    const opcoesWrap = document.getElementById('quizOpcoes');
    opcoesWrap.innerHTML = '';
    const reacaoEl = document.getElementById('quizReacao');
    reacaoEl.textContent = ''; reacaoEl.classList.remove('visivel');

    p.opcoes.forEach((opcao, i) => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'quiz-opcao-btn'; btn.textContent = opcao;
        btn.addEventListener('click', () => responderQuiz(i, btn));
        opcoesWrap.appendChild(btn);
    });
}

async function responderQuiz(indiceEscolhido, btnClicado) {
    const p = QUIZ_PERGUNTAS[quizIndiceAtual];
    document.querySelectorAll('#quizOpcoes .quiz-opcao-btn').forEach(b => { b.disabled = true; });

    const acertou = indiceEscolhido === p.certa;
    if (acertou) quizAcertos++;
    btnClicado.classList.add('selecionada', acertou ? 'certa' : 'errada');
    quizRespostasEscolhidas.push({ pergunta: p.pergunta, resposta: p.opcoes[indiceEscolhido], acertou });

    const reacaoEl = document.getElementById('quizReacao');
    reacaoEl.textContent = acertou ? p.certoMsg : p.erradoMsg;
    reacaoEl.classList.add('visivel');

    if (acertou && typeof confetti === 'function') {
        confetti({ particleCount: 40, spread: 55, origin: { y: 0.6 }, colors: ['#B76E79', '#FAF9F6', '#ffffff'] });
    }

    setTimeout(async () => {
        quizIndiceAtual++;
        if (quizIndiceAtual < QUIZ_PERGUNTAS.length) {
            mostrarPerguntaQuiz();
        } else {
            document.getElementById('quizCard').classList.add('d-none');
            const finalMsg = document.getElementById('quizFinalMsg');
            document.getElementById('quizPontuacaoTexto').textContent = `Você acertou ${quizAcertos} de ${QUIZ_PERGUNTAS.length}`;
            document.getElementById('quizResumoTexto').textContent =
                `O que importa mesmo é que a gente continua escrevendo essas respostas juntos, todos os dias, ${NOME_DELA}.`;
            finalMsg.classList.remove('d-none');
            finalMsg.classList.add('reveal-up');
            await salvarConfiguracao('aurora_quiz_respostas', JSON.stringify(quizRespostasEscolhidas));
        }
    }, 1600);
}

function iniciarQuiz() {
    quizIndiceAtual = 0; quizRespostasEscolhidas = []; quizAcertos = 0;
    document.getElementById('quizCard').classList.remove('d-none');
    document.getElementById('quizFinalMsg').classList.add('d-none');
    mostrarPerguntaQuiz();
}

/* ---------------- Regras do contrato ---------------- */
let regrasSelecionadas = [];
const MAX_REGRAS = 8; // até 8 regras personalizadas (item 4 do prompt de correções, era 5)
const MIN_REGRAS = 2;

function renderRulesGrid() {
    const grid = document.getElementById('rulesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    OPCOES_REGRAS_CONTRATO.forEach(op => {
        const card = document.createElement('div');
        card.className = 'rule-card';
        card.dataset.id = op.id;
        card.innerHTML = `<div class="rule-check"><i class="bi bi-check-lg"></i></div><i class="bi ${op.icon} rule-icon"></i><p>${op.label}</p>`;
        card.addEventListener('click', () => toggleRegra(op.id, card));
        grid.appendChild(card);
    });
    atualizarEstadoSelecaoRegras();
}

function toggleRegra(id, card) {
    const idx = regrasSelecionadas.indexOf(id);
    if (idx >= 0) { regrasSelecionadas.splice(idx, 1); card.classList.remove('selecionada'); }
    else { if (regrasSelecionadas.length >= MAX_REGRAS) return; regrasSelecionadas.push(id); card.classList.add('selecionada'); }
    atualizarEstadoSelecaoRegras();
}

function atualizarEstadoSelecaoRegras() {
    const contador = document.getElementById('regrasContador');
    const btn = document.getElementById('btnGerarContrato');
    if (!contador || !btn) return;
    const n = regrasSelecionadas.length;
    contador.textContent = `${n} de ${MAX_REGRAS} selecionadas (mínimo ${MIN_REGRAS})`;
    btn.disabled = n < MIN_REGRAS;
    document.querySelectorAll('.rule-card').forEach(c => {
        const isSel = regrasSelecionadas.includes(c.dataset.id);
        c.classList.toggle('disabled', !isSel && n >= MAX_REGRAS);
    });
}

function gerarContratoPersonalizado(idsEscolhidos) {
    const lista = document.getElementById('contractArticlesList');
    if (!lista) return;
    lista.innerHTML = '';
    idsEscolhidos.forEach((id, i) => {
        const regra = OPCOES_REGRAS_CONTRATO.find(o => o.id === id);
        if (!regra) return;
        const li = document.createElement('li');
        li.innerHTML = `<strong>Art. ${i + 1}º.</strong> ${regra.artigo}`;
        lista.appendChild(li);
    });
    document.getElementById('regrasSelecaoWrap').classList.add('d-none');
    const contratoWrap = document.getElementById('contratoWrap');
    contratoWrap.classList.remove('d-none');
    celebrarMomento(1.3);
    setTimeout(() => contratoWrap.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
}

async function prepararContrato() {
    renderRulesGrid();
    let salvo = null;
    try { salvo = JSON.parse(await obterConfiguracao('aurora_regras_contrato') || 'null'); } catch (e) { salvo = null; }

    if (Array.isArray(salvo) && salvo.length >= MIN_REGRAS) {
        regrasSelecionadas = salvo.slice(0, MAX_REGRAS);
        document.querySelectorAll('.rule-card').forEach(c => { if (regrasSelecionadas.includes(c.dataset.id)) c.classList.add('selecionada'); });
        atualizarEstadoSelecaoRegras();
        gerarContratoPersonalizado(regrasSelecionadas);

        // Se o contrato já tinha sido "fechado" (enrolado) numa visita
        // anterior, pula direto pro estado selado, sem reproduzir a
        // animação de novo nem mostrar o papel aberto antes do selo.
        const fechado = await obterConfiguracao('aurora_contrato_fechado');
        if (fechado === '1') mostrarContratoSelado(true);
    }
}

/* ---------------- "Fechar contrato": enrola o papel como um pergaminho ---------------- */
function mostrarContratoSelado(semAnimacao = false) {
    const wrap = document.getElementById('contratoWrap');
    const selado = document.getElementById('contratoSeladoWrap');
    if (!wrap || !selado) return;
    wrap.classList.add('d-none');
    wrap.classList.remove('contrato-fechando');
    const papel = wrap.querySelector('.contract-paper');
    if (papel) papel.classList.remove('contrato-enrolando');
    selado.classList.remove('d-none');
    if (!semAnimacao) setTimeout(() => selado.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
}

function iniciarFechamentoContrato() {
    const btnFechar = document.getElementById('btnFecharContrato');
    const btnReabrir = document.getElementById('btnReabrirContrato');
    const wrap = document.getElementById('contratoWrap');
    const papel = wrap ? wrap.querySelector('.contract-paper') : null;
    const selado = document.getElementById('contratoSeladoWrap');
    if (!btnFechar || !wrap || !papel || !selado) return;

    btnFechar.addEventListener('click', async () => {
        btnFechar.disabled = true;
        wrap.classList.add('contrato-fechando');
        papel.classList.add('contrato-enrolando'); // dispara a animação de "enrolar" (ver css/style.css)

        const finalizarFechamento = async () => {
            papel.removeEventListener('animationend', finalizarFechamento);
            await salvarConfiguracao('aurora_contrato_fechado', '1');
            mostrarContratoSelado();
            btnFechar.disabled = false;
        };
        papel.addEventListener('animationend', finalizarFechamento);
        // Rede de segurança: se por algum motivo o evento não disparar
        // (ex.: aba em segundo plano pausando a animação), finaliza mesmo
        // assim depois do tempo esperado da animação (1.15s no CSS).
        setTimeout(() => { if (wrap.classList.contains('contrato-fechando') && !wrap.classList.contains('d-none')) finalizarFechamento(); }, 1400);
    });

    if (btnReabrir) {
        btnReabrir.addEventListener('click', async () => {
            await salvarConfiguracao('aurora_contrato_fechado', '0');
            selado.classList.add('d-none');
            wrap.classList.remove('d-none', 'contrato-fechando');
            papel.classList.remove('contrato-enrolando');
            setTimeout(() => wrap.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        });
    }
}

/* ---------------- Cápsula do tempo ---------------- */
async function calcularDataDesbloqueioCapsula() {
    const dataPedidoIso = await obterConfiguracao('aurora_data_pedido');
    if (!dataPedidoIso) return null;
    const alvo = new Date(dataPedidoIso);
    alvo.setDate(alvo.getDate() + CAPSULA_DIAS_PARA_DESBLOQUEIO);
    return alvo;
}

async function prepararCapsulaDoTempo() {
    const wrap = document.getElementById('capsulaTempoWrap');
    if (!wrap) return;
    const dataAlvo = await calcularDataDesbloqueioCapsula();
    if (!dataAlvo) { wrap.classList.add('d-none'); return; }
    wrap.classList.remove('d-none');

    // Hora do servidor, não do aparelho — ver obterHoraConfiavel em
    // js/sync.js: evita que adiantar a data do celular abra a cápsula
    // antes da hora.
    const agora = await obterHoraConfiavel();
    const bloqueada = document.getElementById('capsulaBloqueada');
    const desbloqueada = document.getElementById('capsulaDesbloqueada');

    if (agora < dataAlvo) {
        bloqueada.classList.remove('d-none'); desbloqueada.classList.add('d-none');
        const diasRestantes = Math.max(1, Math.ceil((dataAlvo - agora) / 86400000));
        document.getElementById('capsulaContagem').textContent = diasRestantes === 1 ? 'falta 1 dia' : `faltam ${diasRestantes} dias`;
    } else {
        bloqueada.classList.add('d-none'); desbloqueada.classList.remove('d-none');
        iniciarEnvelopeCapsula();
    }
}

// Revela o texto da carta (e o vídeo, se houver) da cápsula do tempo.
// Reconfere a data de desbloqueio (com a hora do servidor) sempre que
// roda — mesmo chamada direto pelo console, não abre antes da hora.
// Limites dessa proteção: ver CONTEXTO-PROJETO.md.
async function iniciarEnvelopeCapsula() {
    const envelope = document.getElementById('capsulaEnvelope');
    const hint = document.getElementById('capsulaHint');
    const textoEl = document.getElementById('capsulaTexto');
    const assinaturaEl = document.getElementById('capsulaAssinatura');
    if (!envelope || envelope.dataset.iniciado === '1') return;

    // Ignora qualquer parâmetro externo e recalcula a data real (mesma
    // fonte de prepararCapsulaDoTempo) — nunca confia em valor recebido de fora.
    const dataAlvoReal = await calcularDataDesbloqueioCapsula();
    const agora = await obterHoraConfiavel();
    if (!dataAlvoReal || agora < dataAlvoReal) return; // recusa revelar — reconfirmação real, não decorativa

    envelope.dataset.iniciado = '1';

    textoEl.textContent = textoCapsulaDoTempo();
    assinaturaEl.textContent = `Com amor, ${NOME_DELE}.`;

    // Vídeo do YouTube (CAPSULA_YOUTUBE_ID, js/config.js) entra como opção
    // do abrirModoVela, junto do texto da carta.

    // Esta carta pode ser aberta e fechada várias vezes (diferente da carta
    // final): precisa voltar ao estado fechado sempre que o modo vela fechar.
    let emAnimacao = false;
    function fecharEnvelopeCapsula() {
        emAnimacao = false;
        envelope.classList.remove('aberto');
        hint.classList.remove('visivel');
        setTimeout(() => hint.classList.add('visivel'), 600);
    }

    envelope.addEventListener('click', () => {
        if (emAnimacao) return; emAnimacao = true;
        hint.classList.remove('visivel');
        envelope.classList.add('aberto');
        celebrarMomento(1.3);

        // Abre direto no modo "luz de vela" — nunca fica flutuando por cima da tela depois de fechada.
        setTimeout(() => {
            abrirModoVela('Um ano depois', textoEl.innerHTML, assinaturaEl.textContent, {
                aoFechar: fecharEnvelopeCapsula,
                videoYoutubeId: CAPSULA_YOUTUBE_ID ? extrairIdYoutube(CAPSULA_YOUTUBE_ID) : ''
            });
        }, 900);
    });

    requestAnimationFrame(() => { envelope.classList.add('envelope-visivel'); setTimeout(() => hint.classList.add('visivel'), 500); });
}

/* ---------------- Playlist do casal ---------------- */
let playlistIndiceAtual = 0;

function renderizarListaFaixasPlaylist() {
    const lista = document.getElementById('playlistTracklist');
    if (!lista) return;
    lista.innerHTML = '';
    PLAYLIST_FAIXAS.forEach((faixa, i) => {
        const item = document.createElement('div');
        item.className = 'playlist-track-item' + (i === playlistIndiceAtual ? ' ativa' : '');
        item.innerHTML = `<span><span class="pi-num">${String(i + 1).padStart(2, '0')}</span>${faixa.titulo}</span><i class="bi ${i === playlistIndiceAtual ? 'bi-soundwave' : 'bi-play-fill'}"></i>`;
        item.addEventListener('click', () => carregarFaixaPlaylist(i, true));
        lista.appendChild(item);
    });
}

function atualizarInfoFaixaAtualPlaylist() {
    const faixa = PLAYLIST_FAIXAS[playlistIndiceAtual];
    document.getElementById('playlistTitulo').textContent = faixa.titulo;
    document.getElementById('playlistArtista').textContent = faixa.artista;
    document.getElementById('playlistMotivo').textContent = faixa.motivo;
    renderizarListaFaixasPlaylist();
}

function atualizarBotaoPlayPausePlaylist(tocando) {
    const btn = document.getElementById('btnPlaylistPlayPause');
    if (!btn) return;
    btn.innerHTML = tocando ? '<i class="bi bi-pause-fill"></i>' : '<i class="bi bi-play-fill"></i>';
}

function carregarFaixaPlaylist(indice, autoplay) {
    playlistIndiceAtual = ((indice % PLAYLIST_FAIXAS.length) + PLAYLIST_FAIXAS.length) % PLAYLIST_FAIXAS.length;
    const audio = document.getElementById('playlistAudio');
    audio.src = getAsset(PLAYLIST_FAIXAS[playlistIndiceAtual].src);
    atualizarInfoFaixaAtualPlaylist();
    document.getElementById('playlistProgressoInner').style.width = '0%';
    document.getElementById('playlistTempoAtual').textContent = '0:00';
    document.getElementById('playlistTempoTotal').textContent = '0:00';

    if (autoplay) {
        const promessa = audio.play();
        if (promessa !== undefined) promessa.then(() => atualizarBotaoPlayPausePlaylist(true)).catch(() => atualizarBotaoPlayPausePlaylist(false));
    } else {
        atualizarBotaoPlayPausePlaylist(false);
    }
}

function togglePlaylistPlayPause() {
    const audio = document.getElementById('playlistAudio');
    if (!audio.src) { carregarFaixaPlaylist(playlistIndiceAtual, true); return; }
    if (audio.paused) {
        const promessa = audio.play();
        if (promessa !== undefined) promessa.then(() => atualizarBotaoPlayPausePlaylist(true)).catch(() => atualizarBotaoPlayPausePlaylist(false));
    } else { audio.pause(); atualizarBotaoPlayPausePlaylist(false); }
}

function playlistProximaFaixa() { carregarFaixaPlaylist(playlistIndiceAtual + 1, true); }
function playlistFaixaAnterior() { carregarFaixaPlaylist(playlistIndiceAtual - 1, true); }

function iniciarPlaylistDaGente() {
    const audio = document.getElementById('playlistAudio');
    if (!audio) return;
    if (audio.dataset.iniciado === '1') { atualizarInfoFaixaAtualPlaylist(); return; }
    audio.dataset.iniciado = '1';

    audio.addEventListener('timeupdate', () => {
        if (!isFinite(audio.duration) || audio.duration <= 0) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        document.getElementById('playlistProgressoInner').style.width = pct + '%';
        document.getElementById('playlistTempoAtual').textContent = formatarTempoPlaylist(audio.currentTime);
        document.getElementById('playlistTempoTotal').textContent = formatarTempoPlaylist(audio.duration);
    });
    audio.addEventListener('ended', playlistProximaFaixa);

    const barra = document.getElementById('playlistProgressoOuter');
    barra.addEventListener('click', (evt) => {
        if (!isFinite(audio.duration) || audio.duration <= 0) return;
        const rect = barra.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, (evt.clientX - rect.left) / rect.width));
        audio.currentTime = pct * audio.duration;
    });

    document.getElementById('btnPlaylistPlayPause').addEventListener('click', togglePlaylistPlayPause);
    document.getElementById('btnPlaylistProxima').addEventListener('click', playlistProximaFaixa);
    document.getElementById('btnPlaylistAnterior').addEventListener('click', playlistFaixaAnterior);

    carregarFaixaPlaylist(0, false);
}

/* ---------------- Lembranças (prints de conversas antigas) ---------------- */
let lembrancasBlobUrls = [];
async function adicionarLembrancas(fileList) {
    const arquivos = Array.from(fileList || []).filter(f => f.type && f.type.startsWith('image/'));
    if (!arquivos.length) return;

    for (const file of arquivos) {
        const id = gerarIdUnico('lembranca');
        // Comprime antes de salvar: fotos de celular hoje em dia costumam vir
        // com vários MB, e isso soma rápido quando são várias lembranças —
        // corta bastante o tamanho sem perda visível na tela do celular.
        const { blob, mimeType } = await comprimirImagem(file);
        await salvarMedia({ id, tipo: 'lembranca', blob, mimeType });
    }
    renderizarLembrancas();
}

async function renderizarLembrancas() {
    const grid = document.getElementById('lembrancasGrid');
    const vazio = document.getElementById('lembrancasVazio');
    if (!grid) return;

    lembrancasBlobUrls.forEach(url => URL.revokeObjectURL(url));
    lembrancasBlobUrls = [];
    const lista = (await obterMediaPorTipo('lembranca')).sort((a, b) => a.criadoEm - b.criadoEm);
    grid.innerHTML = '';
    if (!lista.length) { vazio.classList.remove('d-none'); return; }
    vazio.classList.add('d-none');

    lista.forEach(item => {
        const url = URL.createObjectURL(item.blob);
        lembrancasBlobUrls.push(url);
        const wrapper = document.createElement('div');
        wrapper.className = 'lembranca-item-wrap';

        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'lembranca-item';
        botao.innerHTML = `<img src="${url}" alt="Print de uma conversa antiga">`;

        const btnExcluir = document.createElement('button');
        btnExcluir.type = 'button';
        btnExcluir.className = 'lembranca-item-excluir';
        btnExcluir.setAttribute('aria-label', 'Remover esta foto');
        btnExcluir.innerHTML = '<i class="bi bi-trash3-fill"></i>';
        btnExcluir.addEventListener('click', async (evt) => {
            evt.stopPropagation(); // não abre o lightbox ao clicar no "x"
            if (!confirm('Remover esta foto das lembranças? Essa ação não pode ser desfeita, e também remove ela do outro aparelho na próxima sincronização.')) return;
            btnExcluir.disabled = true;
            const ok = await excluirMedia(item.id); // já marca a atualização local e agenda o envio pra nuvem
            if (ok) {
                renderizarLembrancas();
            } else {
                btnExcluir.disabled = false;
                alert('Não consegui remover essa foto agora. Tenta de novo em instantes.');
            }
        });

        wrapper.appendChild(botao);
        wrapper.appendChild(btnExcluir);
        grid.appendChild(wrapper);
    });

    const urlsLembrancas = Array.from(grid.querySelectorAll('img')).map(img => img.src);
    grid.querySelectorAll('.lembranca-item').forEach((botao, i) => botao.addEventListener('click', () => abrirLightboxGaleria(urlsLembrancas, i)));
}

/* ---------------- Lightbox reutilizável ---------------- */
let lightboxItensAtuais = [];
let lightboxIndiceAtual = 0;
let lightboxLegendasAtuais = null;

// Trava de scroll (bloquearScrollFundoLembranca/desbloquearScrollFundoLembranca)
// agora mora em utils.js — é usada por praticamente todos os modais do site,
// não só pelo lightbox, então precisa estar disponível em qualquer página que
// carregue utils.js (index.html, galeria.html, checklist.html, diagnostico.html).

function abrirLightboxGaleria(itens, indiceInicial, legendas) {
    if (!itens || !itens.length) return;
    lightboxItensAtuais = itens;
    lightboxLegendasAtuais = Array.isArray(legendas) ? legendas : null;
    lightboxIndiceAtual = indiceInicial || 0;
    atualizarImagemLightbox();
    bloquearScrollFundoLembranca();
    document.getElementById('lembrancaLightbox').classList.remove('d-none');
}

function atualizarImagemLightbox() {
    document.getElementById('lembrancaLightboxImg').src = lightboxItensAtuais[lightboxIndiceAtual];
    const mostrarNav = lightboxItensAtuais.length > 1;
    document.getElementById('btnLightboxAnterior').classList.toggle('d-none', !mostrarNav);
    document.getElementById('btnLightboxProxima').classList.toggle('d-none', !mostrarNav);

    const legendaEl = document.getElementById('lembrancaLightboxLegenda');
    const legenda = lightboxLegendasAtuais ? lightboxLegendasAtuais[lightboxIndiceAtual] : '';
    if (legendaEl) {
        legendaEl.textContent = legenda || '';
        legendaEl.classList.toggle('d-none', !legenda);
    }
}

function lightboxFotoAnterior() { lightboxIndiceAtual = (lightboxIndiceAtual - 1 + lightboxItensAtuais.length) % lightboxItensAtuais.length; atualizarImagemLightbox(); }
function lightboxProximaFoto() { lightboxIndiceAtual = (lightboxIndiceAtual + 1) % lightboxItensAtuais.length; atualizarImagemLightbox(); }
function fecharLembrancaAmpliada() {
    document.getElementById('lembrancaLightbox').classList.add('d-none');
    document.getElementById('lembrancaLightboxImg').src = '';
    lightboxItensAtuais = [];
    lightboxLegendasAtuais = null;
    desbloquearScrollFundoLembranca();
    // Mesma correção do "espaço vazio/roxo no fim da tela" (ver
    // forcarRecalculoDeLayout() em js/utils.js): fechar o lightbox tira o
    // body do position:fixed do scroll-lock, e sem forçar esse reflow o
    // navegador às vezes mantém a altura antiga calculada, sobrando uma
    // faixa vazia com a cor de fundo escura até um F5 manual.
    forcarRecalculoDeLayout();
}

/* ---------------- Navegação para "Nossa História" ---------------- */
function pausarMusicaFundoImediatamente() {
    const audio = document.getElementById('musicaFundo');
    if (audio && !audio.paused) audio.pause();
}

/**
 * Tela de carregamento discreta de "Nossa História" — mostrada assim que a
 * página começa a montar (vídeo do pedido, assinatura, timeline, cápsula do
 * tempo, lembranças, mensagens pro futuro etc. — várias leituras no
 * IndexedDB) e escondida assim que tudo estiver pronto.
 */
// Frases que revezam na tela de carregamento de "Nossa História" (ver
// mostrarLoadingRomance/esconderLoadingRomance abaixo), só pra dar mais
// vida à espera — sem custar nada tecnicamente, já que o progresso real
// continua vindo da barra (ver executarComBarraDeProgresso).
const HISTORIA_LOADING_FRASES = [
    'preparando nossa história...',
    'juntando as estrelas...',
    'contando os dias...'
];
let __historiaLoadingIntervalo = null;

function mostrarLoadingRomance() {
    const overlay = document.getElementById('romanceLoadingOverlay');
    const barra = document.getElementById('romanceLoadingBarra');
    const textoEl = document.getElementById('romanceLoadingTexto');
    if (barra) barra.style.width = '6%';
    if (overlay) { overlay.style.opacity = '1'; overlay.classList.remove('d-none'); }
    bloquearScrollFundoLembranca(); // mesma trava usada no lightbox — consistente em todo o site

    if (textoEl) {
        let indice = 0;
        textoEl.textContent = HISTORIA_LOADING_FRASES[0];
        if (__historiaLoadingIntervalo) clearInterval(__historiaLoadingIntervalo);
        __historiaLoadingIntervalo = setInterval(() => {
            indice = (indice + 1) % HISTORIA_LOADING_FRASES.length;
            textoEl.textContent = HISTORIA_LOADING_FRASES[indice];
        }, 1400);
    }
}

function esconderLoadingRomance() {
    const overlay = document.getElementById('romanceLoadingOverlay');
    desbloquearScrollFundoLembranca();
    if (__historiaLoadingIntervalo) { clearInterval(__historiaLoadingIntervalo); __historiaLoadingIntervalo = null; }
    if (!overlay) return;
    overlay.style.opacity = '0';
    setTimeout(() => overlay.classList.add('d-none'), 300);
}

/* ---------------- Botão flutuante: navegar entre seções de "Nossa
 * História" ----------------
 * Mesmo padrão visual/estrutural do botão flutuante da checklist (ver
 * .historia-nav-flutuante em css/style.css, clonado de
 * .checklist-nav-flutuante, e iniciarNavegacaoCategoriasChecklist em
 * js/checklist.js), só que pulando entre os grandes blocos fixos da
 * página (timeline, quiz, bichos, mapa, playlist, cápsula, previsões,
 * mensagem pro futuro, mural) em vez de categorias de uma lista
 * dinâmica. Chamado uma vez só, depois que a página termina de montar
 * (ver goToRomancePage). Alguns alvos (cápsula, previsões) só existem
 * de fato quando desbloqueados — o filtro abaixo garante que o menu só
 * lista o que existe na página nesse momento. */
const HISTORIA_SECOES_NAV = [
    { id: 'secaoAniversariosHistoria', emoji: '🎂', nome: 'Seus aniversários' },
    { id: 'secaoPrimeirasVezesHistoria', emoji: '✨', nome: 'Nossas primeiras vezes' },
    { id: 'secaoTimelineHistoria', emoji: '🌌', nome: 'Nossa linha do tempo' },
    { id: 'secaoMomentosHistoria', emoji: '🖼️', nome: 'Nossos momentos' },
    { id: 'quizWrap', emoji: '❓', nome: 'Quiz do casal' },
    { id: 'secaoBichosHistoria', emoji: '🐾', nome: 'Seus bichos' },
    { id: 'secaoMapaHistoria', emoji: '🗺️', nome: 'Nosso mapa' },
    { id: 'secaoPlaylistHistoria', emoji: '🎵', nome: 'Nossa playlist' },
    { id: 'capsulaTempoWrap', emoji: '⏳', nome: 'Cápsula do tempo' },
    { id: 'previsoesWrap', emoji: '🔮', nome: 'Quadro de previsões' },
    { id: 'secaoMensagemFuturoHistoria', emoji: '💌', nome: 'Mensagem pro futuro' },
    { id: 'secaoMuralHistoria', emoji: '📓', nome: 'Seu mural' }
];

function iniciarNavegacaoSecoesHistoria() {
    const wrap = document.getElementById('historiaNavFlutuante');
    const botao = document.getElementById('btnHistoriaNavToggle');
    const menu = document.getElementById('historiaNavMenu');
    if (!wrap || !botao || !menu) return;

    const itensDisponiveis = HISTORIA_SECOES_NAV.filter(item => document.getElementById(item.id));
    menu.innerHTML = itensDisponiveis.map(item => `
        <button type="button" class="historia-nav-item" data-ir-para-secao="${item.id}">
            <span class="historia-nav-item-emoji">${item.emoji}</span>${item.nome}
        </button>
    `).join('') + `
        <button type="button" class="historia-nav-item" data-ir-para-checklist="1">
            <span class="historia-nav-item-emoji">✅</span>Nosso checklist
        </button>
    `;

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

    menu.querySelectorAll('[data-ir-para-secao]').forEach(item => {
        item.addEventListener('click', () => {
            const secao = document.getElementById(item.getAttribute('data-ir-para-secao'));
            fechar();
            if (!secao) return;
            const topoComFolga = secao.getBoundingClientRect().top + window.scrollY - 24;
            window.scrollTo({ top: topoComFolga, behavior: 'smooth' });
        });
    });

    const btnChecklist = menu.querySelector('[data-ir-para-checklist]');
    if (btnChecklist) btnChecklist.addEventListener('click', () => { window.location.href = 'checklist.html'; });

    // Clicar fora fecha o menu; ESC também, pra quem usa teclado/leitor de tela.
    document.addEventListener('click', (evt) => { if (!wrap.contains(evt.target)) fechar(); });
    document.addEventListener('keydown', (evt) => { if (evt.key === 'Escape') fechar(); });

    wrap.classList.remove('d-none');
}

/* ---------------- Barrinha fina de progresso de scroll (topo) ----------------
 * Um traço dourado que enche conforme a pessoa rola "Nossa História" —
 * só pra dar noção de quanto falta da página, sem números nem texto.
 * Atualiza no scroll e no resize (a altura da página muda bastante
 * conforme seções condicionais aparecem/somem — cápsula, previsões
 * etc.). Chamado uma vez só, junto com iniciarNavegacaoSecoesHistoria. */
function iniciarBarraProgressoScrollHistoria() {
    const barra = document.getElementById('historiaProgressoScrollBarra');
    const wrap = document.getElementById('historiaProgressoScroll');
    if (!barra || !wrap) return;

    const atualizar = () => {
        const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
        const percentual = alturaTotal > 0 ? Math.min(100, Math.max(0, (window.scrollY / alturaTotal) * 100)) : 0;
        barra.style.width = `${percentual}%`;
    };

    window.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);
    wrap.classList.remove('d-none');
    atualizar();
}

/**
 * Roda várias tarefas (promises) em PARALELO e avança a barra conforme cada
 * uma termina — dá um retrato real do progresso, em vez de uma barra
 * "fake" que só finge andar. Uma falha isolada não trava as demais.
 */
async function executarComBarraDeProgresso(tarefas) {
    const barra = document.getElementById('romanceLoadingBarra');
    const total = tarefas.length || 1;
    let concluidas = 0;
    if (typeof atualizarProgressoEntrada === 'function') atualizarProgressoEntrada('Preparando nossa história', 0, total);
    const marcarProgresso = () => {
        concluidas++;
        if (barra) barra.style.width = `${Math.max(6, Math.round((concluidas / total) * 100))}%`;
        if (typeof atualizarProgressoEntrada === 'function') atualizarProgressoEntrada('Preparando nossa história', concluidas, total);
    };
    await Promise.all(tarefas.map(tarefa =>
        Promise.resolve(tarefa)
            .then(marcarProgresso)
            .catch(err => { console.error('Falha ao carregar um item de Nossa História:', err); marcarProgresso(); })
    ));
}

/**
 * Mostra o vídeo do momento (gravação do pedido, "O momento em que você
 * descobriu"): usa o vídeo local salvo no IndexedDB se ele existir e abrir
 * de verdade neste navegador; senão, cai automaticamente para o backup no
 * YouTube (VIDEO_MOMENTO_YOUTUBE_BACKUP_URL, js/config.js), trocando o
 * <video> por um player embutido discreto, na mesma moldura/tamanho, sem
 * chamar atenção pra troca. Se não houver nem vídeo local nem backup
 * configurado, a seção simplesmente continua escondida, como sempre foi.
 */
async function garantirBackupDeVideoDisponivel() {
    const wrap = document.getElementById('romanceVideoWrap');
    const elVideo = document.getElementById('romanceVideo');
    const btnBaixar = document.getElementById('btnBaixarVideoPedido');
    if (!wrap || !elVideo) return;

    let video = null;
    try { video = await obterMedia('video_pedido'); } catch (e) { console.error('Falha ao ler o vídeo do pedido salvo:', e); }

    let localUtilizavel = false;
    if (video && video.blob && video.blob.size > 0) {
        try { localUtilizavel = await testarVideoReproduzivel(video.blob); } catch (e) { localUtilizavel = false; }
    }

    if (localUtilizavel) {
        const url = atribuirObjectURLGerenciado(elVideo, video.blob);
        wrap.classList.remove('d-none');
        if (btnBaixar) { btnBaixar.href = url; btnBaixar.classList.remove('d-none'); } // mesmo blob já carregado — download não refaz nenhuma leitura
        return;
    }

    // Vídeo local ausente, corrompido ou perdido — cai pro backup do
    // YouTube, se estiver configurado.
    const urlBackup = (typeof VIDEO_MOMENTO_YOUTUBE_BACKUP_URL !== 'undefined') ? VIDEO_MOMENTO_YOUTUBE_BACKUP_URL : '';
    const idBackup = urlBackup ? extrairIdYoutube(urlBackup) : '';
    if (!idBackup) return; // nada disponível — mantém a seção escondida, sem quebrar nada

    const vertical = typeof VIDEO_MOMENTO_YOUTUBE_BACKUP_VERTICAL === 'undefined' || !!VIDEO_MOMENTO_YOUTUBE_BACKUP_VERTICAL;
    const aspecto = vertical ? '9 / 16' : '16 / 9';
    // Substitui o <video> por um <div>/<iframe> com o mesmo id, mesma
    // moldura (borda rosegold, cantos arredondados) e mesma proporção —
    // pra ela ver praticamente a mesma coisa, só que vindo do YouTube.
    elVideo.outerHTML = `<div id="romanceVideo" style="position:relative;width:100%;aspect-ratio:${aspecto};border-radius:12px;border:3px solid var(--rosegold);overflow:hidden;background:#000;"><iframe src="https://www.youtube.com/embed/${idBackup}?rel=0&modestbranding=1&playsinline=1" title="O momento em que você descobriu" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    if (btnBaixar) btnBaixar.classList.add('d-none'); // baixar não se aplica ao player embutido do YouTube
    wrap.classList.remove('d-none');
}

async function goToRomancePage(primeiraVez) {
    document.getElementById('lojaScreen').style.display = 'none';
    document.getElementById('checkoutScreen').style.display = 'none';
    document.getElementById('suspenseOverlay').style.display = 'none';
    document.getElementById('processingOverlay').style.display = 'none';
    try { if (typeof resetarTelasSuspenseParaProximaRevisao === 'function') resetarTelasSuspenseParaProximaRevisao(); } catch (e) { /* não crítico, só deixa a próxima revisão da lojinha começar do zero */ }

    // Se a página estava em modo "rever a lojinha" (ver abrirLojaSomenteVisualizacao
    // logo abaixo), desliga tudo que é exclusivo desse modo ao voltar pra
    // "Nossa História" — cobre tanto quem terminou a revivida inteira
    // (carta final) quanto qualquer outro jeito de chegar aqui.
    if (typeof modoVisualizacaoLojaAtiva !== 'undefined' && modoVisualizacaoLojaAtiva) {
        modoVisualizacaoLojaAtiva = false;
        trocarNomeLojaParaVisualizacao(false);
        document.getElementById('modoVisualizacaoBarra').classList.add('d-none');
        document.body.classList.remove('modo-visualizacao-ativo');
    }

    document.getElementById('romancePage').style.display = 'block';
    definirFundoBody(CORES_FUNDO.escuro);
    
    const romancePage = document.getElementById('romancePage');
    romancePage.scrollTop = 0;      // <-- adicione aqui
    
    // Reavalia o indicador "os dois online agora" (js/presenca.js) agora
    // que chegamos em "Nossa História" — ele fica sempre escondido nas
    // telas anteriores, mesmo que os dois já estivessem conectados.
    try { if (typeof refrescarIndicadorPresenca === 'function') refrescarIndicadorPresenca(); } catch (e) { /* indicador é só um extra, nunca deve travar a navegação */ }

    // Recado(s) deixado(s) esperando enquanto este aparelho estava
    // offline (ver verificarRecadosPendentes em js/presenca.js) — busca
    // e mostra em segundo plano, sem atrasar o resto do carregamento.
    try { if (typeof verificarRecadosPendentes === 'function') verificarRecadosPendentes(); } catch (e) { console.error('Falha ao checar recados pendentes (não deve afetar o resto da página):', e); }

    window.scrollTo(0, 0);
    mostrarLoadingRomance();

    document.getElementById('heroSubRomanceTexto').textContent = TEXTOS.heroSubRomance;
    document.getElementById('encerramentoRomanceTexto').textContent = TEXTOS.encerramentoRomance;

    // Só corta a música de fundo se não for a primeira vez (na primeira,
    // vindo direto do pedido, ela continua tocando naturalmente).
    try { if (!primeiraVez) pausarMusicaFundoImediatamente(); } catch (e) { console.error('Falha ao pausar música de fundo:', e); }
    try { iniciarPlaylistDaGente(); } catch (e) { console.error('Falha ao iniciar playlist (não deve afetar o resto da página):', e); }

    try { ativarContadorEasterEggsFaseFinal(); } catch (e) { console.error('Falha ao ativar contador de easter eggs:', e); } // só a partir daqui o contador de girassóis pode aparecer

    // Rápidas e sem leitura pesada no banco — chamadas direto, sem entrar na barra de progresso.
    // Cada uma é independente das outras (timeline/estrelas, bichos, mapa
    // etc.), então cada chamada roda isolada em try/catch: se uma falhar
    // por causa de alguma diferença de navegador (ex.: algo que só o
    // Safari aceita e o Chrome rejeita), as seguintes continuam rodando
    // normalmente em vez de tudo parar silenciosamente no meio — foi
    // exatamente esse tipo de trava em cadeia que fazia seções inteiras
    // (como a animação das estrelas) sumirem só fora do iPhone.
    const rodarIsolado = (fn, nome) => { try { fn(); } catch (e) { console.error(`Falha ao iniciar "${nome}" (não deve afetar o resto da página):`, e); } };
    rodarIsolado(iniciarQuiz, 'quiz');
    rodarIsolado(renderizarTimeline, 'timeline/estrelas');
    rodarIsolado(() => renderizarRegistroAnualAniversarios().catch(e => console.error('Falha ao montar registro anual de aniversários:', e)), 'registro anual de aniversários');
    rodarIsolado(() => { if (typeof iniciarPrimeirasVezes === 'function') iniciarPrimeirasVezes(); }, 'nossas primeiras vezes');
    rodarIsolado(iniciarFechamentoEstrelaModal, 'fechamento do modal da estrela');
    rodarIsolado(exibirEasterEggSobrenome, 'easter egg do sobrenome');
    rodarIsolado(renderizarCoisasQueElaAma, 'coisas que ela ama');
    rodarIsolado(renderizarSeusBichos, 'seus bichos');
    rodarIsolado(renderizarMapaDaRelacao, 'mapa da relação');
    iniciarMapaModal();
    iniciarCartaDiscussao();
    iniciarAdjetivosParaEla();
    rodarIsolado(iniciarModoSilencioso, 'modo silencioso para brigas');
    rodarIsolado(iniciarMural, 'mural da Ana');

    if (typeof VIDEO_PROCESSO_YOUTUBE_URL !== 'undefined' && VIDEO_PROCESSO_YOUTUBE_URL) {
        const iframeProcesso = document.getElementById('videoProcessoIframe');
        const wrapProcesso = document.getElementById('videoProcessoWrap');
        const idProcesso = extrairIdYoutube(VIDEO_PROCESSO_YOUTUBE_URL);
        if (iframeProcesso && wrapProcesso && idProcesso) {
            iframeProcesso.src = `https://www.youtube.com/embed/${idProcesso}?rel=0&modestbranding=1`;
            wrapProcesso.classList.remove('d-none');
            // Vídeo vertical (ver VIDEO_PROCESSO_VERTICAL em js/config.js):
            // troca a caixa de 16:9 para 9:16, senão o vídeo fica pequeno
            // com barras pretas grandes nas laterais.
            const caixaProcesso = iframeProcesso.closest('.galeria-youtube-wrap');
            if (caixaProcesso) caixaProcesso.classList.toggle('vertical', typeof VIDEO_PROCESSO_VERTICAL !== 'undefined' && !!VIDEO_PROCESSO_VERTICAL);
        }
    }

    /* As leituras no IndexedDB abaixo rodam em paralelo (Promise.all): o
     * tempo total passa a ser o da mais lenta (normalmente o vídeo do
     * pedido), não a soma de todas. */
    const tarefas = [
        prepararContrato(),
        iniciarContadorVivo(),
        renderizarLembrancas(),
        renderizarMensagensFuturo(),
        prepararCapsulaDoTempo(),
        verificarEspecialAniversario(),
        verificarMarcoRelacionamento(),
        iniciarMomentoLento(),
        iniciarGaleriaMomentos(), // agora varre a galeria de verdade pra sortear fotos, então entra aqui e não mais na lista "rápida" abaixo
        prepararQuadroPrevisoes(),
        renderizarTermometroDoDia(),
        renderizarCartasCondicionais(),

        obterConfiguracao('aurora_data_pedido').then(dataPedidoIso => {
            if (!dataPedidoIso) return;
            const local = (typeof LOCAL_PEDIDO_OFICIAL !== 'undefined' && LOCAL_PEDIDO_OFICIAL) ? LOCAL_PEDIDO_OFICIAL : 'Brooks Franca';
            document.getElementById('dataPedidoTexto').textContent = `Nosso pedido: ${formatarDataPedidoComHora(dataPedidoIso)} - ${local}`;
            const elTimeline = document.getElementById('dataPedidoTimeline');
            if (elTimeline) elTimeline.textContent = formatarDataPedido(dataPedidoIso);

            const dias = Math.max(0, Math.floor((Date.now() - new Date(dataPedidoIso).getTime()) / 86400000));
            document.getElementById('counterText').textContent = dias === 0 ? 'hoje é o nosso primeiro dia' : `${dias} dia${dias === 1 ? '' : 's'} desde que topamos essa juntos`;

            const localData = document.getElementById('contratoLocalData');
            if (localData) localData.textContent = `Sales Oliveira - SP, ${formatarDataPedido(dataPedidoIso)}.`;
        }),

        garantirBackupDeVideoDisponivel(),

        obterMedia('assinatura').then(assinatura => {
            if (assinatura && assinatura.texto) {
                document.getElementById('romanceSignatureImg').src = assinatura.texto;
                document.getElementById('contratoSignatureImg').src = assinatura.texto;
                document.getElementById('romanceSignatureWrap').classList.remove('d-none');
            }
        }),

        renderizarResumoChecklist()
    ];

    await executarComBarraDeProgresso(tarefas);
    esconderLoadingRomance();
    rodarIsolado(iniciarNavegacaoSecoesHistoria, 'navegação flutuante entre seções');
    rodarIsolado(iniciarBarraProgressoScrollHistoria, 'barra de progresso de scroll');

    // Mesma correção do "espaço vazio/roxo no fim da tela" (ver
    // forcarRecalculoDeLayout() em js/utils.js): essa é a maior troca de
    // tela do site (loja/checkout/suspense -> romancePage, os únicos dois
    // elementos que realmente definem a altura do documento), tanto na
    // primeira vez (logo depois do flashback) quanto ao reabrir o link já
    // no estágio final. Sem esse reflow forçado aqui, o mesmo tipo de
    // faixa vazia podia aparecer bem na entrada de "Nossa História".
    forcarRecalculoDeLayout();
}

/* ----------------------------------------------------------------------
   PROTEÇÃO POR SENHA DA ÁREA DE MEMÓRIAS (item 8 do prompt)
   ----------------------------------------------------------------------
   Implementada por último, depois de todas as outras correções e
   melhorias terem sido concluídas e testadas (ver README.md).
   Fluxo: no primeiro acesso (pedido ainda não concluído) a experiência
   acontece normalmente, sem nenhuma senha. A partir do momento em que o
   pedido é concluído ('aurora_stage' === 'final'), toda vez que o link
   for aberto de novo, pedimos a senha antes de exibir "Nossa História"
   (ver o gate em js/main.js). Uma vez digitada corretamente, a sessão
   (esta aba) fica desbloqueada — reabrir o navegador pede de novo.
   ---------------------------------------------------------------------- */
function memoriasJaDesbloqueadasNestaSessao() {
    try { return sessionStorage.getItem('aurora_memorias_desbloqueadas') === '1'; } catch (e) { return false; }
}

/**
 * Exibe o gate de senha e só resolve a Promise quando a senha certa for
 * digitada (ou já tiver sido desbloqueada nesta sessão/aba).
 */
function solicitarSenhaMemorias() {
    return new Promise((resolve) => {
        if (memoriasJaDesbloqueadasNestaSessao()) { resolve(); return; }

        const overlay = document.getElementById('senhaMemoriasOverlay');
        const input = document.getElementById('senhaMemoriasInput');
        const erro = document.getElementById('senhaMemoriasErro');
        if (!overlay || !input) { resolve(); return; } // defensivo: se o HTML não existir, não bloqueia a experiência

        overlay.classList.remove('d-none');
        erro.classList.add('d-none');
        input.value = '';
        bloquearScrollFundoLembranca();
        setTimeout(() => input.focus(), 300);

        async function tentarDesbloquear() {
            const senhaDigitada = (input.value || '').trim();
            if (await verificarSenhaHash(senhaDigitada, SENHA_AREA_MEMORIAS_HASH)) {
                try { sessionStorage.setItem('aurora_memorias_desbloqueadas', '1'); } catch (e) { /* ignora */ }
                overlay.classList.add('d-none');
                desbloquearScrollFundoLembranca();
                resolve();
            } else {
                erro.classList.remove('d-none');
                input.value = '';
                input.focus();
                overlay.querySelector('.senha-memorias-box').classList.remove('senha-shake');
                void overlay.offsetWidth; // força reflow para reiniciar a animação de "errado"
                overlay.querySelector('.senha-memorias-box').classList.add('senha-shake');
            }
        }

        document.getElementById('btnSenhaMemoriasEntrar').onclick = tentarDesbloquear;
        input.onkeydown = (evt) => { if (evt.key === 'Enter') tentarDesbloquear(); };
    });
}

/* ---------------- "Um instante em câmera lenta" ---------------- */
async function iniciarMomentoLento() {
    const wrap = document.getElementById('momentoLentoWrap');
    const video = document.getElementById('momentoLentoVideo');
    const fraseEl = document.getElementById('momentoLentoFrase');
    if (!wrap || !video) return;

    const caminho = await resolverVideoPorBase(MOMENTO_LENTO_ARQUIVO_BASE);
    if (!caminho) return; // vídeo ainda não foi colocado na pasta — seção continua escondida (d-none), sem quebrar nada

    video.src = caminho;
    video.playbackRate = MOMENTO_LENTO_VELOCIDADE;
    video.addEventListener('loadedmetadata', () => { video.playbackRate = MOMENTO_LENTO_VELOCIDADE; }); // alguns navegadores resetam a velocidade ao trocar de src
    video.play().catch(() => { /* autoplay mudo costuma ser permitido, mas por segurança não travamos nada se falhar */ });
    wrap.classList.remove('d-none');

    if (Array.isArray(MOMENTO_LENTO_FRASES) && MOMENTO_LENTO_FRASES.length) {
        let indice = 0;
        const TEMPO_POR_FRASE_MS = 4200;
        const mostrarFrase = () => {
            fraseEl.classList.remove('visivel');
            setTimeout(() => {
                fraseEl.textContent = MOMENTO_LENTO_FRASES[indice % MOMENTO_LENTO_FRASES.length];
                fraseEl.classList.add('visivel');
                indice++;
            }, 350);
        };
        mostrarFrase();
        setInterval(mostrarFrase, TEMPO_POR_FRASE_MS);
    }
}

/* ---------------- Registro anual dos aniversários ---------------- */
async function renderizarRegistroAnualAniversarios() {
    const lista = document.getElementById('registroAniversariosLista');
    const secao = document.getElementById('secaoAniversariosHistoria');
    if (!lista || !secao) return;

    const registros = Array.isArray(REGISTRO_ANUAL_ANIVERSARIOS)
        ? REGISTRO_ANUAL_ANIVERSARIOS.slice().sort((a, b) => Number(b.ano) - Number(a.ano))
        : [];
    secao.classList.toggle('d-none', registros.length === 0);
    lista.innerHTML = '';

    for (const registro of registros) {
        const card = document.createElement('article');
        card.className = 'registro-aniversario-card';

        const fotoWrap = document.createElement('div');
        fotoWrap.className = 'registro-aniversario-foto-wrap';
        const foto = document.createElement('img');
        foto.className = 'registro-aniversario-foto';
        foto.alt = `Aniversário de ${registro.ano || ''}`;
        foto.src = await resolverFotoPlaceholderOuAsset(registro.foto);
        const ano = document.createElement('span');
        ano.className = 'registro-aniversario-ano';
        ano.textContent = registro.ano || '';
        fotoWrap.append(foto, ano);

        const conteudo = document.createElement('div');
        conteudo.className = 'registro-aniversario-conteudo';
        const data = document.createElement('p');
        data.className = 'registro-aniversario-data';
        data.textContent = registro.data || `8 de agosto de ${registro.ano || ''}`;
        const titulo = document.createElement('h3');
        titulo.className = 'registro-aniversario-titulo';
        titulo.textContent = registro.titulo || 'Mais um aniversário juntos';
        const texto = document.createElement('p');
        texto.className = 'registro-aniversario-texto';
        texto.textContent = registro.texto || '';
        conteudo.append(data, titulo, texto);

        card.append(fotoWrap, conteudo);
        lista.appendChild(card);
    }
}

/* ---------------- Especial de 8 de agosto (aniversário) ---------------- */
async function verificarEspecialAniversario() {
    const bloco = document.getElementById('aniversarioBloco');
    if (!bloco) return;

    // Hora do servidor (mesma fonte usada na cápsula do tempo, ver
    // obterHoraConfiavel em js/sync.js) — assim, mudar a data do celular
    // não faz esse bloco aparecer fora do dia certo.
    const agora = await obterHoraConfiavel();
    const ehHoje = agora.getDate() === ANIVERSARIO_DIA && (agora.getMonth() + 1) === ANIVERSARIO_MES;
    if (!ehHoje) return;

    document.getElementById('aniversarioTexto').textContent = textoAniversario();
    bloco.classList.remove('d-none');

    // Vídeo especial do aniversário — some sozinho se o arquivo ainda não
    // existir em assets/video/ (mesmo padrão do "momento em câmera lenta").
    const videoWrap = document.getElementById('aniversarioVideoWrap');
    const video = document.getElementById('aniversarioVideo');
    if (videoWrap && video) {
        const caminhoVideo = await resolverVideoPorBase(ANIVERSARIO_VIDEO_ARQUIVO_BASE);
        if (caminhoVideo) {
            video.src = caminhoVideo;
            videoWrap.classList.remove('d-none');
        }
    }

    // Música especial do aniversário — some sozinha se o arquivo ainda não
    // existir em assets/audio/. Tenta tocar sozinha; se o navegador
    // bloquear autoplay com som, o botão continua visível pra ela dar o
    // play manualmente (e também serve pra pausar/retomar a qualquer hora).
    const audio = document.getElementById('aniversarioAudio');
    const btnMusica = document.getElementById('btnAniversarioMusica');
    if (audio && btnMusica) {
        const caminhoAudio = await resolverAudioPorBase(ANIVERSARIO_MUSICA_ARQUIVO_BASE);
        if (caminhoAudio) {
            audio.src = caminhoAudio;
            btnMusica.classList.remove('d-none');

            const atualizarIconeBotao = (tocando) => {
                btnMusica.innerHTML = tocando
                    ? '<i class="bi bi-pause-fill"></i>'
                    : '<i class="bi bi-music-note-beamed"></i>';
                btnMusica.classList.toggle('tocando', tocando);
            };
            btnMusica.addEventListener('click', () => {
                if (audio.paused) {
                    audio.play().then(() => atualizarIconeBotao(true)).catch(() => atualizarIconeBotao(false));
                } else {
                    audio.pause();
                    atualizarIconeBotao(false);
                }
            });

            audio.play().then(() => atualizarIconeBotao(true)).catch(() => atualizarIconeBotao(false));
        }
    }

    // Corações e balões subindo de baixo pra cima na tela, só hoje.
    iniciarChuvaDeAniversario();
}

/* Cria corações/balões que sobem de baixo pra cima da tela por um tempo
 * (ANIVERSARIO_CHUVA_DURACAO_MS), só chamada quando é o dia dela de
 * verdade (ver verificarEspecialAniversario acima). Cada elemento é
 * descartado sozinho quando a animação termina, então não acumula nada
 * na página com o passar do tempo. */
function iniciarChuvaDeAniversario() {
    const container = document.getElementById('aniversarioChuvaContainer');
    if (!container || !Array.isArray(ANIVERSARIO_CHUVA_ITENS) || !ANIVERSARIO_CHUVA_ITENS.length) return;

    const INTERVALO_MS = 220;
    const inicio = Date.now();

    const criarItem = () => {
        const item = document.createElement('span');
        item.className = 'aniversario-chuva-item';
        item.textContent = ANIVERSARIO_CHUVA_ITENS[Math.floor(Math.random() * ANIVERSARIO_CHUVA_ITENS.length)];

        const posicaoHorizontal = Math.random() * 96; // % da largura da tela
        const desvio = 20 + Math.random() * 60; // px de "vento" durante a subida
        const duracaoS = 5 + Math.random() * 3.5;
        const tamanhoRem = 1.4 + Math.random() * 1.3;

        item.style.left = `${posicaoHorizontal}%`;
        item.style.fontSize = `${tamanhoRem}rem`;
        item.style.setProperty('--aniversario-desvio', `${desvio}px`);
        item.style.animationDuration = `${duracaoS}s`;

        container.appendChild(item);
        item.addEventListener('animationend', () => item.remove());
    };

    const temporizador = setInterval(() => {
        if (Date.now() - inicio > ANIVERSARIO_CHUVA_DURACAO_MS) {
            clearInterval(temporizador);
            return;
        }
        criarItem();
    }, INTERVALO_MS);
    criarItem(); // primeiro item já na hora, sem esperar o primeiro intervalo
}

/* ---------------- "Se um dia estiver triste, lembre-se disso" ---------------- */
let __adjetivosOrdem = [];
function iniciarAdjetivosParaEla() {
    const card = document.getElementById('adjetivoCard');
    const botao = document.getElementById('btnAdjetivoMaisUm');
    if (!card || !Array.isArray(ADJETIVOS_PARA_ELA) || !ADJETIVOS_PARA_ELA.length) return;

    function embaralharNovoBaralho() {
        __adjetivosOrdem = ADJETIVOS_PARA_ELA.map((_, i) => i);
        for (let i = __adjetivosOrdem.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [__adjetivosOrdem[i], __adjetivosOrdem[j]] = [__adjetivosOrdem[j], __adjetivosOrdem[i]];
        }
    }

    function mostrarProximaCarta() {
        if (!__adjetivosOrdem.length) embaralharNovoBaralho(); // esgotou o baralho — embaralha de novo, sem repetir a mesma logo em seguida
        const indice = __adjetivosOrdem.pop();
        const item = ADJETIVOS_PARA_ELA[indice];

        card.classList.remove('adjetivo-card-visivel');
        setTimeout(() => {
            document.getElementById('adjetivoPalavra').textContent = item.adjetivo;
            const motivoEl = document.getElementById('adjetivoMotivo');
            motivoEl.textContent = item.motivo || '';
            motivoEl.classList.toggle('d-none', !item.motivo);
            card.classList.add('adjetivo-card-visivel');
        }, 220);
    }

    embaralharNovoBaralho();
    mostrarProximaCarta();
    botao.addEventListener('click', mostrarProximaCarta);
    card.addEventListener('click', mostrarProximaCarta);
}

/* ---------------- "Se um dia a gente discutir, leia isso" ---------------- */
function iniciarCartaDiscussao() {
    const botao = document.getElementById('btnCartaDiscussao');
    const overlay = document.getElementById('cartaDiscussaoOverlay');
    const fechar = document.getElementById('btnFecharCartaDiscussao');
    if (!botao || !overlay) return;

    const passoSenha = document.getElementById('cartaDiscussaoPassoSenha');
    const passoPergunta = document.getElementById('cartaDiscussaoPassoPergunta');
    const senhaInput = document.getElementById('cartaDiscussaoSenhaInput');
    const senhaErro = document.getElementById('cartaDiscussaoSenhaErro');
    const mensagemFofa = document.getElementById('cartaDiscussaoMensagemFofa');

    function mostrarPasso(passo) {
        [passoSenha, passoPergunta].forEach(p => p.classList.add('d-none'));
        passo.classList.remove('d-none');
        overlay.scrollTop = 0; // cada passo novo começa mostrando o topo, nunca no meio/fim
    }

    function abrirDoZero() {
        senhaErro.classList.add('d-none');
        mensagemFofa.classList.add('d-none');
        document.getElementById('btnCartaDiscussaoSim').classList.remove('d-none');
        document.getElementById('btnCartaDiscussaoNao').classList.remove('d-none');
        overlay.classList.remove('d-none');
        bloquearScrollFundoLembranca();
        mostrarPasso(passoPergunta);
    }

    function irParaSenha() {
        document.getElementById('cartaDiscussaoDica').textContent = DICA_SENHA_CARTA_DISCUSSAO;
        senhaInput.value = '';
        senhaErro.classList.add('d-none');
        mostrarPasso(passoSenha);
        setTimeout(() => senhaInput.focus(), 300);
    }

    async function tentarSenha() {
        const digitada = (senhaInput.value || '').trim().toLowerCase().replace(/\s+/g, '');
        if (await verificarSenhaHash(digitada, SENHA_CARTA_DISCUSSAO_HASH)) {
            overlay.classList.add('d-none');
            desbloquearScrollFundoLembranca();

            // Embute o próprio vídeo do pedido (já gravado no aparelho,
            // sem precisar de YouTube) como lembrete visual, junto com a
            // carta — só se ele existir (pode ser que ainda não tenha
            // sido gravado, ex.: alguém abrindo essa página antes disso).
            let videoLocalUrl = null;
            try {
                const video = await obterMedia('video_pedido');
                if (video && video.blob) videoLocalUrl = URL.createObjectURL(video.blob);
            } catch (e) { console.error('Falha ao carregar o vídeo do pedido para a carta de discussão:', e); }

            // Já abre direto no modo "luz de vela" (pedido explícito).
            abrirModoVela('Se um dia a gente discutir', textoCartaDiscussao(), NOME_DELE + '.', {
                videoLocalUrl,
                videoLegenda: videoLocalUrl ? 'Lembre-se que nos amamos.' : undefined
            });
        } else {
            senhaErro.classList.remove('d-none');
            senhaInput.value = '';
            senhaInput.focus();
        }
    }

    botao.addEventListener('click', abrirDoZero);
    document.getElementById('btnCartaDiscussaoSenhaEntrar').addEventListener('click', tentarSenha);
    senhaInput.addEventListener('keydown', (evt) => { if (evt.key === 'Enter') tentarSenha(); });

    // Não deixa digitar espaço nenhum, e sempre mantém a primeira letra
    // maiúscula enquanto ela digita (a comparação em tentarSenha() ignora
    // maiúscula/minúscula de qualquer forma, isso é só visual).
    senhaInput.addEventListener('input', () => {
        const semEspaco = senhaInput.value.replace(/\s/g, '');
        senhaInput.value = semEspaco.charAt(0).toUpperCase() + semEspaco.slice(1);
    });

    document.getElementById('btnCartaDiscussaoSim').addEventListener('click', irParaSenha);

    document.getElementById('btnCartaDiscussaoNao').addEventListener('click', () => {
        mensagemFofa.textContent = TEXTOS.brigamosMensagemFofa;
        mensagemFofa.classList.remove('d-none');
        document.getElementById('btnCartaDiscussaoSim').classList.add('d-none');
        document.getElementById('btnCartaDiscussaoNao').classList.add('d-none');
    });

    fechar.addEventListener('click', () => { overlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); forcarRecalculoDeLayout(); });
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) { overlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); forcarRecalculoDeLayout(); } });
}

/* ---------------- "Nosso mapa" ---------------- */
// A página principal mostra só os primeiros lugares (pra não ficar poluída
// se a lista crescer); a trilha inteira fica disponível no modal "Ver todos
// os lugares" (ver iniciarMapaModal() logo abaixo).
const MAPA_QUANTIDADE_PREVIA = 4;

// resolverFotoPlaceholder devolve um caminho real em "assets/img/..." quando
// a foto já foi adicionada, ou um SVG gerado na hora (data:image/svg+xml...)
// quando ainda não existe — assim dá pra saber qual dos dois caso a caso.
function lugarTemFotoReal(caminho) {
    return typeof caminho === 'string' && (caminho.startsWith('assets/img/') || caminho.startsWith('blob:'));
}

let mapaFotosBlobUrls = [];

async function preencherGridDoMapa(grid, lugares) {
    if (!grid) return;
    grid.innerHTML = '';

    // Resolve a foto de cada lugar em paralelo (mesma lógica usada em
    // "Seus bichos") pra já nascer sabendo quais pins mostram foto de
    // verdade e quais ainda caem no ícone.
    const fotosResolvidas = await Promise.all(lugares.map(lugar => {
        if (lugar.foto) return resolverFotoPlaceholder(lugar.foto); // lugares fixos (js/config.js)
        if (lugar.mediaId) return obterMedia(lugar.mediaId).then(media => {
            if (!media?.blob) return null;
            const url = URL.createObjectURL(media.blob);
            mapaFotosBlobUrls.push(url);
            return url;
        });
        if (lugar.fotoBase) return resolverFotoPorBase(lugar.fotoBase, lugar.nome); // lugares adicionados pelo painel
        return Promise.resolve(null);
    }));

    lugares.forEach((lugar, i) => {
        const foto = fotosResolvidas[i];
        const temFoto = lugarTemFotoReal(foto);

        const card = document.createElement('div');
        card.className = 'mapa-card' + (lugar.futuro ? ' mapa-card-futuro' : '');
        const nomeSeguro = escaparHtml(lugar.nome || 'Local especial');
        const cidadeSegura = escaparHtml(lugar.cidade || '');
        const textoSeguro = escaparHtml(lugar.texto || '');
        const iconeSeguro = /^bi-[a-z0-9-]+$/i.test(lugar.icon || '') ? lugar.icon : 'bi-geo-alt-fill';
        card.innerHTML = `
            <div class="mapa-pin${temFoto ? ' mapa-pin-foto' : ''}">${
                temFoto
                    ? `<img src="${escaparHtml(foto)}" alt="${nomeSeguro}">`
                    : `<i class="bi ${iconeSeguro}"></i>`
            }</div>
            <div class="mapa-linha"></div>
            <div class="mapa-conteudo">
                <p class="mapa-nome">${nomeSeguro}</p>
                <p class="mapa-cidade">${cidadeSegura}</p>
                <p class="mapa-texto">${textoSeguro}</p>
            </div>`;

        // Só abre o visor de foto ampliada se já existir uma foto de
        // verdade pra esse lugar (sem sentido abrir o SVG de placeholder).
        if (temFoto) {
            card.classList.add('mapa-card-clicavel');
            card.addEventListener('click', () => abrirLightboxGaleria(fotosResolvidas.filter(lugarTemFotoReal), fotosResolvidas.filter(lugarTemFotoReal).indexOf(foto), lugares.filter((_, j) => lugarTemFotoReal(fotosResolvidas[j])).map(l => l.nome)));
        }

        grid.appendChild(card);
    });
}

// Locais adicionados pelo painel "Adicionar local ao mapa" (diagnostico.html)
// ficam guardados nessa chave de configuração — mesmo mecanismo de
// salvarConfiguracao()/obterConfiguracao() (js/db.js) usado pelo resto do
// site, então entram automaticamente no backup/sincronização com a nuvem
// (ver js/export.js) e aparecem em qualquer aparelho que abrir o site.
const CHAVE_MAPA_LUGARES_EXTRA = 'aurora_mapa_lugares_extra';

async function obterLugaresExtrasDoMapa() {
    try {
        const bruto = await obterConfiguracao(CHAVE_MAPA_LUGARES_EXTRA);
        const lista = JSON.parse(bruto || '[]');
        return Array.isArray(lista) ? lista.filter(lugar => !lugar.excluidoEm) : [];
    } catch (e) {
        console.error('Falha ao ler locais extras do mapa:', e);
        return [];
    }
}

async function renderizarMapaDaRelacao() {
    const gridPrevia = document.getElementById('mapaTrilhaGrid');
    const gridCompleto = document.getElementById('mapaTrilhaGridCompleto');
    const verTodosWrap = document.getElementById('mapaVerTodosWrap');
    if (!gridPrevia || !Array.isArray(MAPA_LUGARES)) return;

    mapaFotosBlobUrls.forEach(url => URL.revokeObjectURL(url));
    mapaFotosBlobUrls = [];
    const extras = await obterLugaresExtrasDoMapa();
    // Separa o(s) card(s) marcados como "futuro" (ex.: "Próximo destino")
    // e os mantém sempre no final, para que locais novos (fixos ou
    // adicionados pelo painel) sempre apareçam antes deles.
    const lugaresFixosSemFuturo = MAPA_LUGARES.filter(lugar => !lugar.futuro);
    const lugaresFuturo = MAPA_LUGARES.filter(lugar => lugar.futuro);
    const todosOsLugares = lugaresFixosSemFuturo.concat(extras, lugaresFuturo);

    const temMais = todosOsLugares.length > MAPA_QUANTIDADE_PREVIA;
    preencherGridDoMapa(gridPrevia, temMais ? todosOsLugares.slice(0, MAPA_QUANTIDADE_PREVIA) : todosOsLugares);
    preencherGridDoMapa(gridCompleto, todosOsLugares);

    if (verTodosWrap) verTodosWrap.classList.toggle('d-none', !temMais);
}

function iniciarMapaModal() {
    const overlay = document.getElementById('mapaModalOverlay');
    const btnAbrir = document.getElementById('btnMapaVerTodos');
    const btnFechar = document.getElementById('btnFecharMapaModal');
    if (!overlay || !btnAbrir || overlay.dataset.iniciado === '1') return;
    overlay.dataset.iniciado = '1';

    const abrir = () => {
        overlay.classList.remove('d-none');
        overlay.scrollTop = 0;
        bloquearScrollFundoLembranca();
    };
    const fechar = () => { overlay.classList.add('d-none'); desbloquearScrollFundoLembranca(); forcarRecalculoDeLayout(); };

    btnAbrir.addEventListener('click', abrir);
    btnFechar.addEventListener('click', fechar);
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) fechar(); });
}
function renderizarCoisasQueElaAma() {
    const grid = document.getElementById('coisasQueElaAmaGrid');
    if (!grid || !Array.isArray(COISAS_QUE_ELA_AMA)) return;
    grid.innerHTML = '';
    COISAS_QUE_ELA_AMA.forEach(item => {
        const card = document.createElement('div');
        card.className = 'ama-card';
        card.innerHTML = `<i class="bi ${item.icon}"></i><p>${item.texto}</p>`;
        grid.appendChild(card);
    });
}

/* ---------------- Resumo do "Nosso checklist" (progresso + link para checklist.html) ---------------- */
async function renderizarResumoChecklist() {
    const textoEl = document.getElementById('checklistResumoTexto');
    const barraEl = document.getElementById('checklistResumoBarra');
    if (!textoEl || typeof CHECKLIST_ENCONTROS === 'undefined') return;

    let total = CHECKLIST_ENCONTROS.reduce((soma, cat) => soma + cat.itens.length, 0);
    const idsValidos = new Set();
    CHECKLIST_ENCONTROS.forEach((cat, catIdx) => cat.itens.forEach((_, itemIdx) => idsValidos.add(`${catIdx}_${itemIdx}`)));
    try {
        const brutoCustom = await obterConfiguracao('aurora_checklist_itens_customizados');
        const listaCustom = brutoCustom ? JSON.parse(brutoCustom) : [];
        if (Array.isArray(listaCustom)) {
            const ativos = listaCustom.filter(item => !item.excluidoEm);
            ativos.forEach(item => idsValidos.add(item.id));
            total += ativos.length;
        }
    } catch (e) { /* mantém só o total original em caso de erro */ }

    let estado = {};
    try {
        const bruto = await obterConfiguracao('aurora_checklist_encontros');
        estado = bruto ? JSON.parse(bruto) : {};
    } catch (e) { estado = {}; }
    if (!estado || typeof estado !== 'object' || Array.isArray(estado)) estado = {};

    const feitos = Object.keys(estado).filter(id => estado[id] && idsValidos.has(id)).length;
    const percentual = total > 0 ? Math.round((feitos / total) * 100) : 0;

    textoEl.textContent = feitos === 0
        ? `${total} coisas esperando pra gente viver junto.`
        : `${feitos} de ${total} já vivemos juntos.`;
    if (barraEl) barraEl.style.width = `${percentual}%`;
}

/* ---------------- "Seus bichos" ---------------- */
async function renderizarSeusBichos() {
    const grid = document.getElementById('seusBichosGrid');
    const memoria = document.getElementById('bichosEmMemoria');
    const slinkyBox = document.getElementById('bichoSlinkyDestaque');
    const slinkyTexto = document.getElementById('bichoSlinkyTexto');
    if (!grid) return;

    // Lista combinada (atuais + em memória, incluindo o Slinky) na mesma
    // ordem em que os cartões aparecem na tela — clicar em qualquer nome
    // abre a foto dele e dá pra navegar pros outros a partir dali.
    const todosOsBichos = [...(SEUS_BICHOS || []), ...(BICHOS_EM_MEMORIA || [])];
    // resolverFotoPlaceholder testa cada extensão aceita (EXTENSOES_FOTO_ACEITAS,
    // em js/config.js) até achar o arquivo de verdade — por isso é assíncrona.
    const todasAsFotos = await Promise.all(todosOsBichos.map(b => resolverFotoPlaceholder(b.foto)));
    const todosOsNomes = todosOsBichos.map(b => b.nome || '');

    if (Array.isArray(SEUS_BICHOS)) {
        grid.innerHTML = '';
        SEUS_BICHOS.forEach((bicho, i) => {
            const card = document.createElement('div');
            card.className = 'bicho-card';
            card.innerHTML = `<span class="bicho-emoji">${bicho.emoji}</span><span class="bicho-nome">${bicho.nome}</span>`;
            card.addEventListener('click', () => abrirLightboxGaleria(todasAsFotos, i, todosOsNomes));
            grid.appendChild(card);
        });
    }

    if (Array.isArray(BICHOS_EM_MEMORIA)) {
        const slinky = BICHOS_EM_MEMORIA.find(b => b.destaque);
        const indiceSlinky = todosOsBichos.indexOf(slinky);
        if (slinky && slinkyBox && slinkyTexto) {
            slinkyTexto.textContent = slinky.textoEspecial || '';
            slinkyBox.classList.remove('d-none');
            slinkyBox.addEventListener('click', () => abrirLightboxGaleria(todasAsFotos, indiceSlinky, todosOsNomes));
        }

        // Os demais "em memória" (sem o Slinky, que já ganhou o bloco de
        // destaque acima, pra não repetir o nome dele duas vezes) também
        // abrem foto ao tocar no nome.
        const outrosEmMemoria = BICHOS_EM_MEMORIA.filter(b => !b.destaque);
        if (memoria && outrosEmMemoria.length) {
            memoria.innerHTML = 'E no coração, pra sempre: ' + outrosEmMemoria.map(b => {
                const indice = todosOsBichos.indexOf(b);
                return `<span class="bicho-memoria-nome" data-indice="${indice}">${b.nome} ${b.emoji}</span>`;
            }).join(', ') + '.';
            memoria.querySelectorAll('.bicho-memoria-nome').forEach(span => {
                span.addEventListener('click', () => abrirLightboxGaleria(todasAsFotos, Number(span.dataset.indice), todosOsNomes));
            });
        }
    }
}

/* ---------------- Easter egg do sobrenome ---------------- */
function exibirEasterEggSobrenome() {
    const el = document.getElementById('easterEggSobrenome');
    if (el) el.textContent = TEXTO_EASTER_EGG_SOBRENOME;
}

function iniciarModuloRomance() {
    const btnGerarContrato = document.getElementById('btnGerarContrato');
    if (btnGerarContrato) {
        btnGerarContrato.addEventListener('click', async () => {
            if (regrasSelecionadas.length < MIN_REGRAS) return;
            await salvarConfiguracao('aurora_regras_contrato', JSON.stringify(regrasSelecionadas));
            gerarContratoPersonalizado(regrasSelecionadas);
        });
    }

    iniciarFechamentoContrato();

    document.getElementById('btnAdicionarLembranca').addEventListener('click', () => document.getElementById('inputLembrancas').click());
    document.getElementById('inputLembrancas').addEventListener('change', (evt) => { adicionarLembrancas(evt.target.files); evt.target.value = ''; });
    document.getElementById('btnFecharLembranca').addEventListener('click', fecharLembrancaAmpliada);
    document.getElementById('btnLightboxAnterior').addEventListener('click', lightboxFotoAnterior);
    document.getElementById('btnLightboxProxima').addEventListener('click', lightboxProximaFoto);
    document.getElementById('btnEstrelaAnterior').addEventListener('click', estrelaModalAnterior);
    document.getElementById('btnEstrelaProxima').addEventListener('click', estrelaModalProxima);

    document.getElementById('btnReverLoja').addEventListener('click', abrirLojaSomenteVisualizacao);
    document.getElementById('btnVoltarDaLoja').addEventListener('click', fecharLojaSomenteVisualizacao);

    // Item 3 do prompt de correções: permite recomeçar o quiz do casal do zero.
    document.getElementById('btnRefazerQuiz').addEventListener('click', iniciarQuiz);

}

/* ----------------------------------------------------------------------
   "REVER A LOJINHA" — revive a experiência inteira, sem gravar nada de
   novo no banco
   ----------------------------------------------------------------------
   Depois que tudo já aconteceu de verdade, a pessoa pode querer reviver a
   "lojinha falsa" das alianças inteira (compra, perguntas, fotos) por
   nostalgia — inclusive passando de novo pela tela de assinatura e pela
   verificação por vídeo. Como a assinatura e o vídeo reais já existem
   salvos (ver js/db.js), essas duas etapas não pedem uma assinatura/vídeo
   novos: enquanto modoVisualizacaoLojaAtiva estiver ligada, js/suspense.js
   mostra o que já foi salvo (mostrarAssinaturaSomenteVisualizacao,
   iniciarTelaDeVideoSomenteVisualizacao) e pula toda chamada de
   salvarMedia/salvarConfiguracao no caminho — os dados do pedido real
   nunca são sobrescritos nessa revivida.
   ---------------------------------------------------------------------- */
function abrirLojaSomenteVisualizacao() {
    document.getElementById('romancePage').style.display = 'none';
    const loja = document.getElementById('lojaScreen');
    loja.style.display = '';
    definirFundoBody(CORES_FUNDO.claro);

    modoVisualizacaoLojaAtiva = true;

    // O indicador "os dois online agora" (js/presenca.js) não é mais filho
    // de #romancePage (ver correção do bug de position:fixed dentro de
    // overflow:hidden no Safari), então esconder a página não esconde ele
    // mais de graça por cascata — precisa reavaliar explicitamente aqui,
    // senão ele fica flutuando por cima da lojinha em modo visualização.
    try { if (typeof refrescarIndicadorPresenca === 'function') refrescarIndicadorPresenca(); } catch (e) { /* indicador é só um extra, nunca deve travar a navegação */ }

    // O clique real de "Confirmar Pagamento" desabilita este botão
    // permanentemente (ver wiring em js/suspense.js) — reabilita aqui pra
    // a revivida poder ser feita de novo, do início ao fim, toda vez que
    // "Rever a lojinha" for aberta.
    const botaoConfirmar = document.getElementById('btnConfirmarPedido');
    if (botaoConfirmar) botaoConfirmar.disabled = false;

    trocarNomeLojaParaVisualizacao(true);

    document.getElementById('modoVisualizacaoBarra').classList.remove('d-none');
    document.body.classList.add('modo-visualizacao-ativo'); // reserva espaço pra barra fixa não cobrir o fim da loja
    window.scrollTo(0, 0);

    // O FAB de navegação e a barra de progresso de scroll são filhos
    // diretos do body (mesmo motivo do indicador de presença, ver
    // comentário acima), então esconder #romancePage não os esconde de
    // graça — sem isso, os dois ficariam flutuando por cima da lojinha.
    document.getElementById('historiaNavFlutuante')?.classList.add('d-none');
    document.getElementById('historiaProgressoScroll')?.classList.add('d-none');

    // Mesma correção do "espaço vazio/roxo no fim da tela" usada ao voltar
    // da lojinha (ver forcarRecalculoDeLayout() em js/utils.js): troca
    // entre #romancePage e #lojaScreen também muda a altura real do
    // documento nesse sentido (entrando na lojinha), então precisa do
    // mesmo reflow forçado.
    forcarRecalculoDeLayout();
}

function fecharLojaSomenteVisualizacao() {
    modoVisualizacaoLojaAtiva = false;

    document.getElementById('lojaScreen').style.display = 'none';
    // Cobre sair no meio do caminho (checkout ou qualquer tela do
    // "suspense": perguntas, fotos, assinatura, vídeo, carta) — fecha tudo
    // e deixa pronto pra recomeçar do zero na próxima vez que "Rever a
    // lojinha" for aberta.
    document.getElementById('checkoutScreen').style.display = 'none';
    document.getElementById('suspenseOverlay').style.display = 'none';
    document.getElementById('processingOverlay').style.display = 'none';
    try { if (typeof resetarTelasSuspenseParaProximaRevisao === 'function') resetarTelasSuspenseParaProximaRevisao(); } catch (e) { /* não crítico, só deixa a próxima revisão começar do zero */ }

    const botaoConfirmar = document.getElementById('btnConfirmarPedido');
    if (botaoConfirmar) botaoConfirmar.classList.remove('d-none');

    trocarNomeLojaParaVisualizacao(false);

    document.getElementById('modoVisualizacaoBarra').classList.add('d-none');
    document.body.classList.remove('modo-visualizacao-ativo');
    const romancePage = document.getElementById('romancePage');
    romancePage.style.display = '';
    definirFundoBody(CORES_FUNDO.escuro);
    window.scrollTo(0, 0);

    // Reverte o esconderijo feito em abrirLojaSomenteVisualizacao.
    document.getElementById('historiaNavFlutuante')?.classList.remove('d-none');
    document.getElementById('historiaProgressoScroll')?.classList.remove('d-none');
    try { if (typeof refrescarIndicadorPresenca === 'function') refrescarIndicadorPresenca(); } catch (e) { /* indicador é só um extra, nunca deve travar a navegação */ }

    // Alternar display:none -> '' reinicia as animações de entrada
    // (.reveal-up), dando a impressão de tela em branco por um instante;
    // força tudo a aparecer já no estado final, sem re-tocar a animação.
    romancePage.querySelectorAll('.reveal-up').forEach(el => {
        el.style.animation = 'none';
        el.style.opacity = '1';
        el.style.transform = 'none';
    });

    forcarRecalculoDeLayout(); // essa troca não dispara "pageshow", força o reflow manualmente
}

/**
 * Troca o nome "Aryah" por "Poloni" (e variações) só enquanto está no
 * modo visualização da lojinha — nunca durante a experiência real do
 * pedido (ali o disfarce "Aryah Joias" precisa continuar intacto). Cada
 * elemento marcado com a classe "js-marca-loja" guarda o texto original
 * em data-original na primeira troca, pra sempre voltar exatamente como
 * era ao fechar — mesmo que o texto tenha maiúsculas, minúsculas, ou
 * esteja no meio de uma frase maior.
 */
function trocarNomeLojaParaVisualizacao(ligar) {
    document.querySelectorAll('.js-marca-loja').forEach((el) => {
        if (!el.hasAttribute('data-original')) el.setAttribute('data-original', el.textContent);
        const original = el.getAttribute('data-original');

        if (ligar) {
            el.textContent = original
                .replace(/ARYAH JOIAS/g, 'POLONI JOIAS')
                .replace(/Aryah Joias/g, 'Poloni Joias')
                .replace(/ARYAH/g, 'POLONI')
                .replace(/Aryah/g, 'Poloni');
        } else {
            el.textContent = original;
        }
    });

    if (ligar) {
        if (!window.__aurora_titulo_original) window.__aurora_titulo_original = document.title;
        document.title = document.title.replace(/Aryah Joias/i, 'Poloni Joias');
    } else if (window.__aurora_titulo_original) {
        document.title = window.__aurora_titulo_original;
    }
}

/* ----------------------------------------------------------------------
   QUADRO DE PREVISÕES
   ----------------------------------------------------------------------
   Cada um responde as mesmas perguntas (PREVISOES_PERGUNTAS, js/config.js)
   separado. O Gabriel usa uma senha fixa (SENHA_PREVISOES_GABRIEL_HASH);
   a Ana cria a própria na primeira vez que usar (ver
   solicitarSenhaPrevisoes) — assim um não vê a resposta do outro antes
   da hora. As respostas só ficam visíveis lado a lado depois que passar
   PREVISOES_DIAS_PARA_REVELACAO dias desde a primeira vez que esta seção
   foi aberta, contados pela hora do servidor (obterHoraConfiavel), igual
   à cápsula do tempo.
   ---------------------------------------------------------------------- */
function previsoesEstaConfigurado(pessoa) {
    // Só o Gabriel depende de uma senha fixa pré-configurada; a Ana cria a
    // dela na hora (ver solicitarSenhaPrevisoes), então nunca fica "não
    // configurado" pro lado dela.
    return pessoa === 'gabriel' ? Boolean(SENHA_PREVISOES_GABRIEL_HASH) : true;
}

// A contagem do Quadro de previsões agora é a MESMA da cápsula do tempo —
// as duas usam a data do pedido (aurora_data_pedido) como ponto de
// partida, então revelam no mesmo dia. (Antes, o quadro contava a partir
// da primeira vez que a seção era aberta, o que podia desalinhar as duas
// datas.)
async function calcularDataRevelacaoPrevisoes() {
    return calcularDataDesbloqueioCapsula();
}

// Mesmo overlay de senha é reaproveitado pelos dois. Pro Gabriel, sempre
// pede a senha fixa (SENHA_PREVISOES_GABRIEL_HASH). Pra Ana, na primeira
// vez (sem hash salvo ainda em 'aurora_previsoes_ana_senha_hash') pede
// pra ela CRIAR uma senha nova; das próximas vezes em diante, pede essa
// mesma senha que ela criou.
function solicitarSenhaPrevisoes(pessoa) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('previsoesSenhaOverlay');
        const titulo = document.getElementById('previsoesSenhaTitulo');
        const subtitulo = document.getElementById('previsoesSenhaSub');
        const modoDigitar = document.getElementById('previsoesSenhaModoDigitar');
        const modoCriar = document.getElementById('previsoesSenhaModoCriar');
        const inputDigitar = document.getElementById('previsoesSenhaInput');
        const erroDigitar = document.getElementById('previsoesSenhaErro');
        const inputNova = document.getElementById('previsoesSenhaNovaInput');
        const inputConfirmar = document.getElementById('previsoesSenhaConfirmarInput');
        const erroCriar = document.getElementById('previsoesSenhaCriarErro');
        if (!overlay || !inputDigitar) { resolve(false); return; }

        const chaveHashAna = 'aurora_previsoes_ana_senha_hash';

        function abrir(precisaCriar, hashEsperado) {
            titulo.textContent = pessoa === 'gabriel' ? `Respostas do ${NOME_DELE}` : `Respostas da ${NOME_DELA_APELIDO}`;
            subtitulo.textContent = precisaCriar
                ? 'Primeira vez por aqui — crie uma senha só sua pra proteger suas respostas até a revelação.'
                : 'Só quem responde essa parte sabe a senha.';

            modoDigitar.classList.toggle('d-none', precisaCriar);
            modoCriar.classList.toggle('d-none', !precisaCriar);
            erroDigitar.classList.add('d-none');
            erroCriar.classList.add('d-none');
            inputDigitar.value = '';
            inputNova.value = '';
            inputConfirmar.value = '';

            overlay.classList.remove('d-none');
            bloquearScrollFundoLembranca();
            setTimeout(() => (precisaCriar ? inputNova : inputDigitar).focus(), 300);

            function fechar(resultado) {
                overlay.classList.add('d-none');
                desbloquearScrollFundoLembranca();
                document.getElementById('btnPrevisoesSenhaEntrar').onclick = null;
                document.getElementById('btnPrevisoesSenhaCancelar').onclick = null;
                inputDigitar.onkeydown = null;
                inputConfirmar.onkeydown = null;
                resolve(resultado);
            }

            function balancarCaixa() {
                const box = overlay.querySelector('.senha-memorias-box');
                box.classList.remove('senha-shake');
                void overlay.offsetWidth; // força reflow para reiniciar a animação de "errado"
                box.classList.add('senha-shake');
            }

            async function tentar() {
                if (precisaCriar) {
                    const nova = (inputNova.value || '').trim();
                    const confirmar = (inputConfirmar.value || '').trim();
                    if (!nova || nova !== confirmar) {
                        erroCriar.classList.remove('d-none');
                        balancarCaixa();
                        return;
                    }
                    await salvarConfiguracao(chaveHashAna, sha256Hex(nova));
                    fechar(true);
                    return;
                }

                const digitada = (inputDigitar.value || '').trim();
                if (await verificarSenhaHash(digitada, hashEsperado)) {
                    fechar(true);
                } else {
                    erroDigitar.classList.remove('d-none');
                    inputDigitar.value = '';
                    inputDigitar.focus();
                    balancarCaixa();
                }
            }

            document.getElementById('btnPrevisoesSenhaEntrar').onclick = tentar;
            document.getElementById('btnPrevisoesSenhaCancelar').onclick = () => fechar(false);
            inputDigitar.onkeydown = (evt) => { if (evt.key === 'Enter') tentar(); };
            inputConfirmar.onkeydown = (evt) => { if (evt.key === 'Enter') tentar(); };
        }

        if (pessoa === 'gabriel') {
            abrir(false, SENHA_PREVISOES_GABRIEL_HASH);
        } else {
            obterConfiguracao(chaveHashAna).then((hashSalvo) => {
                abrir(!hashSalvo, hashSalvo);
            });
        }
    });
}

async function abrirFormularioPrevisoes(pessoa) {
    const chave = pessoa === 'gabriel' ? 'aurora_previsoes_gabriel' : 'aurora_previsoes_ana';
    const salvo = await obterConfiguracao(chave);
    const respostas = salvo ? JSON.parse(salvo) : {};

    const overlay = document.getElementById('previsoesFormOverlay');
    const lista = document.getElementById('previsoesFormLista');
    const status = document.getElementById('previsoesFormStatus');
    if (!overlay || !lista) return;

    document.getElementById('previsoesFormTitulo').textContent = pessoa === 'gabriel' ? `Suas respostas, ${NOME_DELE}` : `Suas respostas, ${NOME_DELA_APELIDO}`;
    lista.innerHTML = PREVISOES_PERGUNTAS.map(p => `
        <div class="previsoes-pergunta">
            <label for="previsoesResposta_${p.id}">${p.pergunta}</label>
            <textarea id="previsoesResposta_${p.id}" rows="2" maxlength="500">${(respostas[p.id] || '').replace(/</g, '&lt;')}</textarea>
        </div>
    `).join('');

    status.textContent = '';
    status.className = 'save-status';
    overlay.classList.remove('d-none');
    bloquearScrollFundoLembranca();

    function fechar() {
        overlay.classList.add('d-none');
        desbloquearScrollFundoLembranca();
        document.getElementById('btnSalvarPrevisoes').onclick = null;
        document.getElementById('btnFecharPrevisoesForm').onclick = null;
    }

    document.getElementById('btnFecharPrevisoesForm').onclick = fechar;
    document.getElementById('btnSalvarPrevisoes').onclick = async () => {
        const novasRespostas = {};
        PREVISOES_PERGUNTAS.forEach(p => {
            const el = document.getElementById(`previsoesResposta_${p.id}`);
            novasRespostas[p.id] = el ? el.value.trim() : '';
        });
        await salvarConfiguracao(chave, JSON.stringify(novasRespostas));
        status.textContent = 'Respostas salvas!';
        status.className = 'save-status ok';
        setTimeout(fechar, 900);
    };
}

async function iniciarRespostaPrevisoes(pessoa) {
    if (!previsoesEstaConfigurado(pessoa)) {
        alert('O quadro de previsões ainda não tem a senha do Gabriel configurada (ver SENHA_PREVISOES_GABRIEL_HASH em js/config.js).');
        return;
    }
    const ok = await solicitarSenhaPrevisoes(pessoa);
    if (ok) await abrirFormularioPrevisoes(pessoa);
}

async function renderizarComparativoPrevisoes() {
    const container = document.getElementById('previsoesComparativo');
    if (!container) return;

    const [gabrielSalvo, anaSalvo] = await Promise.all([
        obterConfiguracao('aurora_previsoes_gabriel'),
        obterConfiguracao('aurora_previsoes_ana'),
    ]);
    const respostasGabriel = gabrielSalvo ? JSON.parse(gabrielSalvo) : {};
    const respostasAna = anaSalvo ? JSON.parse(anaSalvo) : {};

    container.innerHTML = PREVISOES_PERGUNTAS.map(p => `
        <div class="previsoes-card">
            <p class="previsoes-card-pergunta">${p.pergunta}</p>
            <div class="previsoes-card-respostas">
                <div><span class="previsoes-card-nome">${NOME_DELE}</span><p>${respostasGabriel[p.id] ? respostasGabriel[p.id].replace(/</g, '&lt;') : '<em>sem resposta</em>'}</p></div>
                <div><span class="previsoes-card-nome">${NOME_DELA_APELIDO}</span><p>${respostasAna[p.id] ? respostasAna[p.id].replace(/</g, '&lt;') : '<em>sem resposta</em>'}</p></div>
            </div>
        </div>
    `).join('');
}

async function prepararQuadroPrevisoes() {
    const wrap = document.getElementById('previsoesWrap');
    if (!wrap) return;

    const dataAlvo = await calcularDataRevelacaoPrevisoes();
    if (!dataAlvo) { wrap.classList.add('d-none'); return; }
    wrap.classList.remove('d-none');

    const agora = await obterHoraConfiavel();
    const bloqueado = document.getElementById('previsoesBloqueado');
    const revelado = document.getElementById('previsoesRevelado');

    const btnGabriel = document.getElementById('btnResponderPrevisoesGabriel');
    const btnAna = document.getElementById('btnResponderPrevisoesAna');
    if (btnGabriel) btnGabriel.onclick = () => iniciarRespostaPrevisoes('gabriel');
    if (btnAna) btnAna.onclick = () => iniciarRespostaPrevisoes('ana');

    if (agora < dataAlvo) {
        bloqueado.classList.remove('d-none');
        revelado.classList.add('d-none');
        const diasRestantes = Math.max(1, Math.ceil((dataAlvo - agora) / 86400000));
        document.getElementById('previsoesContagem').textContent = diasRestantes === 1 ? 'falta 1 dia para revelar as respostas' : `faltam ${diasRestantes} dias para revelar as respostas`;
    } else {
        bloqueado.classList.add('d-none');
        revelado.classList.remove('d-none');
        await renderizarComparativoPrevisoes();
        // Só comemora na primeira vez que revela — não em toda visita
        // depois de já ter revelado.
        const jaCelebrado = await obterConfiguracao('aurora_previsoes_celebrado');
        if (!jaCelebrado) { celebrarMomento(1.3); await salvarConfiguracao('aurora_previsoes_celebrado', '1'); }
    }
}

/* ----------------------------------------------------------------------
   TERMÔMETRO DO DIA
   ----------------------------------------------------------------------
   Check-in rápido: uma nota de 1 a 5 (TERMOMETRO_OPCOES, js/config.js) +
   comentário opcional, guardado num histórico simples (últimos 60
   registros). Sem gráfico nem análise nenhuma, é só um jeito discreto de
   acompanhar como os dias andaram.
   ---------------------------------------------------------------------- */
async function obterTermometroLista() {
    const salvo = await obterConfiguracao('aurora_termometro_lista');
    return salvo ? JSON.parse(salvo) : [];
}

// Quantos segundos ainda faltam até poder registrar de novo (0 = já pode).
// Baseado só no último item da lista — não precisa da hora do servidor,
// é só pra evitar cliques repetidos sem querer, não uma trava de segurança.
function segundosRestantesCooldownTermometro(lista) {
    if (!lista.length) return 0;
    const ultimo = lista[lista.length - 1];
    const passados = (Date.now() - new Date(ultimo.data).getTime()) / 1000;
    return Math.max(0, Math.ceil(TERMOMETRO_COOLDOWN_SEGUNDOS - passados));
}

let termometroCooldownIntervalo = null;
let termometroSalvando = false;

function aplicarEstadoCooldownTermometro(segundosRestantes) {
    const opcoesWrap = document.getElementById('termometroOpcoes');
    const cooldownEl = document.getElementById('termometroCooldown');
    if (opcoesWrap) {
        opcoesWrap.querySelectorAll('.termometro-opcao').forEach((btn) => { btn.disabled = segundosRestantes > 0; });
    }
    if (!cooldownEl) return;
    if (segundosRestantes > 0) {
        cooldownEl.textContent = `Você poderá registrar de novo em ${segundosRestantes}s`;
        cooldownEl.classList.remove('d-none');
    } else {
        cooldownEl.textContent = '';
        cooldownEl.classList.add('d-none');
    }
}

// Roda a cada segundo enquanto o cooldown estiver ativo, atualizando a
// contagem regressiva; para sozinho assim que ela chega a zero.
function iniciarRelogioCooldownTermometro(segundosRestantes) {
    if (termometroCooldownIntervalo) clearInterval(termometroCooldownIntervalo);
    aplicarEstadoCooldownTermometro(segundosRestantes);
    if (segundosRestantes <= 0) return;
    let restante = segundosRestantes;
    termometroCooldownIntervalo = setInterval(() => {
        restante--;
        aplicarEstadoCooldownTermometro(restante);
        if (restante <= 0) { clearInterval(termometroCooldownIntervalo); termometroCooldownIntervalo = null; }
    }, 1000);
}

async function registrarTermometroDoDia(valor) {
    if (termometroSalvando) return;
    termometroSalvando = true;
    const notaInput = document.getElementById('termometroNotaInput');
    const status = document.getElementById('termometroStatus');
    try {
        const lista = await obterTermometroLista();

        // Ainda dentro do intervalo mínimo (TERMOMETRO_COOLDOWN_SEGUNDOS, js/config.js) — não registra de novo, só atualiza a contagem regressiva.
        const restante = segundosRestantesCooldownTermometro(lista);
        if (restante > 0) {
            iniciarRelogioCooldownTermometro(restante);
            return;
        }

        const texto = notaInput ? notaInput.value.trim() : '';
        lista.push({ id: gerarIdUnico('termometro'), data: new Date().toISOString(), valor, texto });
        while (lista.length > 60) lista.shift(); // guarda só os últimos 60 — suficiente pro histórico visual
        await salvarConfiguracao('aurora_termometro_lista', JSON.stringify(lista));

        if (notaInput) notaInput.value = '';
        celebrarMomento(0.7);
        if (status) {
            status.textContent = 'Registrado!';
            status.className = 'save-status ok';
            setTimeout(() => { status.textContent = ''; }, 2500);
        }
        await renderizarTermometroDoDia();
        iniciarRelogioCooldownTermometro(TERMOMETRO_COOLDOWN_SEGUNDOS);
    } finally {
        termometroSalvando = false;
    }
}

// Média simples dos registros feitos no mês corrente (ano+mês local do
// aparelho — é só um resumo informal, não precisa da hora do servidor).
function calcularMediaTermometroDoMes(lista) {
    const agora = new Date();
    const doMesAtual = lista.filter((item) => {
        const d = new Date(item.data);
        return d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth();
    });
    if (!doMesAtual.length) return null;
    const soma = doMesAtual.reduce((acc, item) => acc + item.valor, 0);
    return { media: soma / doMesAtual.length, quantidade: doMesAtual.length };
}

async function renderizarTermometroDoDia() {
    const wrap = document.getElementById('termometroWrap');
    if (!wrap) return;

    const opcoesWrap = document.getElementById('termometroOpcoes');
    if (opcoesWrap && !opcoesWrap.dataset.montado) {
        opcoesWrap.innerHTML = TERMOMETRO_OPCOES.map(o => `<button type="button" class="termometro-opcao" data-valor="${o.valor}" title="${o.rotulo}">${o.emoji}</button>`).join('');
        opcoesWrap.dataset.montado = '1';
        opcoesWrap.querySelectorAll('.termometro-opcao').forEach((btn) => {
            btn.addEventListener('click', () => registrarTermometroDoDia(Number(btn.dataset.valor)));
        });
    }

    const lista = await obterTermometroLista();
    iniciarRelogioCooldownTermometro(segundosRestantesCooldownTermometro(lista));

    const mediaEl = document.getElementById('termometroMediaMes');
    if (mediaEl) {
        const resultado = calcularMediaTermometroDoMes(lista);
        if (!resultado) {
            mediaEl.textContent = 'Ainda sem registros este mês.';
        } else {
            const opcaoMaisProxima = TERMOMETRO_OPCOES.reduce((maisProxima, opcao) =>
                Math.abs(opcao.valor - resultado.media) < Math.abs(maisProxima.valor - resultado.media) ? opcao : maisProxima
            );
            const registrosTexto = resultado.quantidade === 1 ? '1 registro' : `${resultado.quantidade} registros`;
            // Sem número — só a palavra/emoji do humor mais próximo da média do mês.
            mediaEl.textContent = `Média deste mês: ${opcaoMaisProxima.rotulo} ${opcaoMaisProxima.emoji} (${registrosTexto})`;
        }
    }

    const historicoWrap = document.getElementById('termometroHistorico');
    if (!historicoWrap) return;
    const ultimos = lista.slice(-14).reverse();

    if (!ultimos.length) {
        historicoWrap.innerHTML = '<p class="small text-white-50 mb-0">Ainda não tem nenhum registro por aqui.</p>';
        return;
    }

    historicoWrap.innerHTML = ultimos.map((item) => {
        const opcao = TERMOMETRO_OPCOES.find(o => o.valor === item.valor) || {};
        const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const tituloTooltip = `${dataFormatada}${item.texto ? ' — ' + item.texto.replace(/"/g, '') : ''}`;
        return `<span class="termometro-item" title="${tituloTooltip}">${opcao.emoji || '•'}<small>${dataFormatada}</small></span>`;
    }).join('');
}

/* ----------------------------------------------------------------------
   CARTAS CONDICIONAIS
   ----------------------------------------------------------------------
   Cartas (CARTAS_CONDICIONAIS, js/config.js) liberadas quando o gatilho
   descrito realmente acontecer — nunca sozinhas, nunca por data. Dá pra
   liberar de duas formas: (1) pelo painel administrativo em
   diagnostico.html, protegido pela senha de reset (ver
   alternarCartaCondicional() em js/diagnostics.js) — uma liberação de
   emergência, sem precisar dos dois; ou (2) tocando direto no cartão
   ainda bloqueado, que agora exige o consentimento dos DOIS: aparecem
   os botões "Ana" e "Gabriel", cada um digita a própria senha (a mesma
   do Quadro de Previsões, ver solicitarSenhaPrevisoes() acima) pra
   confirmar. Só quando os dois já confirmaram é que a carta libera de
   verdade e abre. As confirmações parciais ficam salvas em
   'aurora_cartas_condicionais_confirmacoes' (sincroniza entre
   aparelhos), então dá pra um confirmar num dia e o outro confirmar
   depois, em outro momento/aparelho.
   ---------------------------------------------------------------------- */
async function renderizarCartasCondicionais() {
    const wrap = document.getElementById('cartasCondicionaisWrap');
    if (!wrap) return;
    if (!Array.isArray(CARTAS_CONDICIONAIS) || !CARTAS_CONDICIONAIS.length) { wrap.classList.add('d-none'); return; }
    wrap.classList.remove('d-none');

    const [salvo, salvoConfirmacoes] = await Promise.all([
        obterConfiguracao('aurora_cartas_condicionais_liberadas'),
        obterConfiguracao('aurora_cartas_condicionais_confirmacoes'),
    ]);
    const liberadas = salvo ? JSON.parse(salvo) : [];
    const confirmacoes = salvoConfirmacoes ? JSON.parse(salvoConfirmacoes) : {};

    const lista = document.getElementById('cartasCondicionaisLista');
    if (!lista) return;
    lista.innerHTML = CARTAS_CONDICIONAIS.map((carta) => {
        const liberada = liberadas.includes(carta.id);
        const confirmacao = confirmacoes[carta.id] || {};
        const anaOk = Boolean(confirmacao.ana);
        const gabrielOk = Boolean(confirmacao.gabriel);
        return `
            <div class="carta-condicional-item">
                <button type="button" class="carta-condicional-card ${liberada ? 'liberada' : 'bloqueada'}" data-id="${carta.id}">
                    <i class="bi ${liberada ? 'bi-envelope-heart-fill' : 'bi-lock-fill'} me-2"></i>
                    <span class="carta-condicional-titulo">${carta.titulo}</span>
                    <span class="carta-condicional-gatilho">${liberada ? 'Toque para ler' : carta.gatilho}</span>
                </button>
                ${liberada ? '' : `
                <div class="carta-condicional-confirm d-none" id="cartaCondicionalConfirm_${carta.id}">
                    <p class="carta-condicional-confirm-texto">Isso já aconteceu de verdade? Os dois precisam confirmar (com a própria senha) pra abrir.</p>
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-outline-light btn-sm rounded-pill flex-fill btn-carta-condicional-pessoa" data-id="${carta.id}" data-pessoa="ana" ${anaOk ? 'disabled' : ''}>
                            ${anaOk ? '<i class="bi bi-check-circle-fill me-1"></i>' : ''}${NOME_DELA_APELIDO}
                        </button>
                        <button type="button" class="btn btn-outline-light btn-sm rounded-pill flex-fill btn-carta-condicional-pessoa" data-id="${carta.id}" data-pessoa="gabriel" ${gabrielOk ? 'disabled' : ''}>
                            ${gabrielOk ? '<i class="bi bi-check-circle-fill me-1"></i>' : ''}${NOME_DELE}
                        </button>
                    </div>
                    <p class="small text-white-50 text-center mt-2 mb-0">Senha de cada um — a mesma do Quadro de Previsões.</p>
                </div>`}
            </div>
        `;
    }).join('');

    lista.querySelectorAll('.carta-condicional-card.liberada').forEach((btn) => {
        btn.addEventListener('click', () => {
            const carta = CARTAS_CONDICIONAIS.find(c => c.id === btn.dataset.id);
            if (!carta) return;
            abrirModoVela(carta.titulo, carta.texto.replace(/\n/g, '<br>'), `Com amor, ${NOME_DELE}.`);
        });
    });

    // Cartas ainda bloqueadas: ao tocar, mostra a caixinha com os botões
    // "Ana" e "Gabriel" (em vez de não fazer nada, como antes). Cada
    // cartão tem sua própria caixinha, escondida por padrão.
    lista.querySelectorAll('.carta-condicional-card.bloqueada').forEach((btn) => {
        btn.addEventListener('click', () => {
            const idAtual = btn.dataset.id;
            lista.querySelectorAll('.carta-condicional-confirm').forEach((caixa) => {
                if (caixa.id !== `cartaCondicionalConfirm_${idAtual}`) caixa.classList.add('d-none');
            });
            const caixaAtual = document.getElementById(`cartaCondicionalConfirm_${idAtual}`);
            if (caixaAtual) caixaAtual.classList.toggle('d-none');
        });
    });

    // Botões "Ana" / "Gabriel" dentro da caixinha: cada um pede a senha
    // de previsões da respectiva pessoa (solicitarSenhaPrevisoes). Só
    // quando os dois já confirmaram (ana E gabriel) a carta é liberada
    // de verdade e aberta.
    lista.querySelectorAll('.btn-carta-condicional-pessoa').forEach((btn) => {
        btn.addEventListener('click', async (evt) => {
            evt.stopPropagation();
            if (btn.disabled) return;

            const id = btn.dataset.id;
            const pessoa = btn.dataset.pessoa; // 'ana' ou 'gabriel'
            const carta = CARTAS_CONDICIONAIS.find(c => c.id === id);
            if (!carta) return;

            if (!previsoesEstaConfigurado(pessoa)) {
                alert('O quadro de previsões ainda não tem a senha do Gabriel configurada (ver SENHA_PREVISOES_GABRIEL_HASH em js/config.js).');
                return;
            }

            const ok = await solicitarSenhaPrevisoes(pessoa);
            if (!ok) return;

            const salvoAgora = await obterConfiguracao('aurora_cartas_condicionais_confirmacoes');
            const confirmacoesAgora = salvoAgora ? JSON.parse(salvoAgora) : {};
            confirmacoesAgora[id] = confirmacoesAgora[id] || {};
            confirmacoesAgora[id][pessoa] = true;
            await salvarConfiguracao('aurora_cartas_condicionais_confirmacoes', JSON.stringify(confirmacoesAgora), true);

            const osDoisConfirmaram = Boolean(confirmacoesAgora[id].ana && confirmacoesAgora[id].gabriel);
            if (osDoisConfirmaram) {
                const salvoLiberadas = await obterConfiguracao('aurora_cartas_condicionais_liberadas');
                const liberadasAgora = salvoLiberadas ? JSON.parse(salvoLiberadas) : [];
                if (!liberadasAgora.includes(id)) liberadasAgora.push(id);
                await salvarConfiguracao('aurora_cartas_condicionais_liberadas', JSON.stringify(liberadasAgora), true);

                await renderizarCartasCondicionais(); // reconstrói a lista já com o cartão liberado
                abrirModoVela(carta.titulo, carta.texto.replace(/\n/g, '<br>'), `Com amor, ${NOME_DELE}.`);
            } else {
                // Só um dos dois confirmou até agora — reconstrói a lista
                // (pra mostrar o check de quem já confirmou) e mantém essa
                // caixinha aberta, esperando a outra pessoa.
                await renderizarCartasCondicionais();
                const caixaAtual = document.getElementById(`cartaCondicionalConfirm_${id}`);
                if (caixaAtual) caixaAtual.classList.remove('d-none');
            }
        });
    });
}

/* ----------------------------------------------------------------------
   MODO SILENCIOSO PRA BRIGAS
   ----------------------------------------------------------------------
   Botão irmão da "carta de discussão" (ver iniciarCartaDiscussao acima),
   mas sem senha e sem passo nenhum no meio — pra usar bem no meio de um
   desentendimento, antes mesmo de chegar na carta grande. Só mostra uma
   mensagem calma (TEXTOS.modoSilenciosoTexto, js/config.js).
   ---------------------------------------------------------------------- */
function iniciarModoSilencioso() {
    const botao = document.getElementById('btnModoSilencioso');
    if (!botao) return;
    botao.addEventListener('click', () => {
        abrirModoVela(TEXTOS.modoSilenciosoTitulo, TEXTOS.modoSilenciosoTexto.replace(/\n/g, '<br>'), `${NOME_DELE}.`);
    });
}

/* ----------------------------------------------------------------------
   MURAL DA ANA
   ----------------------------------------------------------------------
   Espaço livre pra ela escrever pensamentos, poemas e afins (sem
   pergunta nem estrutura fixa) — abre num overlay em estilo "livro"
   (mesmo "papel" claro já usado pela carta de discussão/previsões), com
   um campo de texto pra escrever e uma lista dos textos já guardados
   (mais recente primeiro), cada um com opção de apagar. Fica dentro da
   mesma área já protegida pela senha de "Nossa História" (ver
   solicitarSenhaMemorias acima).
   ---------------------------------------------------------------------- */
async function obterMural() {
    return obterMensagensMural();
}

let muralSalvando = false;
let muralQuantidadeVisivel = 20;
let muralRenderSequencia = 0;

window.addEventListener('poloni:nuvem-atualizada', () => {
    if (!muralSalvando) renderizarMural().catch(erro => console.error('Falha ao atualizar o mural:', erro));
    renderizarResumoChecklist().catch(erro => console.error('Falha ao atualizar o resumo:', erro));
});

async function salvarNovoTextoMural() {
    if (muralSalvando) return;
    const input = document.getElementById('muralTextoInput');
    const status = document.getElementById('muralStatus');
    const botao = document.getElementById('btnSalvarMural');
    const texto = input ? input.value.trim() : '';
    if (!texto) return;
    muralSalvando = true;
    if (botao) botao.disabled = true;
    try {
        const salvo = await salvarMensagemMural({ id: gerarIdUnico('mural'), data: new Date().toISOString(), texto });
        if (!salvo) throw new Error('Não foi possível salvar neste aparelho. Copie seu texto antes de fechar a página.');

        if (input) input.value = '';
        if (status) {
            status.textContent = 'Guardado neste aparelho. A nuvem será atualizada em seguida.';
            status.className = 'save-status ok';
            setTimeout(() => { status.textContent = ''; }, 2500);
        }
        await renderizarMural();
    } catch (erro) {
        if (status) {
            status.textContent = erro.message || 'Não foi possível salvar. Seu texto continua no campo.';
            status.className = 'save-status err';
        }
    } finally {
        muralSalvando = false;
        if (botao) botao.disabled = false;
    }
}

async function excluirTextoMural(id) {
    if (!confirm('Apagar este texto? Essa ação não pode ser desfeita.')) return;
    try {
        const item = (await obterMural()).find(mensagem => mensagem.id === id);
        if (!item) return;
        if (!await salvarMensagemMural({ ...item, excluidoEm: new Date().toISOString() })) throw new Error('Não foi possível guardar a exclusão neste aparelho.');
        await renderizarMural();
    } catch (erro) {
        const status = document.getElementById('muralStatus');
        if (status) { status.textContent = erro.message; status.className = 'save-status err'; }
    }
}

// Mantém o subtítulo do cartão de entrada ("Seu mural") em dia com a
// quantidade de textos já guardados — só um detalhe a mais pra deixar o
// cartão menos estático e mais convidativo (ver estilo em .mural-cta-sub).
function atualizarMuralCtaSub(quantidade) {
    const sub = document.getElementById('muralCtaSub');
    if (!sub) return;
    if (!quantidade) sub.textContent = 'Um espaço só seu, pra escrever à vontade';
    else if (quantidade === 1) sub.textContent = '1 texto guardado até agora';
    else sub.textContent = `${quantidade} textos guardados até agora`;
}

async function renderizarMural() {
    const renderAtual = ++muralRenderSequencia;
    const lista = document.getElementById('muralLista');
    if (!lista) return;
    const itens = (await obterMural()).filter(item => !item.excluidoEm);
    if (renderAtual !== muralRenderSequencia) return;
    atualizarMuralCtaSub(itens.length);

    if (!itens.length) {
        lista.innerHTML = `
            <div class="mural-vazio">
                <i class="bi bi-journal-plus mural-vazio-icone" aria-hidden="true"></i>
                <p class="mural-vazio-texto">Ainda não tem nada aqui, mas vai ter. Escreva o que quiser, sem pressa.</p>
            </div>
        `;
        return;
    }

    lista.innerHTML = itens.slice().reverse().slice(0, muralQuantidadeVisivel).map((item) => {
        const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `
            <div class="mural-item">
                <div class="mural-item-topo">
                    <span class="mural-item-data">${dataFormatada}</span>
                    <button type="button" class="mural-item-excluir" data-id="${escaparHtml(item.id)}" aria-label="Apagar este texto"><i class="bi bi-trash3"></i></button>
                </div>
                <p class="mural-item-texto">${escaparHtml(item.texto).replace(/\n/g, '<br>')}</p>
            </div>
        `;
    }).join('');

    if (itens.length > muralQuantidadeVisivel) {
        const mais = document.createElement('button');
        mais.type = 'button';
        mais.className = 'mural-ver-mais';
        mais.textContent = `Ver mais (${itens.length - muralQuantidadeVisivel} restantes)`;
        mais.addEventListener('click', () => { muralQuantidadeVisivel += 20; renderizarMural(); });
        lista.appendChild(mais);
    }

    lista.querySelectorAll('.mural-item-excluir').forEach((btn) => {
        btn.addEventListener('click', () => excluirTextoMural(btn.dataset.id));
    });
}

function abrirMural() {
    muralQuantidadeVisivel = 20;
    const overlay = document.getElementById('muralOverlay');
    if (!overlay) return;
    overlay.classList.remove('d-none');
    overlay.scrollTop = 0;
    bloquearScrollFundoLembranca();
    renderizarMural();
}

function fecharMural() {
    const overlay = document.getElementById('muralOverlay');
    if (!overlay) return;
    overlay.classList.add('d-none');
    desbloquearScrollFundoLembranca();
}

function iniciarMural() {
    const botaoAbrir = document.getElementById('btnAbrirMural');
    if (!botaoAbrir) return;
    const introEl = document.getElementById('muralIntro');
    if (introEl) introEl.textContent = TEXTOS.muralIntro;
    obterMural().then((itens) => atualizarMuralCtaSub(itens.filter(item => !item.excluidoEm).length)).catch(() => {});
    botaoAbrir.addEventListener('click', abrirMural);
    const botaoFechar = document.getElementById('btnFecharMural');
    if (botaoFechar) botaoFechar.addEventListener('click', fecharMural);
    const botaoSalvar = document.getElementById('btnSalvarMural');
    if (botaoSalvar) botaoSalvar.addEventListener('click', salvarNovoTextoMural);
}
