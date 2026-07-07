/**
 * ============================================================================
 * CONFIG.JS — Painel de controle do projeto
 * ============================================================================
 * Este é o ÚNICO arquivo que você deve precisar editar no dia a dia.
 * Aqui ficam: os placeholders de mídia (Prioridade 3), os nomes, a história,
 * as perguntas, o quiz, a timeline, a playlist, as regras do contrato e os
 * textos principais do site.
 *
 * Nada neste arquivo depende de URLs temporárias — todo caminho de mídia usa
 * um identificador (ex: "imagem_casal_1") que é resolvido pela função
 * getAsset() lá embaixo. Basta colocar o arquivo real na pasta indicada,
 * com o nome indicado, que o site passa a usá-lo automaticamente.
 * ============================================================================
 */

/* ----------------------------------------------------------------------
   PESSOAS
   ---------------------------------------------------------------------- */
const NOME_DELA = "Ana"; // Como o site vai chamá-la na maior parte do tempo (Poloni também aparece em alguns textos)
const NOME_DELA_APELIDO = "Poloni";
const NOME_DELE = "Gabriel";
const NOME_DELE_COMPLETO = "Gabriel Schmeisk";

/* ----------------------------------------------------------------------
   IDENTIDADE FIXA DA EXPERIÊNCIA (sincronização entre aparelhos)
   ----------------------------------------------------------------------
   Diferente de um "código de compartilhamento" aleatório, este projeto é
   feito para UMA única pessoa e UMA única experiência. Por isso usamos um
   identificador FIXO: não importa em qual aparelho o link for aberto, ele
   sempre lê/escreve o mesmo registro na nuvem (ver js/sync.js). É isso que
   permite abrir o link puro (sem parâmetros na URL) em qualquer celular e
   ver exatamente o mesmo estado.
   Troque esta string se um dia for reaproveitar o projeto para outro
   casal, para não misturar dados de experiências diferentes.
   ---------------------------------------------------------------------- */
const EXPERIENCE_ID = 'aurora-ana-gabriel-namoro';

/* ----------------------------------------------------------------------
   VALORES PADRÃO DA HOME DA JOALHERIA
   ----------------------------------------------------------------------
   Preenchidos automaticamente nos campos de "Personalize seu pedido"
   assim que o site abre (podem ainda ser alterados manualmente na tela,
   caso necessário). Edite aqui para trocar os valores padrão de uma vez.
   ---------------------------------------------------------------------- */
const PEDIDO_PADRAO = {
    aroMasc: '19',
    aroFem: '13',
    aroSolitario: '13',
    gravacaoMasc: 'Poloni ♡ 14/06',
    gravacaoFem: 'Schmeisk ♡ 14/06'
};

/* ----------------------------------------------------------------------
   REGISTRO DE PLACEHOLDERS (PRIORIDADE 3)
   ----------------------------------------------------------------------
   Cada entrada representa um arquivo que você vai enviar para o GitHub.
   - "arquivo": nome exato do arquivo dentro de assets/img, assets/video ou
     assets/audio (mantenha esses nomes ou atualize aqui se preferir outros).
   - "tipo": "imagem" | "video" | "audio"
   - "descricao": o que deve aparecer nesse espaço.

   Enquanto o arquivo real não existir, o site mostra automaticamente um
   quadro elegante no lugar (sem imagem quebrada, sem link temporário).
   ---------------------------------------------------------------------- */
const PLACEHOLDERS = {
    // ---- Produto (loja falsa) ----
    imagem_produto_principal:   { arquivo: 'produto-principal.jpg',   tipo: 'imagem', descricao: 'Foto principal da "aliança" (pode ser qualquer foto de alianças/anéis genérica)' },
    imagem_produto_detalhe:     { arquivo: 'produto-detalhe.jpg',     tipo: 'imagem', descricao: 'Detalhe do solitário/libélula' },
    imagem_produto_estojo:      { arquivo: 'produto-estojo.jpg',      tipo: 'imagem', descricao: 'Aliança no estojo' },
    imagem_produto_par:         { arquivo: 'produto-par.jpg',         tipo: 'imagem', descricao: 'Par de alianças completo' },
    imagem_colecao_flor_rosa:   { arquivo: 'colecao-flor-rosa.jpg',   tipo: 'imagem', descricao: 'Destaque "coleção Flor Rosa"' },
    imagem_colecao_libelula:    { arquivo: 'colecao-libelula.jpg',    tipo: 'imagem', descricao: 'Destaque "coleção Libélula"' },
    imagem_colecao_prata:       { arquivo: 'colecao-prata.jpg',       tipo: 'imagem', descricao: 'Destaque "linha Prata 950"' },
    imagem_colecao_estojos:     { arquivo: 'colecao-estojos.jpg',     tipo: 'imagem', descricao: 'Destaque "estojos"' },
    imagem_relacionado_colar:   { arquivo: 'relacionado-colar.jpg',   tipo: 'imagem', descricao: '"Você também pode gostar" — colar' },
    imagem_relacionado_brinco:  { arquivo: 'relacionado-brinco.jpg',  tipo: 'imagem', descricao: '"Você também pode gostar" — brinco' },
    imagem_relacionado_pulseira:{ arquivo: 'relacionado-pulseira.jpg',tipo: 'imagem', descricao: '"Você também pode gostar" — pulseira' },
    imagem_relacionado_estojo:  { arquivo: 'relacionado-estojo.jpg',  tipo: 'imagem', descricao: '"Você também pode gostar" — estojo' },

    // ---- Casal / galeria de suspense ----
    imagem_casal_1: { arquivo: 'casal-1.jpg', tipo: 'imagem', descricao: 'Foto do casal — usada na galeria de polaroids durante o suspense' },
    imagem_casal_2: { arquivo: 'casal-2.jpg', tipo: 'imagem', descricao: 'Foto do casal — galeria de polaroids' },
    imagem_casal_3: { arquivo: 'casal-3.jpg', tipo: 'imagem', descricao: 'Foto do casal — galeria de polaroids' },
    imagem_foto_final: { arquivo: 'foto-final.jpg', tipo: 'imagem', descricao: 'Foto principal exibida logo após a "identidade confirmada"' },

    // ---- Flashback cinematográfico ----
    imagem_flashback_1: { arquivo: 'flashback-1.jpg', tipo: 'imagem', descricao: 'Flashback — "onde tudo começou"' },
    imagem_flashback_2: { arquivo: 'flashback-2.jpg', tipo: 'imagem', descricao: 'Flashback — "as risadinhas de sempre"' },
    imagem_flashback_3: { arquivo: 'flashback-3.jpg', tipo: 'imagem', descricao: 'Flashback — "os perrengues que resolvemos juntos" (ex: dia do atoleiro)' },
    imagem_flashback_4: { arquivo: 'flashback-4.jpg', tipo: 'imagem', descricao: 'Flashback — "os dias mais simples"' },
    imagem_flashback_5: { arquivo: 'flashback-5.jpg', tipo: 'imagem', descricao: 'Flashback — "e hoje, mais um capítulo"' },

    // ---- Timeline (Nossa História) ----
    imagem_timeline_1: { arquivo: 'timeline-1.jpg', tipo: 'imagem', descricao: 'Timeline — quando você comentou com a Vitória / dias antes de se conhecerem' },
    imagem_timeline_2: { arquivo: 'timeline-2.jpg', tipo: 'imagem', descricao: 'Timeline — 11/05, carona e primeira conversa de verdade' },
    imagem_timeline_3: { arquivo: 'timeline-3.jpg', tipo: 'imagem', descricao: 'Timeline — 30/05, primeiro encontro no Colina (Orlândia) e o beijo' },
    imagem_timeline_4: { arquivo: 'timeline-4.jpg', tipo: 'imagem', descricao: 'Timeline — o dia do atoleiro na estrada de terra' },
    imagem_timeline_5: { arquivo: 'timeline-5.jpg', tipo: 'imagem', descricao: 'Timeline — despedida do Slinky / acolhimento da família dela' },
    imagem_timeline_6: { arquivo: 'timeline-6.jpg', tipo: 'imagem', descricao: 'Timeline — 14/06, o "eu te amo" depois da Brooks' },
    imagem_timeline_hoje: { arquivo: 'timeline-hoje.jpg', tipo: 'imagem', descricao: 'Timeline — foto de hoje, marcando o dia do pedido' },

    // ---- Nossos momentos (mesa de fotos) ----
    imagem_momento_1: { arquivo: 'momento-1.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },
    imagem_momento_2: { arquivo: 'momento-2.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },
    imagem_momento_3: { arquivo: 'momento-3.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },
    imagem_momento_4: { arquivo: 'momento-4.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },

    // ---- Vídeo / áudio ----
    video_carta: { arquivo: 'video-carta.mp4', tipo: 'video', descricao: '(Opcional) Vídeo que pode ser exibido antes da carta abrir, se você quiser gravar algo previamente' },
    audio_nossa_musica: { arquivo: 'nossa-musica.mp3', tipo: 'audio', descricao: 'A trilha que toca ao abrir a carta final (ex: Um Dia Te Levo Comigo)' },
    audio_playlist_1: { arquivo: 'playlist-1.mp3', tipo: 'audio', descricao: 'Faixa 1 da playlist do casal' },
    audio_playlist_2: { arquivo: 'playlist-2.mp3', tipo: 'audio', descricao: 'Faixa 2 da playlist do casal' },
    audio_playlist_3: { arquivo: 'playlist-3.mp3', tipo: 'audio', descricao: 'Faixa 3 da playlist do casal' },
    audio_playlist_4: { arquivo: 'playlist-4.mp3', tipo: 'audio', descricao: 'Faixa 4 da playlist do casal' },
};

/**
 * Devolve a URL utilizável de um placeholder. Sempre aponta para a pasta
 * local de assets — nunca para um link temporário externo.
 */
function getAsset(id) {
    const item = PLACEHOLDERS[id];
    if (!item) { console.warn(`Placeholder desconhecido: ${id}`); return ''; }
    const pasta = item.tipo === 'imagem' ? 'assets/img' : (item.tipo === 'video' ? 'assets/video' : 'assets/audio');
    return `${pasta}/${item.arquivo}`;
}

/* ----------------------------------------------------------------------
   GALERIA DE LEMBRANÇAS (página própria — galeria.html)
   ----------------------------------------------------------------------
   Padrão de nomenclatura (documentado aqui desde o início do projeto,
   como pedido): salve as fotos dentro de assets/img/galeria/ sempre com
   o nome:

       galeria_1.jpg
       galeria_2.jpg
       galeria_3.jpg
       galeria_4.jpg
       ...

   Sem limite de quantidade — a galeria foi feita para crescer com o
   passar dos anos. Para adicionar novas fotos:
     1. Salve o arquivo em assets/img/galeria/ com o próximo número da
        sequência (ex.: se a última foi galeria_37.jpg, a próxima é
        galeria_38.jpg). Aceita .jpg, .jpeg, .png e .webp.
     2. Atualize apenas o número abaixo, em TOTAL_FOTOS_GALERIA, para o
        total de fotos que agora existem.
     3. Pronto — nenhum outro arquivo do projeto precisa ser tocado.

   Legendas são opcionais: para dar uma frase a uma foto específica,
   adicione uma entrada em GALERIA_LEGENDAS usando o mesmo número.
   ---------------------------------------------------------------------- */
const TOTAL_FOTOS_GALERIA = 12; // <- atualize este número sempre que adicionar fotos novas

const GALERIA_LEGENDAS = {
    // 1: 'O dia do atoleiro — rimos até doer a barriga.',
    // 2: 'Colina, 30/05. O começo de tudo.',
};

const PASTA_GALERIA = 'assets/img/galeria';

/** Caminho do arquivo de uma foto da galeria pelo número (ver padrão acima). */
function getAssetGaleria(numero) {
    return `${PASTA_GALERIA}/galeria_${numero}.${EXTENSAO_GALERIA[numero] || 'jpg'}`;
}

const EXTENSAO_GALERIA = {
    // Se alguma foto específica não for .jpg, informe a extensão real aqui.
    // Exemplo: 5: 'png',
};

/* ----------------------------------------------------------------------
   NOSSA HISTÓRIA — LINHA DO TEMPO
   ---------------------------------------------------------------------- */
const TIMELINE_MARCOS = [
    {
        data: 'Antes de tudo',
        texto: `A primeira vez que eu vi você foi dias antes de te conhecer de verdade. Você caminhava com a Vitória e eu falei pra ela, sem pensar duas vezes: "sua amiga de cabelo loiro é muito linda". Fiquei com vergonha demais até de te adicionar no Instagram — no fim foi você quem me adicionou.`,
        foto: 'imagem_timeline_1'
    },
    {
        data: '11 de maio',
        texto: `Nos encontramos na faculdade. A Vitória pediu carona e você veio junto. Conversamos muito, nos demos incrivelmente bem — e mesmo assim, por um tempo, ficou só nisso. Continuei te dando carona nos dias seguintes e um dia até "esqueci" seu power bank comigo só pra ter desculpa de te chamar.`,
        foto: 'imagem_timeline_2'
    },
    {
        data: '30 de maio',
        texto: `Nosso primeiro encontro. Colina, em Orlândia, 20h30 — que na prática viraram quase 22h, porque alguém demorou uma eternidade pra ficar pronta. Valeu cada segundo de espera. Ficamos horas no carro conversando, e quando eu já ia desistir de ter coragem, você perguntou: "e o nosso beijo, nada?". Foi ali que tudo se encaixou.`,
        foto: 'imagem_timeline_3'
    },
    {
        data: 'Uma estrada de terra',
        texto: `Fomos parar numa estrada de terra e o carro atolou de vez. Eu me sujei inteiro de barro, perdi o triângulo tentando tirar o carro do buraco — e mesmo assim rimos do começo ao fim. Prova de que qualquer perrengue com você vira boa lembrança.`,
        foto: 'imagem_timeline_4'
    },
    {
        data: 'Um momento difícil',
        texto: `Também vivemos dias difíceis. Levei o Slinky ao veterinário com você e, pouco depois, tivemos que nos despedir dele. Fiquei do seu lado o tempo todo — e foi aí que também conheci sua família de verdade: busquei seu pai no trabalho, conversei com sua mãe, conheci seu irmão. Mesmo num momento triste, me senti acolhido por todos vocês.`,
        foto: 'imagem_timeline_5'
    },
    {
        data: '14 de junho',
        texto: `Nossa data. Estávamos no carro depois de sair da Brooks quando eu disse, pela primeira vez, "eu te amo" — e você respondeu do mesmo jeito. Foi o dia em que aquilo que a gente já sentia se tornou oficial. Foi por essa época que "Um Dia Te Levo Comigo" virou a nossa música.`,
        foto: 'imagem_timeline_6'
    },
    {
        data: null,
        texto: `E hoje: mesmo com pouco tempo juntos, parece que a gente se conhece há anos. Tenho certeza absoluta de que encontrei o amor da minha vida — e de que foi Deus quem colocou você no meu caminho. Ainda não sei se esse pedido vai dar certo, mas de uma coisa eu tenho certeza: eu te amo mais do que consigo colocar em palavras.`,
        foto: 'imagem_timeline_hoje',
        ehPedido: true
    }
];

/* ----------------------------------------------------------------------
   PERGUNTAS ROMÂNTICAS — "Enquanto confirmamos seu pedido"
   ----------------------------------------------------------------------
   O botão "Não" nunca é clicável de verdade (ver suspense.js), então as
   duas opções podem ser lidas como duas formas diferentes de dizer "sim".
   ---------------------------------------------------------------------- */
const PERGUNTAS_SUSPENSE = [
    {
        texto: `Antes de continuarmos: você acha que já rimos o suficiente hoje, ou ainda cabe mais uma risadinha?`,
        sim: `Sempre cabe mais uma`,
        nao: `Nunca é suficiente`
    },
    {
        texto: `Se eu pedir pra andar de mãos dadas com você pelo resto da tarde, você reclama?`,
        sim: `Nem um pouquinho`,
        nao: `Jamais reclamaria`
    },
    {
        texto: `O Kovu topa dividir o sofá com a gente enquanto você conta pra mim como foi seu dia?`,
        sim: `Claro que topa`,
        nao: `Com certeza topa`
    },
    {
        texto: `Você promete não fazer bico se eu roubar uma batata frita do seu prato de novo?`,
        sim: `Prometo (mas cobro depois)`,
        nao: `Tá bom, prometo`
    },
    {
        texto: `Última: você topa continuar escolhendo a gente, todos os dias, mesmo nos dias difíceis?`,
        sim: `Topo de olhos fechados`,
        nao: `Sim, sempre`
    }
];

/* ----------------------------------------------------------------------
   MINI QUIZ — "O quanto você me conhece?"
   ----------------------------------------------------------------------
   Edite as opções e o índice de "certa" (começando em 0) com as respostas
   reais de vocês dois. As mensagens de reação já usam detalhes pessoais.
   ---------------------------------------------------------------------- */
const QUIZ_PERGUNTAS = [
    {
        pergunta: 'Qual é a flor favorita da Poloni?',
        opcoes: ['Rosa', 'Girassol', 'Orquídea', 'Lírio'],
        certa: 1,
        certoMsg: 'Óbvio que você ia acertar essa 🌻',
        erradoMsg: 'Girassol! Ainda vou plantar um jardim inteiro deles pra você 🌻'
    },
    {
        pergunta: 'Qual dessas dupla(s) sertaneja(s) a Poloni realmente ama?',
        opcoes: ['Jorge & Mateus e Zé Neto & Cristiano', 'Henrique & Juliano', 'Marília Mendonça (só)', 'Nenhuma das anteriores'],
        certa: 0,
        certoMsg: 'Isso mesmo! Já sei até cantar junto 🎶',
        erradoMsg: 'Jorge & Mateus e Zé Neto & Cristiano — já tá tocando na nossa cabeça, né?'
    },
    {
        pergunta: 'Qual cachorro está com a gente hoje, esperando carinho?',
        opcoes: ['Slinky', 'Kovu', 'Thor', 'Mel'],
        certa: 1,
        certoMsg: 'O Kovu agradece o carinho 🐾',
        erradoMsg: 'É o Kovu! O Slinky mora no coração da gente para sempre 🐾'
    },
    {
        pergunta: 'O que a Poloni definitivamente NÃO come?',
        opcoes: ['Carne', 'Girassol (a planta, relaxa)', 'Chocolate', 'Batata frita'],
        certa: 0,
        certoMsg: 'Certíssimo — vegetariana com muito orgulho 🌱',
        erradoMsg: 'Ela é ovolactovegetariana — carne está fora de cogitação 🌱'
    },
    {
        pergunta: 'Onde foi o nosso primeiro encontro de verdade?',
        opcoes: ['Colina, em Orlândia', 'Praia', 'Shopping', 'Uma festa'],
        certa: 0,
        certoMsg: 'Colina, 30 de maio — inesquecível 💛',
        erradoMsg: 'Foi no Colina, em Orlândia, dia 30/05 — o dia em que tudo se encaixou.'
    }
];

/* ----------------------------------------------------------------------
   PLAYLIST DO CASAL
   ---------------------------------------------------------------------- */
const PLAYLIST_FAIXAS = [
    {
        titulo: 'Um Dia Te Levo Comigo',
        artista: 'Nossa música',
        motivo: 'Virou a nossa música por volta do dia 14/06 — o dia do nosso "eu te amo" depois da Brooks.',
        src: 'audio_nossa_musica'
    },
    {
        titulo: '[Edite: música da carona]',
        artista: '[Artista]',
        motivo: 'Aquela que tocava nas caronas para a faculdade, quando tudo ainda estava começando.',
        src: 'audio_playlist_1'
    },
    {
        titulo: '[Edite: música do dia do atoleiro]',
        artista: '[Artista]',
        motivo: 'Pra lembrar que até um carro atolado na lama vira boa lembrança do seu lado.',
        src: 'audio_playlist_2'
    },
    {
        titulo: '[Edite: música do dia do pedido]',
        artista: '[Artista]',
        motivo: 'Escolhida especialmente pra hoje.',
        src: 'audio_playlist_3'
    }
];

/* ----------------------------------------------------------------------
   REGRAS DO "CONTRATO DE NAMORO"
   ---------------------------------------------------------------------- */
const OPCOES_REGRAS_CONTRATO = [
    { id: 'girassol', icon: 'bi-flower1', label: 'Sempre ter um girassol por perto', artigo: 'Fica decretado que jamais faltará um girassol por perto — seja na varanda, na mesa ou apenas guardado em uma lembrança.' },
    { id: 'batata', icon: 'bi-basket2', label: 'Dividir a última batata frita', artigo: 'Fica estabelecido o compartilhamento voluntário de qualquer petisco, sendo o mínimo aceitável oferecer pelo menos a última batata frita antes de terminar o prato sozinho(a).' },
    { id: 'kovu', icon: 'bi-paw', label: 'Levar o Kovu pra passear junto', artigo: 'O Kovu tem direito garantido a passeios em dupla sempre que a agenda permitir, sem necessidade de justificativa prévia.' },
    { id: 'maos_dadas', icon: 'bi-hand-index-thumb', label: 'Andar sempre de mãos dadas', artigo: 'As mãos dadas são cláusula obrigatória em qualquer caminhada, trajeto de carro ou fila de cinema.' },
    { id: 'praia', icon: 'bi-sun', label: 'Realizar o sonho de ir à praia juntos', artigo: 'Fica registrado o compromisso de, assim que possível, realizar juntos o sonho da praia — com direito a pôr do sol e os pés na areia.' },
    { id: 'musica_sertaneja', icon: 'bi-music-note-beamed', label: 'Cantar Jorge & Mateus no volume máximo', artigo: 'Fica autorizado, e incentivado, cantar Jorge & Mateus e Zé Neto & Cristiano no volume máximo durante qualquer viagem de carro.' },
    { id: 'bomdia', icon: 'bi-sunrise-fill', label: 'Mandar mensagem de bom dia', artigo: 'As mensagens de bom dia constituem cláusula pétrea deste contrato, não podendo ser suprimidas nem mesmo por emenda constitucional do sono.' },
    { id: 'conchinha', icon: 'bi-moon-stars-fill', label: 'Dormir de conchinha sempre que possível', artigo: 'O cobertor será dividido de forma equânime, ficando garantida a posição de conchinha sempre que possível.' },
    { id: 'filmes', icon: 'bi-film', label: 'Assistir filmes de terror/comédia juntos', artigo: 'Ficam instituídas as maratonas de filmes em conjunto, com direito a pipoca e comentários espontâneos sobre a trama — igualzinho ao dia de Todo Mundo em Pânico 6.' },
    { id: 'sonhos', icon: 'bi-stars', label: 'Apoiar os sonhos um do outro', artigo: 'É dever de ambas as Partes apoiar incondicionalmente os sonhos, planos e ideias malucas uma da outra.' }
];

/* ----------------------------------------------------------------------
   CARTA FINAL — 1 Coríntios 13 (adaptação de domínio público)
   ----------------------------------------------------------------------
   Cada ocorrência de {AMOR} vira, com uma transição suave, o nome dela.
   ---------------------------------------------------------------------- */
function textoVersiculoBase() {
    if (CARTA_USAR_TEXTO_TESTE) return TEXTO_CARTA_TESTE;
    return "O {AMOR} é paciente, o {AMOR} é benigno; não é invejoso, não se vangloria, não se ensoberbece. Não se conduz com indecência, não busca os seus próprios interesses, não se irrita, não guarda mágoa. Não se alegra com a injustiça, mas se alegra com a verdade. Tudo sofre, tudo crê, tudo espera, tudo suporta.";
}

/* ----------------------------------------------------------------------
   TESTE DA CARTA FINAL (item 6 do prompt)
   ----------------------------------------------------------------------
   Enquanto CARTA_USAR_TEXTO_TESTE estiver "true", a carta que abre depois
   da assinatura/vídeo mostra o texto abaixo (com o placeholder
   [CARTA_TESTE]) em vez do texto definitivo — útil para testar a
   animação do envelope, a troca de "{AMOR}" pelo nome dela, etc., sem
   comprometer o texto final ainda.

   Antes do grande dia:
     1. Troque CARTA_USAR_TEXTO_TESTE para "false".
     2. (Opcional) edite o texto definitivo em textoVersiculoBase(), acima.
   ---------------------------------------------------------------------- */
const CARTA_USAR_TEXTO_TESTE = false;
const TEXTO_CARTA_TESTE = `[CARTA_TESTE] Este é um texto provisório só para testar a abertura do envelope e a troca de "{AMOR}" pelo nome dela. Substitua este texto (ou desligue CARTA_USAR_TEXTO_TESTE, em js/config.js) antes da versão definitiva.`;

/* ----------------------------------------------------------------------
   CÁPSULA DO TEMPO — carta que se abre sozinha 1 ano após o pedido
   ---------------------------------------------------------------------- */
const CAPSULA_DIAS_PARA_DESBLOQUEIO = 365;
function textoCapsulaDoTempo() {
    return `Se você está lendo isso, já faz um ano que eu te pedi em namoro. [Escreva aqui o que você quer dizer para vocês dois daqui a um ano — o que mudou, o que continua igual, uma promessa, uma lembrança de hoje.]`;
}

/* ----------------------------------------------------------------------
   EASTER EGG — brincadeira do sobrenome
   ---------------------------------------------------------------------- */
const TEXTO_EASTER_EGG_SOBRENOME = `Aviso nada oficial: a partir de hoje você deixa de ser "do Vale" — e não, isso não tem nada a ver com "não vale a pena". Muito pelo contrário: agora você vale um "Schmeisk" inteiro. 💍`;

/* ----------------------------------------------------------------------
   TEXTOS-CHAVE (fáceis de localizar e editar)
   ---------------------------------------------------------------------- */
/* ----------------------------------------------------------------------
   "COISAS QUE A POLONI AMA" — pequena seção da página de memórias
   ----------------------------------------------------------------------
   Lista enxuta (o pedido foi para não virar uma lista de curiosidades).
   Edite livremente; cada item vira um pequeno cartão na seção.
   ---------------------------------------------------------------------- */
const COISAS_QUE_ELA_AMA = [
    { icon: 'bi-flower1', texto: 'Girassóis, sempre.' },
    { icon: 'bi-cup-straw', texto: 'Hambúrguer do Grill, com picles — sem discussão.' },
    { icon: 'bi-egg-fried', texto: 'Arroz, feijão preto, batata frita e rúcula: o prato perfeito.' },
    { icon: 'bi-heart-fill', texto: 'KitKat, Kinder Ovo e Ovomaltine em qualquer forma possível.' },
    { icon: 'bi-tree-fill', texto: 'Lugares calmos, campo aberto e um bom silêncio.' },
    { icon: 'bi-paw', texto: 'Koda, Xixico, Kovu, Yuk, Ahadi, Shury, Sol e Lua — e, no coração, Negão, Slinky, Tommy e Anne.' }
];

/* ----------------------------------------------------------------------
   PROTEÇÃO POR SENHA DA ÁREA DE MEMÓRIAS (item 8 do prompt — IMPLEMENTADO
   POR ÚLTIMO, depois de todas as demais correções e melhorias)
   ----------------------------------------------------------------------
   Depois que o pedido acontece e tudo é salvo, qualquer novo acesso à
   área de memórias passa a exigir esta senha (ver verificarSenhaMemorias()
   em js/romance.js e o fluxo em js/main.js).
   ---------------------------------------------------------------------- */
const SENHA_AREA_MEMORIAS = '1406';

const TEXTOS = {
    heroTituloRomance: 'Nossa Trajetória',
    heroSubRomance: `tudo que você acabou de passar era só uma desculpa boba pra chegar até aqui. Não tinha aliança nenhuma no correio — a única coisa que eu queria entregar era isso: tudo o que a gente construiu até hoje, contado do meu jeito.`,
    encerramentoRomance: `obrigado por topar essa vida comigo, dia após dia. Isso aqui é só um jeito diferente de dizer o que eu já sinto todos os dias: eu escolho você.`,
    digitacaoSuspense: `Cada uma dessas fotos guarda um pedaço da gente. E o pedido que você acabou de "fazer" também guarda um segredo...`,
    assinaturaCartaFinal: `Assim eu quero te amar, ${NOME_DELA}.`,
    polaroidFrasePadrao: `O dia em que tudo começou, ${NOME_DELA}.`
};
