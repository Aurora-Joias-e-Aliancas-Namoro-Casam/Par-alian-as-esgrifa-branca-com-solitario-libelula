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
    imagem_timeline_7: { arquivo: 'timeline-7.jpg', tipo: 'imagem', descricao: 'Timeline — 20/07, apresentação pros avós em Santa Rosa de Viterbo, Parque Curupira e o balanço em Sales de Oliveira' },
    imagem_timeline_hoje: { arquivo: 'timeline-hoje.jpg', tipo: 'imagem', descricao: 'Timeline — foto de hoje, marcando o dia do pedido' },

    // ---- Nossos momentos (mesa de fotos) ----
    imagem_momento_1: { arquivo: 'momento-1.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },
    imagem_momento_2: { arquivo: 'momento-2.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },
    imagem_momento_3: { arquivo: 'momento-3.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },
    imagem_momento_4: { arquivo: 'momento-4.jpg', tipo: 'imagem', descricao: 'Foto solta na "mesa de fotos"' },

    // ---- Seus bichos (clique no nome de cada um abre a foto) ----
    // "arquivoBase" (sem extensão) em vez de "arquivo": aceita qualquer
    // extensão de foto listada em EXTENSOES_FOTO_ACEITAS, então tanto faz
    // salvar como .jpg, .jpeg, .png ou .webp — não precisa editar nada
    // aqui além de colocar o arquivo na pasta (ver resolverFotoPlaceholder).
    bicho_koda: { arquivoBase: 'bicho-koda', tipo: 'imagem', descricao: 'Koda' },
    bicho_xixico: { arquivoBase: 'bicho-xixico', tipo: 'imagem', descricao: 'Xixico' },
    bicho_kovu: { arquivoBase: 'bicho-kovu', tipo: 'imagem', descricao: 'Kovu' },
    bicho_yuk: { arquivoBase: 'bicho-yuk', tipo: 'imagem', descricao: 'Yuk' },
    bicho_ahadi: { arquivoBase: 'bicho-ahadi', tipo: 'imagem', descricao: 'Ahadi' },
    bicho_shury: { arquivoBase: 'bicho-shury', tipo: 'imagem', descricao: 'Shury' },
    bicho_sol: { arquivoBase: 'bicho-sol', tipo: 'imagem', descricao: 'Sol' },
    bicho_lua: { arquivoBase: 'bicho-lua', tipo: 'imagem', descricao: 'Lua' },
    bicho_negao: { arquivoBase: 'bicho-negao', tipo: 'imagem', descricao: 'Negão (em memória)' },
    bicho_slinky: { arquivoBase: 'bicho-slinky', tipo: 'imagem', descricao: 'Slinky (em memória)' },
    bicho_tommy: { arquivoBase: 'bicho-tommy', tipo: 'imagem', descricao: 'Tommy (em memória)' },
    bicho_anne: { arquivoBase: 'bicho-anne', tipo: 'imagem', descricao: 'Anne (em memória)' },

    // ---- Áudio ----
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

/**
 * Resolve a foto de um placeholder "por nome" (arquivoBase, sem extensão
 * fixa) — testa cada extensão em EXTENSOES_FOTO_ACEITAS, em minúsculo e
 * MAIÚSCULO, até achar um arquivo que exista de verdade em assets/img/.
 * Usada hoje pelas fotos de "Seus bichos" (ver PLACEHOLDERS acima).
 * Se nada for encontrado, devolve um SVG de espaço reservado (com a
 * legenda do item) em vez de quebrar como imagem ausente.
 */
const __cacheResolverFotoPlaceholder = {};
async function resolverFotoPlaceholder(id) {
    if (id in __cacheResolverFotoPlaceholder) return __cacheResolverFotoPlaceholder[id];

    const item = PLACEHOLDERS[id];
    if (!item || !item.arquivoBase) {
        console.warn(`resolverFotoPlaceholder: placeholder "${id}" não tem arquivoBase configurado.`);
        return gerarSvgPlaceholderComLegenda(item ? item.descricao : id);
    }

    const candidatos = EXTENSOES_FOTO_ACEITAS.flatMap(ext => [ext, ext.toUpperCase()]);
    for (const ext of candidatos) {
        const caminho = `assets/img/${item.arquivoBase}.${ext}`;
        if (await arquivoExisteNoServidor(caminho)) {
            __cacheResolverFotoPlaceholder[id] = caminho;
            return caminho;
        }
    }

    // Nenhuma extensão encontrada — provavelmente a foto ainda não foi
    // adicionada na pasta. Não guarda esse "não encontrado" no cache
    // (diferente do sucesso), assim, se a foto for adicionada depois sem
    // recarregar a página, uma nova tentativa ainda pode encontrar.
    return gerarSvgPlaceholderComLegenda(item.descricao);
}

/* ----------------------------------------------------------------------
   GALERIA DE LEMBRANÇAS (página própria — galeria.html)
   ----------------------------------------------------------------------
   Simples de propósito: o site descobre sozinho quantos itens existem e
   se cada um é foto ou vídeo, só pela extensão do arquivo. Você não
   precisa contar nem classificar nada.

   Salve as fotos e vídeos dentro de assets/img/galeria/ sempre com o
   nome "galeria_" + número em sequência, começando em 1:

       galeria_1.jpg
       galeria_2.mp4      <- um vídeo, nesse exemplo (funciona igual pra foto)
       galeria_3.jpg
       ...

   Para adicionar um novo item, só salve o arquivo com o próximo número
   da sequência. Não precisa editar nenhum arquivo do projeto — nem
   contar quantos itens existem, nem dizer se é foto ou vídeo (o site vê
   sozinho pela extensão do arquivo: .jpg/.jpeg/.png/.webp = foto,
   .mp4/.mov/.webm = vídeo).

   O site para de procurar depois de alguns números seguidos sem
   encontrar nada — então não precisa "reservar" números, nem se
   preocupar em deixar buracos na numeração.

   VÍDEOS DO YOUTUBE (sem precisar do arquivo — ótimo pra vídeos
   grandes): como esses não são um arquivo local, adicione o link numa
   lista à parte, em GALERIA_YOUTUBE (abaixo). Roda embutido dentro do
   site (não abre o app/site do YouTube). Recomendo subir como "Não
   listado" no YouTube, assim só quem tem o link acessa.

   Legendas são opcionais (funcionam para foto, vídeo local ou vídeo do
   YouTube): para dar uma frase a uma foto/vídeo local específico,
   adicione uma entrada em GALERIA_LEGENDAS usando o mesmo número do
   arquivo; para um vídeo do YouTube, escreva a legenda junto dele em
   GALERIA_YOUTUBE.
   ---------------------------------------------------------------------- */
const PASTA_GALERIA = 'assets/img/galeria';

const GALERIA_LEGENDAS = {
    // 1: 'O dia do atoleiro — rimos até doer a barriga.',
    // 2: 'Colina, 30/05. O começo de tudo.',
};

/* Vídeos do YouTube (não precisam de arquivo — ver explicação acima).
   Cole o link como veio do "Compartilhar" do YouTube (celular ou
   navegador) — aceita inclusive links curtos youtu.be e Shorts. */
const GALERIA_YOUTUBE = [
    // { link: 'https://www.youtube.com/watch?v=XXXXXXXXXXX', legenda: 'Legenda opcional' },
];

/**
 * Extrai só o ID do vídeo de qualquer formato de link que o YouTube
 * costuma gerar (watch?v=, youtu.be/, shorts/, embed/) — ou devolve o
 * próprio valor se já for só o ID (assim a pessoa pode colar o link
 * inteiro sem se preocupar em "limpar" ele antes).
 */
function extrairIdYoutube(valor) {
    if (!valor) return '';
    const texto = String(valor).trim();
    const padroes = [
        /youtu\.be\/([a-zA-Z0-9_-]{6,20})/,
        /[?&]v=([a-zA-Z0-9_-]{6,20})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,20})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,20})/
    ];
    for (const padrao of padroes) {
        const m = texto.match(padrao);
        if (m) return m[1];
    }
    return texto; // já era só o ID (ou algo não reconhecido — usa como veio)
}

/* Extensões aceitas para descoberta automática — ver montarGaleria() em js/galeria.js. */
/* Extensões de foto aceitas em qualquer lugar do site que resolve uma
 * imagem "por nome", sem precisar dizer a extensão exata em config.js —
 * hoje usada pela galeria (galeria.html) e pelas fotos de "Seus bichos".
 * Adicione aqui se precisar aceitar outro formato de foto no futuro
 * (o teste também é sempre insensível a maiúscula/minúscula, então
 * ".JPG" e ".jpg" funcionam do mesmo jeito). */
const EXTENSOES_FOTO_ACEITAS = ['jpg', 'jpeg', 'png', 'webp'];
const GALERIA_EXTENSOES_FOTO = EXTENSOES_FOTO_ACEITAS;
const GALERIA_EXTENSOES_VIDEO = ['mp4', 'mov', 'webm'];

/* ----------------------------------------------------------------------
   NOSSA HISTÓRIA — LINHA DO TEMPO
   ---------------------------------------------------------------------- */
const TIMELINE_MARCOS = [
    {
        data: 'Antes de tudo',
        texto: `A primeira vez que eu vi você foi dias antes de te conhecer de verdade. Você caminhava com a Vitória e eu falei pra ela, sem pensar duas vezes: "sua amiga de cabelo loiro é muito linda". Fiquei com vergonha demais até de te adicionar no Instagram, no fim foi você quem me adicionou.`,
        foto: 'imagem_timeline_1'
    },
    {
        data: '11 de maio',
        texto: `Nos encontramos na faculdade. A Vitória pediu carona e você veio junto. Conversamos muito, nos demos incrivelmente bem, e mesmo assim, por um tempo, ficou só nisso. Continuei te dando carona nos dias seguintes e um dia até "esqueci" seu power bank comigo só pra ter desculpa de te chamar.`,
        foto: 'imagem_timeline_2'
    },
    {
        data: '30 de maio',
        texto: `Nosso primeiro encontro. Colina, em Orlândia, 20h30 que na prática viraram quase 22h, porque alguém demorou uma eternidade pra ficar pronta. Valeu cada segundo de espera. Ficamos horas no carro conversando, e quando eu já ia desistir de ter coragem, você perguntou: "e o nosso beijo, nada?". Foi ali que tudo se encaixou.`,
        foto: 'imagem_timeline_3'
    },
    {
        data: 'Uma estrada de terra',
        texto: `Fomos parar numa estrada de terra e o carro atolou de vez. Eu me sujei inteiro de barro, perdi o triângulo tentando tirar o carro do buraco, e mesmo assim rimos do começo ao fim. Prova de que qualquer perrengue com você vira boa lembrança.`,
        foto: 'imagem_timeline_4'
    },
    {
        data: 'Um momento difícil',
        texto: `Também vivemos dias difíceis. Levei o Slinky ao veterinário com você e, pouco depois, tivemos que nos despedir dele. Fiquei do seu lado o tempo todo, e foi aí que também conheci sua família de verdade: busquei seu pai no trabalho, conversei com sua mãe, conheci seu irmão. Mesmo num momento triste, me senti acolhido por todos vocês.`,
        foto: 'imagem_timeline_5'
    },
    {
        data: '14 de junho',
        texto: `Nossa data. Estávamos no carro depois de sair da Brooks quando eu disse, pela primeira vez, "eu te amo", e você respondeu do mesmo jeito. Foi o dia em que aquilo que a gente já sentia se tornou oficial. Foi por essa época que "Um Dia Te Levo Comigo" virou a nossa música.`,
        foto: 'imagem_timeline_6'
    },
    {
        data: '20 de julho',
        texto: `Te levei pra conhecer meus avós, em Santa Rosa de Viterbo. Depois passeamos no Parque Curupira, em Ribeirão Preto, e no fim do dia sentamos num balanço em Sales de Oliveira, só a gente. Percebi no seu jeito que você achou que eu ia te pedir em namoro ali. Eu também queria, mais do que qualquer coisa, só que as alianças ainda nem tinham chegado. Guardei aquela vontade pra esse dia aqui. Valeu a pena esperar.`,
        foto: 'imagem_timeline_7'
    },
    {
        data: null,
        texto: `E hoje: mesmo com pouco tempo juntos, parece que a gente se conhece há anos. Tenho certeza absoluta de que encontrei o amor da minha vida, e de que foi Deus quem colocou você no meu caminho. Ainda não sei se esse pedido vai dar certo, mas de uma coisa eu tenho certeza: eu te amo mais do que consigo colocar em palavras.`,
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
        texto: `Confessa uma coisa: quantas vezes por dia você pensa em girassol, sem eu nem perguntar?`,
        sim: `Mais vezes do que eu admito`,
        nao: `Perdi a conta há muito tempo`
    },
    {
        texto: `Se eu falar que hoje é dia de hambúrguer do Grill com picles, você larga tudo e vem correndo?`,
        sim: `Em dois segundos`,
        nao: `Nem preciso pensar`
    },
    {
        texto: `O Kovu jura que é neutro, mas a gente sabe muito bem que ele torce mais por você. Isso te incomoda?`,
        sim: `De jeito nenhum, eu mereço`,
        nao: `Ele só tem bom gosto`
    },
    {
        texto: `Se eu aparecer contando que arrumei uma viagem pra um lugar que você nunca foi, você já começa a fazer a mala na cabeça?`,
        sim: `Já tô fazendo a lista`,
        nao: `Nem preciso pensar duas vezes`
    },
    {
        texto: `Você promete continuar sendo esse silêncio bonito, até decidir que eu mereço ouvir tudo?`,
        sim: `Prometo, mas só com você`,
        nao: `Isso nunca vai mudar`
    },
    {
        texto: `Última: você topa continuar escolhendo a gente, todos os dias, mesmo nos dias difíceis?`,
        sim: `Topo de olhos fechados`,
        nao: `Sim, sempre`
    },
    {
        texto: `Repete comigo, do nosso jeito: eu te amo muito, tal qual o Chaves ama sanduíche de presunto. É verdade ou é verdade?`,
        sim: `É a mais pura verdade`,
        nao: `Verdade, sempre foi`
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
        erradoMsg: 'Jorge & Mateus e Zé Neto & Cristiano, já tá tocando na nossa cabeça, né?'
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
        certoMsg: 'Certíssimo, vegetariana com muito orgulho 🌱',
        erradoMsg: 'Ela é ovolactovegetariana, carne está fora de cogitação 🌱'
    },
    {
        pergunta: 'Onde foi o nosso primeiro encontro de verdade?',
        opcoes: ['Colina, em Orlândia', 'Praia', 'Shopping', 'Uma festa'],
        certa: 0,
        certoMsg: 'Colina, 30 de maio. Inesquecível 💛',
        erradoMsg: 'Foi no Colina, em Orlândia, dia 30/05, o dia em que tudo se encaixou.'
    },
    {
        pergunta: 'Quantos bichos a Poloni tem hoje, contando cachorro, gato e calopsita?',
        opcoes: ['5', '6', '8', '10'],
        certa: 2,
        certoMsg: 'Isso mesmo, 8! Koda, Xixico, Kovu, Yuk, Ahadi, Shury, Sol e Lua 🐾',
        erradoMsg: 'São 8: Koda, Xixico e Kovu (cachorros), Yuk, Ahadi e Shury (gatos), Sol e Lua (calopsistas) 🐾'
    }
];

/* ----------------------------------------------------------------------
   PLAYLIST DO CASAL
   ---------------------------------------------------------------------- */
const PLAYLIST_FAIXAS = [
    {
        titulo: 'Um Dia Te Levo Comigo',
        artista: 'Nossa música',
        motivo: 'Virou a nossa música por volta do dia 14/06, o dia do nosso "eu te amo" depois da Brooks.',
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
    { id: 'girassol', icon: 'bi-flower1', label: 'Sempre ter um girassol por perto', artigo: 'Fica decretado que jamais faltará um girassol por perto, seja na varanda, na mesa ou apenas guardado em uma lembrança.' },
    { id: 'batata', icon: 'bi-basket2', label: 'Dividir a última batata frita', artigo: 'Fica estabelecido o compartilhamento voluntário de qualquer petisco, sendo o mínimo aceitável oferecer pelo menos a última batata frita antes de terminar o prato sozinho(a).' },
    { id: 'kovu', icon: 'bi-paw', label: 'Levar o Kovu pra passear junto', artigo: 'O Kovu tem direito garantido a passeios em dupla sempre que a agenda permitir, sem necessidade de justificativa prévia.' },
    { id: 'maos_dadas', icon: 'bi-hand-index-thumb', label: 'Andar sempre de mãos dadas', artigo: 'As mãos dadas são cláusula obrigatória em qualquer caminhada, trajeto de carro ou fila de cinema.' },
    { id: 'praia', icon: 'bi-sun', label: 'Realizar o sonho de ir à praia juntos', artigo: 'Fica registrado o compromisso de, assim que possível, realizar juntos o sonho da praia, com direito a pôr do sol e os pés na areia.' },
    { id: 'musica_sertaneja', icon: 'bi-music-note-beamed', label: 'Cantar Jorge & Mateus no volume máximo', artigo: 'Fica autorizado, e incentivado, cantar Jorge & Mateus e Zé Neto & Cristiano no volume máximo durante qualquer viagem de carro.' },
    { id: 'bomdia', icon: 'bi-sunrise-fill', label: 'Mandar mensagem de bom dia', artigo: 'As mensagens de bom dia constituem cláusula pétrea deste contrato, não podendo ser suprimidas nem mesmo por emenda constitucional do sono.' },
    { id: 'conchinha', icon: 'bi-moon-stars-fill', label: 'Dormir de conchinha sempre que possível', artigo: 'O cobertor será dividido de forma equânime, ficando garantida a posição de conchinha sempre que possível.' },
    { id: 'filmes', icon: 'bi-film', label: 'Assistir filmes de terror/comédia juntos', artigo: 'Ficam instituídas as maratonas de filmes em conjunto, com direito a pipoca e comentários espontâneos sobre a trama, igualzinho ao dia de Todo Mundo em Pânico 6.' },
    { id: 'sonhos', icon: 'bi-stars', label: 'Apoiar os sonhos um do outro', artigo: 'É dever de ambas as Partes apoiar incondicionalmente os sonhos, planos e ideias malucas uma da outra.' }
];

/* ----------------------------------------------------------------------
   CARTA FINAL — tema do universo, escrita na sua voz
   ----------------------------------------------------------------------
   Cada ocorrência de {AMOR} vira, com uma transição suave, o nome dela.
   O verso de fechamento é original (não é de nenhum poeta e não usa
   trecho de nenhuma música com direito autoral): se você quiser usar a
   frase exata de "Um Dia Te Levo Comigo" ali no lugar, cole ela mesmo,
   direto nesta função, no lugar da última frase.
   ---------------------------------------------------------------------- */
function textoVersiculoBase() {
    if (CARTA_USAR_TEXTO_TESTE) return TEXTO_CARTA_TESTE;
    return `O universo é tão grande que a luz de algumas estrelas leva milhões de anos pra chegar até nós, e mesmo assim, quando olhamos pro céu à noite, temos a sorte de ver elas brilhando bem ali. É mais ou menos assim que eu sinto esse meu amor por você, {AMOR}: levou bilhões de anos de poeira virando estrela, estrela virando planeta, planeta virando esse pedacinho de mundo onde a gente por fim se encontrou, e mesmo assim valeu cada segundo de espera.

Você é como um girassol, vive virada pro que te ilumina. E desde que te conheci, virei eu esse lugar pra onde você se vira todos os dias.

Não sei dizer direito onde o tempo começa nem onde ele termina, mas sei que em qualquer ponto dele, em qualquer versão possível desse universo inteiro, eu escolheria de novo ficar do seu lado, {AMOR}. Nem distância, nem os anos que ainda vamos viver juntos, mudam isso.

Pra selar, um verso que não peguei emprestado de nenhum poeta, porque nenhum poeta te conhece como eu conheço: você carrega o dia inteiro guardado nos olhos, e a noite inteira guardada no sorriso.`;
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
    return `Se você está lendo isso, já faz um ano que eu te pedi em namoro.

Um ano é pouco tempo pro tanto que eu sinto, mas foi tempo suficiente pra eu ter certeza de uma coisa: não existe versão de mim que não escolheria você de novo, sabendo de tudo o que a gente ia viver. Lembro de cada detalhe daquele dia. Lembro do medo, da vontade de que desse tudo certo, e de como, no fim, nada mais importou além do seu sim.

Se hoje a gente discutiu por bobagem, se a rotina engoliu um pouco da leveza, ou se esse ano trouxe coisas que a gente nem imaginava, quero que você leia isso e lembre do começo. Do quanto eu quis isso. Do quanto ainda quero.

Amor não é o dia do pedido. É todos os dias comuns depois dele, os que ninguém filma e ninguém guarda em cápsula nenhuma. É acordar do seu lado achando normal, quando na verdade é a maior sorte que eu já tive.

E sim, continua tal qual o Chaves ama sanduíche de presunto. Isso nunca vai mudar.

Com tudo o que eu sou,`;
}

/* ID do vídeo do YouTube com a mensagem em vídeo pra cápsula do tempo (o
 * que você falar "sobre o que espera pro ano que vem"). Cole só o ID (o
 * trecho depois de "v=" no link do YouTube), não a URL inteira.
 * Ex.: em "https://youtube.com/watch?v=abc123XYZ" o ID é "abc123XYZ".
 * Deixe em branco ('') se não quiser esse botão — ele só aparece se tiver
 * algo aqui. IMPORTANTE (leia a explicação sobre segredo/segurança na
 * resposta do chat): como este é um site estático sem servidor próprio,
 * esse ID viaja dentro do arquivo js/config.js mesmo estando em branco até
 * você preencher — ele só é inserido na página (e some do código-fonte
 * "à vista") no momento em que a cápsula é realmente desbloqueada, mas
 * alguém tecnicamente capaz de abrir este arquivo ainda conseguiria lê-lo
 * antes da data. A trava por hora do servidor (ver obterHoraConfiavel em
 * js/sync.js) cobre o golpe mais comum, que é só adiantar a data do
 * celular. */
const CAPSULA_YOUTUBE_ID = '';

/* Link do YouTube com o vídeo mostrando todo o processo até o pedido
 * (o "making of"). Cole a URL completa aqui quando publicar o vídeo — o
 * botão só aparece na página se este campo não estiver vazio. */
const VIDEO_PROCESSO_YOUTUBE_URL = '';

/* ----------------------------------------------------------------------
   EASTER EGG — brincadeira do sobrenome
   ---------------------------------------------------------------------- */
const TEXTO_EASTER_EGG_SOBRENOME = `Aviso nada oficial: a partir de hoje você deixa de ser "do Vale", e não, isso não tem nada a ver com "não vale a pena". Muito pelo contrário: agora você vale um "Schmeisk" inteiro. 💍`;

/* ----------------------------------------------------------------------
   "COISAS QUE A POLONI AMA" — pequena seção da página de memórias
   ----------------------------------------------------------------------
   Lista enxuta (o pedido foi para não virar uma lista de curiosidades).
   Edite livremente; cada item vira um pequeno cartão na seção.
   ---------------------------------------------------------------------- */
const COISAS_QUE_ELA_AMA = [
    { icon: 'bi-flower1', texto: 'Girassol. Não é só gostar, é amor mesmo, e eu reparei nisso desde muito cedo.' },
    { icon: 'bi-cup-straw', texto: 'Hambúrguer do Grill, com picles, sem exceção. Se deixasse, você comia isso todo santo dia.' },
    { icon: 'bi-egg-fried', texto: 'Arroz, feijão preto, batata frita e rúcula. Simples assim, e é o seu favorito.' },
    { icon: 'bi-heart-fill', texto: 'KitKat, Kinder Ovo e Ovomaltine em qualquer versão que existir.' },
    { icon: 'bi-bag-fill', texto: 'Pringles, Doritos, Cheetos requeijão e Fandangos, pra quando bate aquela vontade de salgadinho.' },
    { icon: 'bi-tree-fill', texto: 'Mato e bicho, sempre. Um lugar calmo, sem muita gente, é onde você relaxa de verdade.' },
    { icon: 'bi-bag-heart-fill', texto: 'E ao mesmo tempo ama um shopping, e conhecer lugar novo, tipo achar uma hamburgueria diferente por aí.' },
    { icon: 'bi-airplane-fill', texto: 'Viajar. Conhecer lugar que você nunca viu é uma das coisas que mais te deixam animada, eu percebo no seu jeito de falar.' },
    { icon: 'bi-gift-fill', texto: 'Seu aniversário é sagrado. É o seu dia, e ponto final, e eu levo isso a sério.' },
    { icon: 'bi-chat-heart-fill', texto: 'É caladinha até ganhar confiança, e quando ganha, não para mais de falar. Eu amo quando você fala demais comigo.' }
];

/* ----------------------------------------------------------------------
   SEUS BICHOS — pequena seção logo abaixo de "Coisas que você gosta".
   São seus, não nossos (ainda não moram juntos), por isso o texto trata
   como "seus bichos", não "nossos bichos". Toque no nome de qualquer um
   pra abrir a foto dele (usa o mesmo visor de foto do resto do site).
   ---------------------------------------------------------------------- */
const SEUS_BICHOS = [
    { nome: 'Koda', emoji: '🐶', foto: 'bicho_koda' },
    { nome: 'Xixico', emoji: '🐶', foto: 'bicho_xixico' },
    { nome: 'Kovu', emoji: '🐶', foto: 'bicho_kovu' },
    { nome: 'Yuk', emoji: '🐱', foto: 'bicho_yuk' },
    { nome: 'Ahadi', emoji: '🐱', foto: 'bicho_ahadi' },
    { nome: 'Shury', emoji: '🐱', foto: 'bicho_shury' },
    { nome: 'Sol', emoji: '🦜', foto: 'bicho_sol' },
    { nome: 'Lua', emoji: '🦜', foto: 'bicho_lua' }
];

const BICHOS_EM_MEMORIA = [
    { nome: 'Negão', emoji: '🐶', foto: 'bicho_negao' },
    {
        nome: 'Slinky', emoji: '🐶', foto: 'bicho_slinky', destaque: true,
        textoEspecial: 'Confesso que não cheguei a te conhecer direito, Slinky, mas sei o quanto você ajudou ela em uma fase difícil, e isso te tornou especial pra mim também, mesmo à distância. Obrigado por ter cuidado dela antes de mim.'
    },
    { nome: 'Tommy', emoji: '🦜', foto: 'bicho_tommy' },
    { nome: 'Anne', emoji: '🦜', foto: 'bicho_anne' }
];

/* ----------------------------------------------------------------------
   PROTEÇÃO POR SENHA DA ÁREA DE MEMÓRIAS (item 8 do prompt — IMPLEMENTADO
   POR ÚLTIMO, depois de todas as demais correções e melhorias)
   ----------------------------------------------------------------------
   Depois que o pedido acontece e tudo é salvo, qualquer novo acesso à
   área de memórias passa a exigir esta senha (ver solicitarSenhaMemorias()
   em js/romance.js e o fluxo em js/main.js).
   ---------------------------------------------------------------------- */
const SENHA_AREA_MEMORIAS = '1406';

/* ----------------------------------------------------------------------
   SENHA DO BOTÃO "RESETAR SITE"
   ----------------------------------------------------------------------
   Some qualquer indicação visual dessa senha na tela (o campo é do tipo
   "password", mascarado) — só quem souber o número consegue resetar o
   site. Nota honesta: como este é um site 100% estático (sem servidor
   próprio), qualquer pessoa que abrir o código-fonte da página encontra
   esta constante — não existe "segredo perfeito" possível nesse tipo de
   projeto (o mesmo já vale para a chave do Supabase, ver js/sync.js).
   Na prática isso não é um problema aqui: ninguém além de quem já tem
   este arquivo vai inspecionar o código, e o objetivo real da senha é
   evitar um toque acidental no botão, não resistir a um ataque.
   ---------------------------------------------------------------------- */
const SENHA_RESET_SITE = '13046700';

/* ----------------------------------------------------------------------
   TEXTOS-CHAVE (fáceis de localizar e editar)
   ---------------------------------------------------------------------- */
const TEXTOS = {
    heroTituloRomance: 'Nossa Trajetória',
    heroSubRomance: `tudo que você acabou de passar era só uma desculpa boba pra chegar até aqui. Não tinha aliança nenhuma no correio, a única coisa que eu queria entregar era isso: tudo o que a gente construiu até hoje, contado do meu jeito.`,
    encerramentoRomance: `obrigado por topar essa vida comigo, dia após dia. Isso aqui é só um jeito diferente de dizer o que eu já sinto todos os dias: eu escolho você.`,
    digitacaoSuspense: `Cada uma dessas fotos guarda um pedaço da gente. E o pedido que você acabou de "fazer" também guarda um segredo...`,
    assinaturaCartaFinal: `Assim eu quero te amar, ${NOME_DELA}.`,
    polaroidFrasePadrao: `O dia em que tudo começou, ${NOME_DELA}.`
};
