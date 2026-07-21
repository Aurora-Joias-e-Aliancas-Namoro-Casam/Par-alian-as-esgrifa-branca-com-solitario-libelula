/**
 * ============================================================================
 * ROMANCE.JS — Página "Nossa História"
 * ============================================================================
 * Reúne: contador vivo do relacionamento, timeline com fotos, "nossos
 * momentos", playlist, quiz, seleção de regras do contrato, lembranças
 * (prints salvos pelo usuário), cápsula do tempo e o easter egg do
 * sobrenome.
 * ============================================================================
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

async function obterOuCriarDataPrimeiroAcesso() {
    let data = await obterConfiguracao('aurora_primeiro_acesso');
    if (!data) { data = new Date().toISOString(); await salvarConfiguracao('aurora_primeiro_acesso', data); }
    return data;
}

let contadorVivoIntervalo = null;
async function iniciarContadorVivo() {
    const grid = document.getElementById('liveCounterGrid');
    if (!grid) return;
    if (contadorVivoIntervalo) clearInterval(contadorVivoIntervalo);
    const dataInicio = await obterOuCriarDataPrimeiroAcesso();

    function atualizar() {
        const d = calcularDuracaoRelacionamento(dataInicio);
        document.getElementById('lcAnos').textContent = d.anos;
        document.getElementById('lcMeses').textContent = d.meses;
        document.getElementById('lcDias').textContent = d.dias;
        document.getElementById('lcHoras').textContent = String(d.horas).padStart(2, '0');
        document.getElementById('lcMinutos').textContent = String(d.minutos).padStart(2, '0');
        document.getElementById('lcSegundos').textContent = String(d.segundos).padStart(2, '0');
    }
    atualizar();
    contadorVivoIntervalo = setInterval(atualizar, 1000);
}

/* ---------------- Timeline ---------------- */
function renderizarTimeline() {
    const container = document.getElementById('timelineLista');
    if (!container) return;
    container.innerHTML = '';

    TIMELINE_MARCOS.forEach(marco => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        const dataHtml = marco.ehPedido ? '<strong id="dataPedidoTimeline">[Hoje]</strong>' : `<strong>${marco.data}</strong>`;
        item.innerHTML = `
            <div class="timeline-item-inner">
                <img class="timeline-thumb" alt="Foto do momento">
                <div>${dataHtml}<p class="small mb-0 mt-1">${marco.texto}</p></div>
            </div>`;
        container.appendChild(item);
        aplicarImagemPlaceholder(item.querySelector('.timeline-thumb'), marco.foto, 'Foto do momento');

        item.querySelector('.timeline-thumb').addEventListener('click', () => {
            const todasFotos = TIMELINE_MARCOS.map(m => getAsset(m.foto));
            abrirLightboxGaleria(todasFotos, TIMELINE_MARCOS.indexOf(marco));
        });
    });
}

/* ---------------- "Nossos momentos" (mesa de fotos) ---------------- */
function iniciarGaleriaMomentos() {
    const galeria = document.getElementById('momentosGallery');
    if (!galeria) return;
    const ids = ['imagem_momento_1', 'imagem_momento_2', 'imagem_momento_3', 'imagem_momento_4'];
    const cartoes = Array.from(galeria.querySelectorAll('.table-photo'));
    cartoes.forEach((cartao, i) => aplicarImagemPlaceholder(cartao.querySelector('img'), ids[i], 'Foto do casal'));

    const urls = ids.map(getAsset);
    cartoes.forEach((cartao, i) => {
        cartao.style.cursor = 'pointer';
        cartao.addEventListener('click', () => abrirLightboxGaleria(urls, i));
    });
}

/* ---------------- Mini quiz "O quanto você me conhece?" ---------------- */
let quizIndiceAtual = 0;
let quizRespostasEscolhidas = [];

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
            document.getElementById('quizResumoTexto').textContent =
                `Não importa quantas você acertou — o que importa é que a gente continua escrevendo essas respostas juntos, todos os dias, ${NOME_DELA}.`;
            finalMsg.classList.remove('d-none');
            finalMsg.classList.add('reveal-up');
            await salvarConfiguracao('aurora_quiz_respostas', JSON.stringify(quizRespostasEscolhidas));
        }
    }, 1600);
}

function iniciarQuiz() {
    quizIndiceAtual = 0; quizRespostasEscolhidas = [];
    document.getElementById('quizCard').classList.remove('d-none');
    document.getElementById('quizFinalMsg').classList.add('d-none');
    mostrarPerguntaQuiz();
}

/* ---------------- Regras do contrato ---------------- */
let regrasSelecionadas = [];
const MAX_REGRAS = 5; // até 5 regras personalizadas (item 5 do prompt de melhorias)
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
        li.innerHTML = `<strong>Art. ${i + 1}º —</strong> ${regra.artigo}`;
        lista.appendChild(li);
    });
    document.getElementById('regrasSelecaoWrap').classList.add('d-none');
    const contratoWrap = document.getElementById('contratoWrap');
    contratoWrap.classList.remove('d-none');
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

/**
 * CORREÇÃO DE SEGURANÇA: esta função revela o texto da carta (e o botão do
 * vídeo, se houver) — antes, ela confiava cegamente em quem a chamava
 * (só era chamada a partir do branch já "desbloqueado" de
 * prepararCapsulaDoTempo). Isso significa que alguém abrindo o console do
 * navegador e digitando "iniciarEnvelopeCapsula()" diretamente conseguia
 * pular a checagem de data inteira. Agora a própria função reconfere a
 * data (com a hora do servidor) antes de mostrar qualquer coisa — mesmo
 * chamada "na unha" pelo console, ela se recusa a abrir antes da hora.
 * Aviso importante (sem prometer o que este site não pode cumprir): isso
 * cobre bem o golpe mais comum (mudar a data/hora do aparelho) e impede
 * abrir o console e pular direto pra função de revelar. Mas como é um
 * site estático, sem servidor/autenticação por trás, alguém tecnicamente
 * capaz de abrir os arquivos-fonte (js/config.js) ainda consegue ler o
 * texto e o ID do vídeo antes da data — isso é uma limitação de QUALQUER
 * site que roda só no navegador, não uma falha específica deste código.
 */
async function iniciarEnvelopeCapsula() {
    const envelope = document.getElementById('capsulaEnvelope');
    const hint = document.getElementById('capsulaHint');
    const textoEl = document.getElementById('capsulaTexto');
    const assinaturaEl = document.getElementById('capsulaAssinatura');
    if (!envelope || envelope.dataset.iniciado === '1') return;

    // CORREÇÃO DE SEGURANÇA (achada testando de verdade, simulando alguém
    // chamando esta função pelo console do navegador): a checagem NUNCA
    // pode confiar no parâmetro "dataAlvoConhecida" recebido de fora —
    // ele existe só como otimização (evita recalcular quando quem chamou,
    // aqui dentro do próprio arquivo, já sabe a data). Se essa validação
    // usasse o valor recebido, bastava chamar
    // "iniciarEnvelopeCapsula(new Date(0))" no console pra passar uma
    // data forjada lá do passado e abrir a carta na hora. Por isso a
    // linha abaixo IGNORA por completo o parâmetro na hora de validar e
    // recalcula a data real (mesma fonte usada em prepararCapsulaDoTempo).
    const dataAlvoReal = await calcularDataDesbloqueioCapsula();
    const agora = await obterHoraConfiavel();
    if (!dataAlvoReal || agora < dataAlvoReal) return; // recusa revelar — reconfirmação real, não decorativa

    envelope.dataset.iniciado = '1';

    textoEl.textContent = textoCapsulaDoTempo();
    assinaturaEl.textContent = `Com amor, ${NOME_DELE}.`;

    // Botão do vídeo do YouTube com a mensagem em vídeo — só existe no DOM
    // a partir daqui (desbloqueio real confirmado), e só se um ID tiver
    // sido preenchido em CAPSULA_YOUTUBE_ID (js/config.js).
    if (CAPSULA_YOUTUBE_ID) {
        const cartaPaper = envelope.querySelector('.letter-paper');
        if (cartaPaper && !cartaPaper.querySelector('.btn-capsula-video')) {
            const btnVideo = document.createElement('a');
            btnVideo.href = `https://www.youtube.com/watch?v=${CAPSULA_YOUTUBE_ID}`;
            btnVideo.target = '_blank';
            btnVideo.rel = 'noopener noreferrer';
            btnVideo.className = 'btn btn-rosegold btn-sm rounded-pill fw-bold mt-3 btn-capsula-video';
            btnVideo.innerHTML = '<i class="bi bi-youtube me-1"></i>Ver o vídeo';
            cartaPaper.appendChild(btnVideo);
        }
    }

    let jaAbriu = false;
    envelope.addEventListener('click', () => {
        if (jaAbriu) return; jaAbriu = true;
        hint.classList.remove('visivel');
        envelope.classList.add('aberto');
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

    const lista = (await obterMediaPorTipo('lembranca')).sort((a, b) => a.criadoEm - b.criadoEm);
    grid.innerHTML = '';
    if (!lista.length) { vazio.classList.remove('d-none'); return; }
    vazio.classList.add('d-none');

    lista.forEach(item => {
        const url = URL.createObjectURL(item.blob);
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'lembranca-item';
        botao.innerHTML = `<img src="${url}" alt="Print de uma conversa antiga">`;
        grid.appendChild(botao);
    });

    const urlsLembrancas = Array.from(grid.querySelectorAll('img')).map(img => img.src);
    Array.from(grid.children).forEach((botao, i) => botao.addEventListener('click', () => abrirLightboxGaleria(urlsLembrancas, i)));
}

/* ---------------- Lightbox reutilizável ---------------- */
let lightboxItensAtuais = [];
let lightboxIndiceAtual = 0;

// Mesma técnica usada em galeria.html: trava o scroll do fundo (inclusive o
// "bounce" do iOS) enquanto o lightbox está aberto, restaurando a posição
// exata de onde a pessoa estava ao fechar.
let __lembrancaScrollSalvo = 0;
function bloquearScrollFundoLembranca() {
    __lembrancaScrollSalvo = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('aurora-scroll-lock');
    document.body.style.top = `-${__lembrancaScrollSalvo}px`;
}
function desbloquearScrollFundoLembranca() {
    document.documentElement.classList.remove('aurora-scroll-lock');
    document.body.style.top = '';
    window.scrollTo(0, __lembrancaScrollSalvo);
}

function abrirLightboxGaleria(itens, indiceInicial) {
    if (!itens || !itens.length) return;
    lightboxItensAtuais = itens;
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
}

function lightboxFotoAnterior() { lightboxIndiceAtual = (lightboxIndiceAtual - 1 + lightboxItensAtuais.length) % lightboxItensAtuais.length; atualizarImagemLightbox(); }
function lightboxProximaFoto() { lightboxIndiceAtual = (lightboxIndiceAtual + 1) % lightboxItensAtuais.length; atualizarImagemLightbox(); }
function fecharLembrancaAmpliada() {
    document.getElementById('lembrancaLightbox').classList.add('d-none');
    document.getElementById('lembrancaLightboxImg').src = '';
    lightboxItensAtuais = [];
    desbloquearScrollFundoLembranca();
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
function mostrarLoadingRomance() {
    const overlay = document.getElementById('romanceLoadingOverlay');
    const barra = document.getElementById('romanceLoadingBarra');
    if (barra) barra.style.width = '6%';
    if (overlay) { overlay.style.opacity = '1'; overlay.classList.remove('d-none'); }
    bloquearScrollFundoLembranca(); // mesma trava usada no lightbox — consistente em todo o site
}

function esconderLoadingRomance() {
    const overlay = document.getElementById('romanceLoadingOverlay');
    desbloquearScrollFundoLembranca();
    if (!overlay) return;
    overlay.style.opacity = '0';
    setTimeout(() => overlay.classList.add('d-none'), 300);
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
    const marcarProgresso = () => {
        concluidas++;
        if (barra) barra.style.width = `${Math.max(6, Math.round((concluidas / total) * 100))}%`;
    };
    await Promise.all(tarefas.map(tarefa =>
        Promise.resolve(tarefa)
            .then(marcarProgresso)
            .catch(err => { console.error('Falha ao carregar um item de Nossa História:', err); marcarProgresso(); })
    ));
}

async function goToRomancePage() {
    document.getElementById('lojaScreen').style.display = 'none';
    document.getElementById('checkoutScreen').style.display = 'none';
    document.getElementById('suspenseOverlay').style.display = 'none';
    document.getElementById('processingOverlay').style.display = 'none';
    document.getElementById('romancePage').style.display = 'block';
    definirFundoBody(CORES_FUNDO.escuro);
    window.scrollTo(0, 0);
    mostrarLoadingRomance();

    document.getElementById('heroSubRomanceTexto').textContent = TEXTOS.heroSubRomance;
    document.getElementById('encerramentoRomanceTexto').textContent = TEXTOS.encerramentoRomance;

    pausarMusicaFundoImediatamente();
    iniciarPlaylistDaGente();

    // Rápidas e sem leitura pesada no banco — chamadas direto, sem entrar na barra de progresso.
    iniciarQuiz();
    renderizarTimeline();
    iniciarGaleriaMomentos();
    exibirEasterEggSobrenome();
    renderizarCoisasQueElaAma();
    renderizarSeusBichos();

    if (typeof VIDEO_PROCESSO_YOUTUBE_URL !== 'undefined' && VIDEO_PROCESSO_YOUTUBE_URL) {
        const linkProcesso = document.getElementById('linkVideoProcesso');
        const wrapProcesso = document.getElementById('videoProcessoWrap');
        if (linkProcesso && wrapProcesso) {
            linkProcesso.href = VIDEO_PROCESSO_YOUTUBE_URL;
            wrapProcesso.classList.remove('d-none');
        }
    }

    /* CORREÇÃO DE VELOCIDADE (carregamento lento com muita coisa salva e
     * vídeo longo): antes, cada leitura no IndexedDB abaixo rodava uma de
     * cada vez (await em sequência) — o tempo total era a SOMA de todas.
     * Agora rodam em PARALELO (Promise.all): o tempo total passa a ser o
     * da mais lenta (normalmente o próprio vídeo do pedido), não a soma de
     * todas as outras leituras pequenas. localStorage NÃO é uma opção
     * viável aqui: tem limite de ~5–10MB e é síncrono (travaria a aba
     * inteira ao tentar guardar um vídeo de dezenas de MB) — o IndexedDB
     * (assíncrono, sem esse limite) já é a ferramenta certa; o ganho real
     * está em paralelizar as leituras, não em trocar de tecnologia. */
    const tarefas = [
        prepararContrato(),
        iniciarContadorVivo(),
        renderizarLembrancas(),
        renderizarMensagensFuturo(),
        prepararCapsulaDoTempo(),

        obterConfiguracao('aurora_data_pedido').then(dataPedidoIso => {
            if (!dataPedidoIso) return;
            document.getElementById('dataPedidoTexto').textContent = `Nosso pedido: ${formatarDataPedidoComHora(dataPedidoIso)}`;
            const elTimeline = document.getElementById('dataPedidoTimeline');
            if (elTimeline) elTimeline.textContent = formatarDataPedido(dataPedidoIso);

            const dias = Math.max(0, Math.floor((Date.now() - new Date(dataPedidoIso).getTime()) / 86400000));
            document.getElementById('counterText').textContent = dias === 0 ? 'hoje é o nosso primeiro dia' : `${dias} dia${dias === 1 ? '' : 's'} desde que topamos essa juntos`;

            const localData = document.getElementById('contratoLocalData');
            if (localData) localData.textContent = `Nuporanga - SP, ${formatarDataPedido(dataPedidoIso)}.`;
        }),

        obterMedia('video_pedido').then(video => {
            if (video && video.blob) {
                const url = URL.createObjectURL(video.blob);
                document.getElementById('romanceVideo').src = url;
                document.getElementById('romanceVideoWrap').classList.remove('d-none');
                const btnBaixar = document.getElementById('btnBaixarVideoPedido');
                if (btnBaixar) btnBaixar.href = url; // mesmo blob já carregado — download não refaz nenhuma leitura
            }
        }),

        obterMedia('assinatura').then(assinatura => {
            if (assinatura && assinatura.texto) {
                document.getElementById('romanceSignatureImg').src = assinatura.texto;
                document.getElementById('contratoSignatureImg').src = assinatura.texto;
                document.getElementById('romanceSignatureWrap').classList.remove('d-none');
            }
        })
    ];

    await executarComBarraDeProgresso(tarefas);
    esconderLoadingRomance();
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
        setTimeout(() => input.focus(), 300);

        function tentarDesbloquear() {
            const senhaDigitada = (input.value || '').trim();
            if (senhaDigitada === SENHA_AREA_MEMORIAS) {
                try { sessionStorage.setItem('aurora_memorias_desbloqueadas', '1'); } catch (e) { /* ignora */ }
                overlay.classList.add('d-none');
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

/* ---------------- "Coisas que a Poloni ama" ---------------- */
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

    if (Array.isArray(SEUS_BICHOS)) {
        grid.innerHTML = '';
        SEUS_BICHOS.forEach((bicho, i) => {
            const card = document.createElement('div');
            card.className = 'bicho-card';
            card.innerHTML = `<span class="bicho-emoji">${bicho.emoji}</span><span class="bicho-nome">${bicho.nome}</span>`;
            card.addEventListener('click', () => abrirLightboxGaleria(todasAsFotos, i));
            grid.appendChild(card);
        });
    }

    if (Array.isArray(BICHOS_EM_MEMORIA)) {
        const slinky = BICHOS_EM_MEMORIA.find(b => b.destaque);
        const indiceSlinky = todosOsBichos.indexOf(slinky);
        if (slinky && slinkyBox && slinkyTexto) {
            slinkyTexto.textContent = slinky.textoEspecial || '';
            slinkyBox.classList.remove('d-none');
            slinkyBox.addEventListener('click', () => abrirLightboxGaleria(todasAsFotos, indiceSlinky));
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
                span.addEventListener('click', () => abrirLightboxGaleria(todasAsFotos, Number(span.dataset.indice)));
            });
        }
    }
}

/* ---------------- Easter egg do sobrenome ---------------- */
function exibirEasterEggSobrenome() {
    const el = document.getElementById('easterEggSobrenome');
    if (el) el.textContent = TEXTO_EASTER_EGG_SOBRENOME;
}

/* ----------------------------------------------------------------------
   VÍDEO DO PEDIDO NO YOUTUBE (alternativa ao vídeo local, que pode ficar
   grande demais para o armazenamento do celular) — ver item do prompt.
   Fica logo abaixo de "Nossas lembranças". Guardado como configuração
   simples (só o ID do vídeo, texto pequeno) — sincroniza normalmente
   entre aparelhos como qualquer outra configuração do site.
   ---------------------------------------------------------------------- */
async function iniciarVideoYoutubePedido() {
    const idSalvo = await obterConfiguracao('aurora_video_pedido_youtube');
    exibirVideoYoutubePedido(idSalvo);

    document.getElementById('btnSalvarVideoYoutubePedido').addEventListener('click', salvarVideoYoutubePedido);
    document.getElementById('inputVideoYoutubePedido').addEventListener('keydown', (evt) => { if (evt.key === 'Enter') salvarVideoYoutubePedido(); });
    document.getElementById('btnEditarVideoYoutubePedido').addEventListener('click', () => {
        document.getElementById('romanceVideoYoutubePreenchido').classList.add('d-none');
        document.getElementById('romanceVideoYoutubeVazio').classList.remove('d-none');
        document.getElementById('inputVideoYoutubePedido').value = '';
    });
}

async function salvarVideoYoutubePedido() {
    const input = document.getElementById('inputVideoYoutubePedido');
    const status = document.getElementById('videoYoutubePedidoStatus');
    const valor = (input.value || '').trim();

    if (!valor) {
        status.textContent = 'Cole o link do vídeo primeiro.';
        status.className = 'save-status err';
        return;
    }

    const id = extrairIdYoutube(valor);
    if (!id) {
        status.textContent = 'Não consegui reconhecer esse link do YouTube.';
        status.className = 'save-status err';
        return;
    }

    await salvarConfiguracao('aurora_video_pedido_youtube', id);
    status.textContent = '';
    status.className = 'save-status';
    input.value = '';
    exibirVideoYoutubePedido(id);
}

function exibirVideoYoutubePedido(id) {
    const vazio = document.getElementById('romanceVideoYoutubeVazio');
    const preenchido = document.getElementById('romanceVideoYoutubePreenchido');
    if (id) {
        document.getElementById('romanceVideoYoutubeIframe').src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
        vazio.classList.add('d-none');
        preenchido.classList.remove('d-none');
    } else {
        document.getElementById('romanceVideoYoutubeIframe').src = '';
        preenchido.classList.add('d-none');
        vazio.classList.remove('d-none');
    }
}

function iniciarModuloRomance() {
    iniciarVideoYoutubePedido();

    const btnGerarContrato = document.getElementById('btnGerarContrato');
    if (btnGerarContrato) {
        btnGerarContrato.addEventListener('click', async () => {
            if (regrasSelecionadas.length < MIN_REGRAS) return;
            await salvarConfiguracao('aurora_regras_contrato', JSON.stringify(regrasSelecionadas));
            gerarContratoPersonalizado(regrasSelecionadas);
        });
    }

    document.getElementById('btnAdicionarLembranca').addEventListener('click', () => document.getElementById('inputLembrancas').click());
    document.getElementById('inputLembrancas').addEventListener('change', (evt) => { adicionarLembrancas(evt.target.files); evt.target.value = ''; });
    document.getElementById('btnFecharLembranca').addEventListener('click', fecharLembrancaAmpliada);
    document.getElementById('btnLightboxAnterior').addEventListener('click', lightboxFotoAnterior);
    document.getElementById('btnLightboxProxima').addEventListener('click', lightboxProximaFoto);

    document.getElementById('btnReverLoja').addEventListener('click', abrirLojaSomenteVisualizacao);
    document.getElementById('btnVoltarDaLoja').addEventListener('click', fecharLojaSomenteVisualizacao);
}

/* ----------------------------------------------------------------------
   "REVER A LOJINHA" — só visualização, nunca afeta o que já foi gravado
   ----------------------------------------------------------------------
   Depois que tudo já aconteceu, a pessoa pode querer rever a "lojinha
   falsa" das alianças (o disfarce inicial do site) só por nostalgia. Isso
   NÃO deve, de jeito nenhum, poder reiniciar o pedido — por isso o botão
   "Confirmar Pagamento" da loja fica escondido enquanto estiver em modo
   visualização, e nada aqui grava nada no banco.
   ---------------------------------------------------------------------- */
function abrirLojaSomenteVisualizacao() {
    document.getElementById('romancePage').style.display = 'none';
    const loja = document.getElementById('lojaScreen');
    loja.style.display = '';
    definirFundoBody(CORES_FUNDO.claro);

    const botaoConfirmar = document.getElementById('btnConfirmarPedido');
    if (botaoConfirmar) botaoConfirmar.classList.add('d-none'); // impede reiniciar o pedido sem querer

    trocarNomeLojaParaVisualizacao(true);

    document.getElementById('modoVisualizacaoBarra').classList.remove('d-none');
    window.scrollTo(0, 0);
}

function fecharLojaSomenteVisualizacao() {
    document.getElementById('lojaScreen').style.display = 'none';
    const botaoConfirmar = document.getElementById('btnConfirmarPedido');
    if (botaoConfirmar) botaoConfirmar.classList.remove('d-none');

    trocarNomeLojaParaVisualizacao(false);

    document.getElementById('modoVisualizacaoBarra').classList.add('d-none');
    document.getElementById('romancePage').style.display = '';
    definirFundoBody(CORES_FUNDO.escuro);
    window.scrollTo(0, 0);
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
