# Aurora Joias — Projeto do Pedido de Namoro

Site interativo (disfarçado de e-commerce de joias) criado para conduzir a
Poloni até um pedido de namoro. Feito para celular; um computador vê uma
tela de bloqueio com QR Code apontando de volta para o celular.

## Como abrir

Basta abrir `index.html` num navegador de celular. Para publicar no
GitHub Pages: suba a pasta inteira para um repositório, ative o Pages
apontando para a branch/pasta raiz, e o link do Pages já funciona.

## Estrutura de pastas

```
index.html          → toda a marcação (HTML) do site
css/style.css        → todo o visual
js/config.js         → NOMES, HISTÓRIA, PERGUNTAS, QUIZ, TIMELINE, PLAYLIST — edite aqui
js/db.js              → armazenamento (IndexedDB) — não precisa mexer
js/utils.js           → funções utilitárias — não precisa mexer
js/desktop-block.js   → bloqueio de acesso via computador
js/store.js           → lógica da "loja" (home falsa)
js/suspense.js        → perguntas → assinatura → rastreio → vídeo → carta final
js/futuro.js           → "mensagem para nós do futuro"
js/romance.js          → página "Nossa História" (timeline, quiz, contrato, playlist...)
js/export.js           → exportar carta/certificado/polaroid + backup
js/sync.js             → sincronização entre aparelhos (opcional, ver abaixo)
js/main.js             → inicialização geral
assets/img/            → coloque aqui as fotos (ver lista de placeholders)
assets/audio/          → coloque aqui as músicas
assets/video/          → (opcional) vídeos
```

## Placeholders de mídia — o que enviar e onde

Nenhuma imagem/vídeo/áudio do site depende de link temporário. Tudo é lido
localmente da pasta `assets/`. Enquanto um arquivo não existir, o site
mostra automaticamente um quadro elegante no lugar (não quebra).

A lista completa e atualizável está em `js/config.js`, no objeto
`PLACEHOLDERS`. Resumo do que enviar:

### Fotos do casal
| Arquivo (dentro de assets/img/) | Onde aparece |
|---|---|
| casal-1.jpg / casal-2.jpg / casal-3.jpg | Galeria de polaroids durante o suspense |
| foto-final.jpg | Foto grande após "identidade confirmada" |
| flashback-1.jpg … flashback-5.jpg | Flashback cinematográfico antes de "Nossa História" |
| timeline-1.jpg … timeline-6.jpg, timeline-hoje.jpg | Linha do tempo |
| momento-1.jpg … momento-4.jpg | "Nossos momentos" (mesa de fotos) |

### Fotos da "loja"
produto-principal.jpg, produto-detalhe.jpg, produto-estojo.jpg,
produto-par.jpg, colecao-flor-rosa.jpg, colecao-libelula.jpg,
colecao-prata.jpg, colecao-estojos.jpg, relacionado-colar.jpg,
relacionado-brinco.jpg, relacionado-pulseira.jpg, relacionado-estojo.jpg
— todas genéricas, podem ser qualquer foto de alianças/joias.

### Áudio
| Arquivo (dentro de assets/audio/) | Onde aparece |
|---|---|
| nossa-musica.mp3 | Toca quando a carta final é aberta ("Um Dia Te Levo Comigo") |
| playlist-1.mp3, playlist-2.mp3, playlist-3.mp3, playlist-4.mp3 | Faixas extras da playlist do casal |

## O que editar antes de usar

Tudo em **`js/config.js`**:
- `PLAYLIST_FAIXAS`, `QUIZ_PERGUNTAS` (edite as opções entre colchetes)
- `TIMELINE_MARCOS` (datas/textos já preenchidos com a história de vocês —
  ajuste como quiser)
- `OPCOES_REGRAS_CONTRATO` (as cláusulas do "contrato de namoro")

## Sincronização entre aparelhos (botão "Compartilhar")

Por padrão, tudo fica salvo só no aparelho onde foi aberto (assim como
qualquer site funciona). Para o link "Compartilhar" abrir de verdade em
outro celular — com fotos, vídeo, contrato e mensagens — é necessário um
lugar gratuito na nuvem para guardar esses dados. As instruções completas
(gratuitas, ~5 minutos, sem programar) estão no topo do arquivo
`js/sync.js`. Resumindo: crie um projeto grátis no supabase.com, crie um
bucket de Storage público chamado `aurora-backups`, e cole a URL do
projeto + a chave "anon" nas duas constantes no topo do arquivo.

Enquanto isso não for configurado, o botão "Compartilhar" continua
funcionando (compartilha o link normalmente), só não sincroniza os dados
para outro aparelho.

## Correções desta versão (resumo técnico)

- **Vídeo/áudio no Safari/iPhone**: cada mídia agora é seu próprio
  registro no IndexedDB (em vez de um array dentro de um único registro),
  com leitura de confirmação após cada escrita. Ver `js/db.js`.
- **Música no momento certo**: o `play()` da trilha agora acontece dentro
  do próprio clique que abre o envelope da carta — nunca antes, e sempre
  dentro de um gesto real do usuário (resolve o bloqueio de autoplay do
  Safari). Ver `iniciarCartaFinal()` em `js/suspense.js`.
- **Scroll horizontal**: eliminado com `overflow-x: hidden` consistente e
  `box-sizing: border-box` global.
- **Botão "Continuar" fora da tela**: agora rola automaticamente até ele
  quando aparece.
- **Áreas brancas no fim da página**: o fundo do `<body>` acompanha a cor
  da tela ativa (clara na loja, escura no suspense/romance), evitando o
  "flash" branco do bounce-scroll do iOS.
- **Bloqueio de desktop**: computadores veem uma tela com QR Code
  apontando para o próprio link, em vez do site.
- **Placeholders nomeados**: substituídos todos os links temporários por
  identificadores (`imagem_casal_1`, etc.), documentados em
  `js/config.js`.
