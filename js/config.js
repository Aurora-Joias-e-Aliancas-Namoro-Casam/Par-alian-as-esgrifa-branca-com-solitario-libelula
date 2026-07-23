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
    imagem_timeline_8: { arquivo: 'timeline-8.jpg', tipo: 'imagem', descricao: 'Timeline — 12/07, o dia em Nuporanga que acabei conhecendo o tio e a tia dela' },
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

    // ---- Fotos de cada local do "Nosso mapa" (usadas no cartão postal e na constelação pra imprimir) ----
    mapa_colina: { arquivoBase: 'mapa-colina', tipo: 'imagem', descricao: 'Colina, Orlândia' },
    mapa_santa_rosa: { arquivoBase: 'mapa-santa-rosa', tipo: 'imagem', descricao: 'Santa Rosa de Viterbo' },
    mapa_curupira: { arquivoBase: 'mapa-curupira', tipo: 'imagem', descricao: 'Parque Curupira' },
    mapa_balanco: { arquivoBase: 'mapa-balanco', tipo: 'imagem', descricao: 'O balanço em Sales de Oliveira' },
    mapa_nuporanga: { arquivoBase: 'mapa-nuporanga', tipo: 'imagem', descricao: 'Nuporanga' },
    mapa_proximo: { arquivoBase: 'mapa-proximo', tipo: 'imagem', descricao: 'Próximo destino' },

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
        data: '21 de junho',
        texto: `Fomos parar numa estrada de terra e o carro atolou de vez. Eu me sujei inteiro de barro, perdi o triângulo tentando tirar o carro do buraco, e mesmo assim rimos do começo ao fim. Prova de que qualquer perrengue com você vira boa lembrança.`,
        foto: 'imagem_timeline_4'
    },
    {
        data: '12 de julho',
        texto: `Fomos pra Nuporanga depois de comer um lanche, só de passagem pra ir na feira. Paramos na sua casa pra você pegar uma blusa de frio, e a ideia era só isso, entrar e sair. Você nem quis usar o banheiro de lá, eu ofereci pra irmos até a igreja e você também não quis. No fim das contas acabei conhecendo seu tio e sua tia, sem estar preparado pra isso. Foi difícil, confesso, mas deu tudo certo, e olha que dia bom acabou virando.`,
        foto: 'imagem_timeline_8'
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
        texto: `Posso confessar uma coisa boba? Toda vez que vejo um girassol na rua, penso em você. Isso também acontece com você, nem que seja um pouquinho?`,
        sim: `Direto, e nem percebo mais`,
        nao: `Toda santa vez`
    },
    {
        texto: `Se eu te chamar agora, do nada, pra ir comer hambúrguer do Grill com picles, você já tá calçando o tênis ou ainda vai fingir que precisa pensar?`,
        sim: `Já tô na porta`,
        nao: `Nem finjo mais, você me conhece`
    },
    {
        texto: `O Kovu jura de pé junto que é neutro, mas todo mundo aqui sabe que o coração dele já escolheu um lado. Você aceita esse carinho todo sem culpa nenhuma?`,
        sim: `Aceito, e mereço cada pedacinho`,
        nao: `Ele só reconhece quem é gente boa`
    },
    {
        texto: `Se eu chegar em casa e falar "arrumei passagem pra um lugar que você nunca foi", quanto tempo até a mala tá pronta?`,
        sim: `A mala já tá quase pronta`,
        nao: `Nem preciso de aviso, já vou pensando na roupa`
    },
    {
        texto: `Você promete continuar sendo essa pessoa quieta até ganhar confiança, e uma tagarela sem fim depois que ganha? Porque eu não troco isso por nada.`,
        sim: `Prometo, mas só com quem eu confio`,
        nao: `Isso nunca vai mudar`
    },
    {
        texto: `Tem um "Sosseguei" tocando baixinho na minha cabeça desde que te conheci, sabe aquela sensação de achar que não precisa mais procurar nada? Você topa continuar escolhendo a gente desse jeito, nos dias fáceis e principalmente nos difíceis?`,
        sim: `Topo, sossego é bom demais`,
        nao: `Sempre vou escolher a gente`
    },
    {
        texto: `Agora repete comigo, do nosso jeitinho: eu te amo, tal qual o Chaves ama sanduíche de presunto. Isso é fato ou é fato?`,
        sim: `É fato, sempre foi`,
        nao: `Fato, e sem discussão`
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
   ----------------------------------------------------------------------
   Sugestões de Jorge & Mateus pra cada momento, caso queira usar (edite
   título/artista/arquivo com a música real que escolher):
     - carona pra faculdade → "De Tanto Te Querer" (o clima de quem já
       estava gostando antes de admitir)
     - dia do atoleiro → algo mais animado, tipo "Propaganda"
     - dia do pedido → "Sosseguei" combina bem com a ideia de gente que
       já não precisa procurar mais nada
   ---------------------------------------------------------------------- */
const PLAYLIST_FAIXAS = [
    {
        titulo: 'Um Dia Te Levo Comigo',
        artista: 'Jorge & Mateus — nossa música',
        motivo: 'Virou nossa música por volta do dia 14/06, o dia do nosso primeiro "eu te amo", ali no carro depois de sair da Brooks.',
        src: 'audio_nossa_musica'
    },
    {
        titulo: '[Edite: música da carona]',
        artista: '[Artista]',
        motivo: 'Aquela que tocava nas caronas pra faculdade, lá no comecinho, quando eu ainda estava juntando coragem.',
        src: 'audio_playlist_1'
    },
    {
        titulo: '[Edite: música do dia do atoleiro]',
        artista: '[Artista]',
        motivo: 'Pra lembrar que até carro atolado na lama vira boa lembrança, quando é do seu lado.',
        src: 'audio_playlist_2'
    },
    {
        titulo: '[Edite: música do dia do pedido]',
        artista: '[Artista]',
        motivo: 'Escolhida especialmente pra hoje, pro dia que muda tudo.',
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
    return `Eu queria saber escrever bonito do jeito que você merece, {AMOR}, mas a verdade é bem mais simples do que qualquer verso: desde o dia que te vi andando com a Vitória, antes mesmo de ter coragem de puxar assunto, alguma coisa em mim já sabia que ia ser você.

Tem tanta música por aí que fala de amor de um jeito que parece exagero, até a gente viver e descobrir que não é exagero nenhum. Sei lá quantas vezes já ouvi "Pra Sempre Com Você" no rádio do carro sem prestar muita atenção, e hoje não consigo mais escutar sem pensar em você, sem pensar que é exatamente isso que eu quero: ficar. Sem enrolação, sem plano B, só ficar.

Você é como um girassol, e não é força de expressão nenhuma, é chão mesmo, é literal: onde bate mais luz, é pra lá que você se vira. E desde que te conheci, virei eu esse lugar pra onde você se vira todos os dias, e isso ainda me deixa sem jeito de tão bom.

Não sei explicar direito por que deu certo entre a gente, só sei que deu, e que em qualquer dia dessa vida, com qualquer versão de mim, eu ia escolher ficar do seu lado de novo, {AMOR}. Nem a distância que a gente já viveu, nem os dias ruins, nem o tempo que ainda vem por aí muda isso.

Então guarda esse verso comigo, que não peguei emprestado de nenhum poeta nem de nenhuma música, porque ninguém te conhece do jeito que eu conheço: você carrega o dia inteiro guardado nos olhos, e a noite inteira guardada no sorriso.`;
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
    return `Se você está lendo isso, já faz um ano inteiro que eu te pedi em namoro.

Um ano parece pouco pertinho do tanto que eu sinto, mas foi tempo suficiente pra eu ter certeza de uma coisa: não existe versão de mim que não escolheria você de novo, sabendo de tudo o que a gente ia viver, bom ou ruim. Lembro de cada detalhe daquele dia, do frio na barriga, do medo de dar errado, e de como, no fim, nada mais importou além do seu sim.

Se hoje a gente brigou por bobagem, se a rotina engoliu um pouco da leveza, ou se esse ano trouxe coisa que a gente nem imaginava, quero que você leia isso e volte pro começo. Lembra do quanto eu quis isso. Do quanto eu ainda quero, todo santo dia.

Amor de verdade não é o dia do pedido, com foto bonita e roupa nova. É todo dia comum depois dele, os que ninguém filma nem guarda em cápsula nenhuma. É acordar do seu lado achando normal, quando na real é a maior sorte que eu já tive na vida.

E sim, continua tal qual o Chaves ama sanduíche de presunto. Isso, com certeza, nunca vai mudar.

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
   "SE UM DIA A GENTE DISCUTIR, LEIA ISSO" — uma carta escondida (link
   discreto no rodapé da página de memórias) escrita pensando num dia
   ruim, não num dia bom. Edite à vontade.
   ---------------------------------------------------------------------- */
function textoCartaDiscussao() {
    return `Se você tá lendo isso agora, é bem provável que hoje não foi um dia fácil entre a gente. Só queria lembrar de uma coisa antes de qualquer outra: brigar não quer dizer que a gente errou em se escolher, quer dizer só que a gente é gente, com dia ruim, cansaço e um orgulho que às vezes fala mais alto do que devia.

Ninguém é perfeito, nem eu, nem você, e tudo bem. É tipo aquela "Duas Metades" que a gente ouve no rádio às vezes: a graça nunca foi achar alguém sem defeito nenhum, foi achar alguém que vale a pena apesar deles, e você vale, e muito.

Nada do que a gente discute hoje apaga o que a gente construiu até aqui. Continua tudo valendo: o Colina, a estrada de terra, o balanço em Sales de Oliveira, cada risada boba, cada silêncio que virou carinho com o tempo.

Se der, respira, volta e conversa comigo de novo. E se ainda não conseguir agora, tudo bem, eu espero. Só não esquece que eu escolhi você antes de qualquer briga, e vou continuar escolhendo bem depois dela.

Com amor, até nos dias difíceis,`;
}

/* ----------------------------------------------------------------------
   LEMBRANÇAS PRA IMPRIMIR — cartão postal do mapa, constelação (clara e
   escura) e carta física com QR code. Tudo gerado NA HORA a partir dos
   dados que já existem (MAPA_LUGARES, TIMELINE_MARCOS, a carta final) —
   ou seja, sempre que você adicionar um lugar novo no mapa ou um marco
   novo na timeline, o próximo download já sai atualizado, sem precisar
   editar nada além desses arrays.
   ---------------------------------------------------------------------- */

// Link do site pra virar QR code na carta física. Deixe vazio ('') até
// saber onde o site vai ficar hospedado — enquanto estiver vazio, a carta
// física não mostra QR nenhum (só o texto), sem quebrar nada.
const URL_DO_SITE = '';

// Tamanho de impressão do cartão postal e da constelação: formato "foto
// revelada" (10x15cm), o padrão de qualquer revelação de foto em loja ou
// farmácia — barato e fácil de imprimir. Em pixels, numa resolução boa
// o bastante pra imprimir sem serrilhado (~300 DPI).
const IMPRIMIVEL_LARGURA_PX = 1181; // 10cm a 300dpi
const IMPRIMIVEL_ALTURA_PX = 1772;  // 15cm a 300dpi

/* ----------------------------------------------------------------------
   CÂMERA LENTA DE UM MOMENTO — um vídeo curto, tocado bem devagar e em
   loop, com frases surgindo por cima aos poucos. Coloque o vídeo em
   assets/video/ com o nome abaixo (qualquer extensão de
   GALERIA_EXTENSOES_VIDEO serve: .mp4, .mov, .webm). Enquanto o arquivo
   não existir, essa seção inteira fica escondida sozinha — sem quebrar
   nada nem mostrar um vídeo vazio.
   ---------------------------------------------------------------------- */
const MOMENTO_LENTO_ARQUIVO_BASE = 'momento-camera-lenta';
const MOMENTO_LENTO_VELOCIDADE = 0.45; // 1 = velocidade normal, quanto menor, mais lento
const MOMENTO_LENTO_FRASES = [
    'Esse instante não durou nem três segundos.',
    'Mas eu quis guardar ele pra sempre, bem devagar.',
    'Às vezes o amor cabe inteiro num segundo esticado.'
];

/* ----------------------------------------------------------------------
   ESPECIAL DE 8 DE AGOSTO — aniversário dela. Toda vez que o site for
   aberto no dia 8 de agosto (checando pela hora do servidor, igual à
   cápsula do tempo — ver js/sync.js), essa seção aparece na página de
   memórias, acima de tudo o mais, com uma mensagem só desse dia.
   ---------------------------------------------------------------------- */
const ANIVERSARIO_DIA = 8;
const ANIVERSARIO_MES = 8; // agosto
function textoAniversario() {
    return `Hoje é diferente de todos os outros dias: hoje é o seu dia.

Espero que 8 de agosto sempre te encontre cercada de girassol, do jeitinho que você merece, rodeada de quem te ama de verdade, com a vida te tratando tão bem quanto você trata todo mundo ao redor.

Que esse ano novo te traga viagem, foto nova pra guardar, bicho novo pra cuidar, e principalmente muita saúde e paz. E que em algum canto desse ano que começa hoje, a gente colecione mais um punhado de lugares novos, só nosso.

Feliz aniversário, meu amor. Hoje o mundo gira um pouquinho mais em volta de você, e eu não podia estar mais feliz de fazer parte disso.`;
}

/* ----------------------------------------------------------------------
   "SE UM DIA ESTIVER TRISTE, LEMBRE-SE DISSO" — um baralho de cartas, uma
   por vez, cada uma com um adjetivo + o motivo específico (não genérico)
   pelo qual você pensa isso dela. Fácil de editar: só adicionar/remover
   objetos dessa lista.
   ---------------------------------------------------------------------- */
const ADJETIVOS_PARA_ELA = [
    { adjetivo: 'Linda', motivo: 'principalmente quando nem percebe que está sendo observada, sem arrumar nada, do jeito mais natural do mundo.' },
    { adjetivo: 'Inteligente', motivo: 'do jeito que resolve as coisas sem precisar de ajuda de ninguém, mesmo quando finge que precisa só pra me ter por perto.' },
    { adjetivo: 'Forte', motivo: 'porque mesmo em dia difícil, você segue cuidando de nove bichos, de você mesma e ainda sobra carinho pra mim.' },
    { adjetivo: 'Engraçada', motivo: 'sem nem tentar. Você me faz rir só de contar como foi seu dia.' },
    { adjetivo: 'Especial', motivo: 'porque nunca conheci alguém que trata tão bem quem ama e tão bem os bichos que cruzam o seu caminho.' },
    { adjetivo: 'Magnífica', motivo: 'sim, magnífica mesmo. Existem pessoas boas, e existe você, que é diferente de todas elas.' },
    { adjetivo: 'Corajosa', motivo: 'porque abriu esse seu silêncio todo pra mim, mesmo sabendo que isso não é fácil pra você.' },
    { adjetivo: 'Amada', motivo: 'mais do que você imagina, mais do que eu consigo colocar em palavras, todos os dias, sem exceção.' },

    // A partir daqui, uma lista bem grande de adjetivos, só a palavra, sem
    // motivo embaixo — pra quando bater vontade de ver muitas palavras
    // bonitas sobre você, sem precisar de uma explicação pra cada uma.
    { adjetivo: 'Incrível' },
    { adjetivo: 'Doce' },
    { adjetivo: 'Carinhosa' },
    { adjetivo: 'Gentil' },
    { adjetivo: 'Generosa' },
    { adjetivo: 'Leal' },
    { adjetivo: 'Sincera' },
    { adjetivo: 'Autêntica' },
    { adjetivo: 'Alegre' },
    { adjetivo: 'Divertida' },
    { adjetivo: 'Espontânea' },
    { adjetivo: 'Cativante' },
    { adjetivo: 'Encantadora' },
    { adjetivo: 'Radiante' },
    { adjetivo: 'Luminosa' },
    { adjetivo: 'Serena' },
    { adjetivo: 'Calma' },
    { adjetivo: 'Paciente' },
    { adjetivo: 'Dedicada' },
    { adjetivo: 'Batalhadora' },
    { adjetivo: 'Determinada' },
    { adjetivo: 'Persistente' },
    { adjetivo: 'Guerreira' },
    { adjetivo: 'Resiliente' },
    { adjetivo: 'Confiante' },
    { adjetivo: 'Segura' },
    { adjetivo: 'Sensível' },
    { adjetivo: 'Empática' },
    { adjetivo: 'Compreensiva' },
    { adjetivo: 'Acolhedora' },
    { adjetivo: 'Protetora' },
    { adjetivo: 'Cuidadosa' },
    { adjetivo: 'Atenciosa' },
    { adjetivo: 'Companheira' },
    { adjetivo: 'Parceira' },
    { adjetivo: 'Presente' },
    { adjetivo: 'Sonhadora' },
    { adjetivo: 'Curiosa' },
    { adjetivo: 'Aventureira' },
    { adjetivo: 'Livre' },
    { adjetivo: 'Leve' },
    { adjetivo: 'Delicada' },
    { adjetivo: 'Meiga' },
    { adjetivo: 'Fofa' },
    { adjetivo: 'Charmosa' },
    { adjetivo: 'Elegante' },
    { adjetivo: 'Única' },
    { adjetivo: 'Rara' },
    { adjetivo: 'Preciosa' },
    { adjetivo: 'Valiosa' },
    { adjetivo: 'Verdadeira' },
    { adjetivo: 'Justa' },
    { adjetivo: 'Humilde' },
    { adjetivo: 'Grata' },
    { adjetivo: 'Otimista' },
    { adjetivo: 'Positiva' },
    { adjetivo: 'Animada' },
    { adjetivo: 'Espirituosa' },
    { adjetivo: 'Esperta' },
    { adjetivo: 'Sábia' },
    { adjetivo: 'Observadora' },
    { adjetivo: 'Criativa' },
    { adjetivo: 'Talentosa' },
    { adjetivo: 'Capaz' },
    { adjetivo: 'Admirável' },
    { adjetivo: 'Inspiradora' },
    { adjetivo: 'Marcante' },
    { adjetivo: 'Inesquecível' }
];

/* ----------------------------------------------------------------------
   EASTER EGGS DA LOJA — 5 toques no mesmo elemento revelam uma mensagem
   escondida. Cada chave abaixo corresponde ao id de um elemento clicável
   em index.html (ver iniciarEasterEggsLoja em js/store.js).
   ---------------------------------------------------------------------- */
const LOJA_EASTER_EGGS = {
    imagemPrincipalProduto: {
        titulo: 'Achou 👀',
        texto: `Já que você reparou tanto nessa foto, deixa eu confessar uma coisa: essa aliança não é de mentirinha. Ela é de verdade, e já foi escolhida. Só falta chegar até você.`
    },
    reviewGabrielClicavel: {
        titulo: 'Sobre o "Gabriel P." aqui de cima',
        texto: `Pois é, sou eu mesmo, deixando review antes até de fazer o pedido de verdade. Se essa review de 5 estrelas já falava sério sobre uma aliança que ainda nem tinha chegado, imagina o quanto eu falo sério sobre você.`
    },
    lojaLogoClicavel: {
        titulo: 'A Aryah nem existe',
        texto: `Confesso: essa loja inteira é de mentira, criada só pra te trazer até aqui sem estragar a surpresa. A única coisa 100% real nessa história toda é o quanto eu te amo.`
    }
};

/**
 * Igual a resolverFotoPlaceholder, mas para um vídeo estático em
 * assets/video/ (não gravado pelo usuário, um arquivo que você mesmo
 * coloca na pasta) — testa cada extensão de GALERIA_EXTENSOES_VIDEO,
 * maiúscula e minúscula, e devolve null se nada for encontrado (quem
 * chamar decide o que fazer nesse caso, ex.: esconder a seção toda).
 */
const __cacheResolverVideoPorBase = {};
async function resolverVideoPorBase(arquivoBase) {
    if (!arquivoBase) return null;
    if (arquivoBase in __cacheResolverVideoPorBase) return __cacheResolverVideoPorBase[arquivoBase];

    const candidatos = GALERIA_EXTENSOES_VIDEO.flatMap(ext => [ext, ext.toUpperCase()]);
    for (const ext of candidatos) {
        const caminho = `assets/video/${arquivoBase}.${ext}`;
        if (await arquivoExisteNoServidor(caminho)) {
            __cacheResolverVideoPorBase[arquivoBase] = caminho;
            return caminho;
        }
    }
    return null; // não guarda no cache — se o arquivo for adicionado depois, uma nova tentativa pode encontrar
}

/* ----------------------------------------------------------------------
   MAPA DA RELAÇÃO — lugares que a gente já foi juntos, na ordem em que
   você quiser mostrar. Fácil de editar: só adicionar/remover objetos
   dessa lista. Nada mais no código precisa mudar.
   - nome: título do lugar
   - cidade: aparece embaixo do nome, menor
   - texto: uma frase curta sobre o que esse lugar significa
   - icon: qualquer ícone do Bootstrap Icons (ex.: 'bi-heart-fill'),
     pode repetir entre lugares, sem problema
   - futuro: true deixa o card com visual de "ainda vamos viver isso"
     (usado no card de próximo destino, mas pode usar em qualquer outro)
   ---------------------------------------------------------------------- */
const MAPA_LUGARES = [
    { nome: 'Colina', cidade: 'Orlândia', texto: 'Onde tudo começou de verdade, no nosso primeiro encontro.', icon: 'bi-cup-hot-fill', foto: 'mapa_colina' },
    { nome: 'Santa Rosa de Viterbo', cidade: 'Casa dos meus avós', texto: 'Onde te apresentei pra minha família.', icon: 'bi-house-heart-fill', foto: 'mapa_santa_rosa' },
    { nome: 'Parque Curupira', cidade: 'Ribeirão Preto', texto: 'Um passeio tranquilo, só a gente, sem pressa nenhuma.', icon: 'bi-tree-fill', foto: 'mapa_curupira' },
    { nome: 'Um balanço', cidade: 'Sales de Oliveira', texto: 'Onde a gente sentou no fim daquele dia e o tempo pareceu parar um pouco.', icon: 'bi-flower1', foto: 'mapa_balanco' },
    { nome: 'Nuporanga', cidade: 'Onde acabei conhecendo seu tio e sua tia', texto: 'Um dia que era só de passagem e virou mais um lugar nosso.', icon: 'bi-signpost-2-fill', foto: 'mapa_nuporanga' },
    { nome: 'Próximo destino', cidade: 'A definir, com você', texto: 'Ainda temos o mundo inteiro pra conhecer juntos.', icon: 'bi-airplane-fill', futuro: true, foto: 'mapa_proximo' }
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
   SENHA DA CARTA "SE UM DIA A GENTE DISCUTIR, LEIA ISSO"
   ----------------------------------------------------------------------
   Antes de chegar na pergunta "Brigamos?" e na carta em si, pede essa
   senha, com uma dica que é só um lembrete carinhoso, não a resposta
   escancarada (ver iniciarCartaDiscussao() em js/romance.js).
   ---------------------------------------------------------------------- */
const SENHA_CARTA_DISCUSSAO = 'teamo';
const DICA_SENHA_CARTA_DISCUSSAO = 'A dica são duas palavras que a gente nunca pode esquecer de dizer um pro outro.';

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
    heroSubRomance: `tudo que você acabou de passar foi só uma desculpa boba pra te trazer até aqui. Não tinha aliança nenhuma chegando pelo correio, a única coisa que eu realmente queria entregar era isso: tudo que a gente construiu até hoje, contado do meu jeito, sem enfeite.`,
    encerramentoRomance: `obrigado por topar essa vida comigo, dia após dia, tipo "Amo Noite e Dia", sem exagero nenhum. Isso aqui é só um jeito diferente de dizer o que eu já sinto todos os dias: eu escolho você.`,
    digitacaoSuspense: `Cada uma dessas fotos guarda um pedaço da gente. E o pedido que você acabou de "fazer" também guarda um segredo...`,
    assinaturaCartaFinal: `Assim eu quero te amar, ${NOME_DELA}, pra sempre com você.`,
    polaroidFrasePadrao: `O dia em que tudo começou, ${NOME_DELA}.`,
    brigamosMensagemFofa: `Que bom que não. Guarda essa carta guardadinha aí, pro dia em que a gente realmente precisar dela. Até lá, só sabe de uma coisa: eu te amo.`
};
