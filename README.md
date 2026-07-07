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
galeria.html          → página própria da Galeria de lembranças
css/style.css        → todo o visual
js/config.js         → NOMES, HISTÓRIA, PERGUNTAS, QUIZ, TIMELINE, PLAYLIST — edite aqui
js/db.js              → armazenamento (IndexedDB) — não precisa mexer
js/utils.js           → funções utilitárias — não precisa mexer
js/desktop-block.js   → bloqueio de acesso via computador
js/store.js           → lógica da "loja" (home falsa)
js/suspense.js        → perguntas → assinatura → rastreio → vídeo → carta final
js/futuro.js           → "mensagem para nós do futuro"
js/romance.js          → página "Nossa História" (timeline, quiz, contrato, playlist, senha...)
js/galeria.js          → monta a Galeria de lembranças (galeria.html)
js/export.js           → exportar carta/certificado/polaroid + backup (.zip)
js/sync.js             → sincronização entre aparelhos (opcional, ver abaixo)
js/main.js             → inicialização geral
assets/img/            → coloque aqui as fotos (ver lista de placeholders)
assets/img/galeria/    → fotos da Galeria (padrão galeria_1.jpg, galeria_2.jpg, ...)
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
- `OPCOES_REGRAS_CONTRATO` (as cláusulas do "contrato de namoro", até 5 selecionáveis)
- `PEDIDO_PADRAO` (valores padrão de aro/gravação da home da joalheria)
- `TOTAL_FOTOS_GALERIA` / `GALERIA_LEGENDAS` (Galeria de lembranças)
- `COISAS_QUE_ELA_AMA` (pequena seção com coisas que ela ama, na página de memórias)
- `CARTA_USAR_TEXTO_TESTE` (liga/desliga o texto de teste da carta final)
- `SENHA_AREA_MEMORIAS` (senha que protege a área de memórias após o pedido)

Pequenos easter eggs da história de vocês foram espalhados discretamente
pela home da joalheria (um CNPJ fictício, o código de referência do
produto, um detalhe de resistência à praia, um girassol quase invisível
no fundo da seção "Nossa história") — nada gritante, para descobrir aos
poucos.

## Verificação do sistema (diagnostico.html)

Abra `diagnostico.html` (separado do site principal — a Poloni nunca vai
ver essa página) para rodar verificações reais:
- Escreve e lê de verdade no IndexedDB (arquivo pequeno ~50KB e arquivo
  grande ~8MB, simulando foto e vídeo).
- Mostra o espaço de armazenamento disponível no aparelho.
- Solicita armazenamento persistente (reduz o risco do Safari apagar os
  dados sozinho depois de dias sem uso).
- Confere se o navegador suporta gravação de câmera/microfone.
- Se você já configurou a nuvem (ver seção abaixo), testa uma conexão
  real: sobe um arquivo de teste, baixa de volta, confere e apaga.

Rode esse diagnóstico no MESMO aparelho e navegador que vai ser usado no
dia do pedido — os resultados podem variar entre Safari, Chrome, iPhone
e Android.

## Sincronização entre aparelhos (botão "Compartilhar")

Por padrão, tudo fica salvo só no aparelho onde foi criado (é assim que
IndexedDB funciona em qualquer site). Para o link "Compartilhar" abrir de
verdade em outro celular — com fotos, vídeo, contrato e mensagens — é
necessário um lugar gratuito na nuvem para guardar esses dados. As
instruções completas estão no topo do arquivo `js/sync.js`. Resumindo:

1. Crie um projeto grátis em supabase.com.
2. Crie um bucket de Storage público chamado `aurora-backups`, com
   políticas de INSERT/SELECT/UPDATE/DELETE liberadas para "anon".
3. Em Project Settings → API, copie a Project URL e a chave rotulada
   **"anon" / "public"** (nunca a "service_role") — se você gerar uma
   chave nova depois, a antiga para de funcionar e você precisa colar a
   nova.
4. Cole os dois valores em `SUPABASE_URL` e `SUPABASE_ANON_KEY`, no topo
   de `js/sync.js`.
5. Abra `diagnostico.html` e toque em "Testar conexão com a nuvem" para
   confirmar, com um teste real, que ficou tudo certo antes do grande dia.

Enquanto isso não for configurado, o botão "Compartilhar" continua
funcionando (compartilha o link), só não sincroniza os dados para outro
aparelho.

## Galeria de lembranças (página própria)

Álbum permanente, feito para crescer com o tempo — sem limite de fotos.
Página própria em `galeria.html`, aberta pelo botão "Ver nossa galeria"
logo abaixo de "Nossos Momentos" na página de memórias.

**Padrão de nomenclatura** (documentado também dentro da própria pasta,
em `assets/img/galeria/LEIA-ME.md`): salve as fotos em
`assets/img/galeria/` sempre como `galeria_1.jpg`, `galeria_2.jpg`,
`galeria_3.jpg`... Depois, atualize apenas o número em
`TOTAL_FOTOS_GALERIA`, no topo de `js/config.js`, para o total de fotos
que existem agora. Nenhum outro arquivo precisa ser tocado. Legendas por
foto são opcionais (`GALERIA_LEGENDAS`, também em `js/config.js`).

## Contrato de namoro — até 5 regras

O contrato agora aceita de 2 a 5 regras personalizadas (era 2 a 3). Ver
`MAX_REGRAS` em `js/romance.js` e `OPCOES_REGRAS_CONTRATO` em
`js/config.js` para editar as opções disponíveis.

## Testar a carta final antes da versão definitiva

Em `js/config.js`, a constante `CARTA_USAR_TEXTO_TESTE` (e o texto
`TEXTO_CARTA_TESTE`, com o marcador `[CARTA_TESTE]`) permite testar toda
a animação da carta final (envelope, troca de "{AMOR}" pelo nome dela,
música, etc.) sem usar o texto definitivo ainda. Deixe `false` para usar
o texto de verdade; troque para `true` só durante os testes.

## Proteção por senha da área de memórias

Implementada por último nesta rodada, depois de todas as demais correções
e melhorias terem sido concluídas e testadas — como pedido. Assim que o
pedido acontece e é salvo (`aurora_stage` vira `'final'`), qualquer novo
acesso ao link passa a pedir a senha (`1406`, em `SENHA_AREA_MEMORIAS` no
`js/config.js`) antes de mostrar "Nossa História". O primeiro acesso (a
experiência do pedido em si) nunca pede senha. Ver `solicitarSenhaMemorias()`
em `js/romance.js` e o gate em `js/main.js`.

## Personalização padrão da home (joalheria)

Os campos de tamanho/gravação das alianças já abrem preenchidos com os
valores padrão (aro 19 / "Poloni ♡ 14/06" na masculina, aro 13 /
"Schmeisk ♡ 14/06" na feminina, aro 13 no solitário) — mas continuam
editáveis a qualquer momento. Para trocar os padrões, edite o objeto
`PEDIDO_PADRAO` em `js/config.js`.

## Backup — correção completa (formato .zip)

**O problema:** o backup antigo guardava vídeo, áudios e fotos como texto
base64 dentro de um único `.json` gigantesco. Isso inflava o arquivo em
~33% e podia falhar silenciosamente ao tentar restaurar — especialmente
no Safari/iPhone, onde `JSON.parse()` em strings muito grandes é uma
falha conhecida do WebKit.

**A correção:** o backup agora é um arquivo `.zip`. Cada mídia (vídeo,
assinatura, fotos enviadas, Polaroids, mensagens para o futuro em
texto/áudio/vídeo, lembranças) vira um arquivo binário dentro do zip —
sem base64, sem string gigante para travar o navegador — descrito por um
`manifest.json` pequeno. A lista de mídias é montada automaticamente a
partir de tudo que existir no armazenamento local, então qualquer arquivo
enviado por qualquer funcionalidade do site entra no backup, sem precisar
listar tipo por tipo. Backups antigos (`.json`) ainda podem ser
restaurados, por compatibilidade, mas todo backup novo já sai em `.zip`.
Isso também acelera a sincronização automática entre aparelhos: um
arquivo pequeno separado (`-meta.json`) guarda só a data da última
alteração, então o site só baixa o `.zip` completo quando realmente
existir algo mais novo. Ver `js/export.js` e `js/sync.js`.

Testado o ciclo completo: gerar backup → apagar dados locais → restaurar
→ conferir que vídeo, áudios, fotos, Polaroids, mensagens para o futuro,
contrato, assinatura e progresso voltam exatamente como estavam.

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
