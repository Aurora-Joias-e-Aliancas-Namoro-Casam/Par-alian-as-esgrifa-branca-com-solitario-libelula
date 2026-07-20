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
index.html             → toda a marcação (HTML) do site principal
galeria.html            → página própria da Galeria de lembranças
diagnostico.html        → página de testes técnicos (a Poloni nunca vê essa)
css/style.css           → todo o visual
js/config.js            → NOMES, HISTÓRIA, PERGUNTAS, QUIZ, TIMELINE, PLAYLIST, GALERIA, SENHAS — edite aqui
js/db.js                → armazenamento (IndexedDB) — não precisa mexer
js/utils.js             → funções utilitárias (compressão de imagem, gravação, iOS) — não precisa mexer
js/desktop-block.js     → bloqueio de acesso via computador
js/store.js             → lógica da "loja" (home falsa)
js/suspense.js          → perguntas → assinatura → rastreio → vídeo → carta final
js/futuro.js            → "mensagem para nós do futuro"
js/romance.js           → página "Nossa História" (timeline, quiz, contrato, playlist, senha, rever lojinha...)
js/galeria.js           → monta a Galeria de lembranças (galeria.html) — fotos, vídeos locais e do YouTube
js/export.js            → exportar carta/certificado/polaroid + backup (.zip) + lembrete de backup + reset
js/sync.js              → sincronização entre aparelhos (opcional, ver abaixo) + marcador de reset
js/diagnostics.js       → lógica da página diagnostico.html
js/main.js              → inicialização geral
assets/img/             → coloque aqui as fotos (ver lista de placeholders)
assets/img/galeria/     → itens da Galeria (padrão galeria_1.jpg, galeria_2.mp4, ... — ver LEIA-ME.md na pasta)
assets/audio/           → coloque aqui as músicas
assets/video/           → (não usado atualmente — nenhum placeholder aponta pra cá)
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
- `TOTAL_FOTOS_GALERIA` / `TIPO_GALERIA` / `YOUTUBE_GALERIA` / `GALERIA_LEGENDAS` (Galeria de lembranças — ver seção própria abaixo)
- `COISAS_QUE_ELA_AMA` (pequena seção com coisas que ela ama, na página de memórias)
- `CARTA_USAR_TEXTO_TESTE` (liga/desliga o texto de teste da carta final)
- `SENHA_AREA_MEMORIAS` (senha que protege a área de memórias após o pedido)
- `SENHA_RESET_SITE` (senha exigida pelo botão "Resetar site", agora em `diagnostico.html` — ver seção própria abaixo)
- `CAPSULA_YOUTUBE_ID` (opcional: ID do vídeo do YouTube com a mensagem em vídeo da cápsula do tempo)
- `VIDEO_PROCESSO_YOUTUBE_URL` (opcional: link do YouTube com o vídeo do processo até o pedido — mostra um botão perto do vídeo do pedido, na página final)
- `EXPERIENCE_ID` (identificador fixo usado pela sincronização entre aparelhos — troque só se for reaproveitar o projeto para outro casal)

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
- Botão "Testar upload de mídia real (8MB)": sobe um arquivo BINÁRIO de
  verdade pelo mesmo caminho que fotos/vídeos usam — é o teste que
  realmente detecta se o bucket do Supabase tem um limite de tamanho
  baixo demais (o teste de conexão simples usa um JSON minúsculo e pode
  passar mesmo que vídeos grandes falhem).

Rode esse diagnóstico no MESMO aparelho e navegador que vai ser usado no
dia do pedido — os resultados podem variar entre Safari, Chrome, iPhone
e Android.

## Sincronização entre aparelhos (botão "Compartilhar")

Por padrão, tudo fica salvo só no aparelho onde foi criado (é assim que
IndexedDB funciona em qualquer site). Para o link abrir de verdade em
outro celular — com fotos, vídeo, contrato e mensagens — é necessário um
lugar gratuito na nuvem para guardar esses dados. As instruções completas
estão no topo do arquivo `js/sync.js`. Resumindo:

1. Crie um projeto grátis em supabase.com.
2. Crie um bucket de Storage público chamado `aurora-backups`, com
   políticas de INSERT/SELECT/UPDATE/DELETE liberadas para "anon".
3. **Importante — limite de tamanho do bucket:** no painel, em
   Storage → aurora-backups → "Edit bucket", confira o campo "File size
   limit". O padrão do plano gratuito costuma ser 50MB. Se os vídeos do
   projeto costumam passar disso, aumente esse limite ali (o plano
   gratuito permite até 5GB por arquivo) — sem isso, o upload do backup
   falha silenciosamente.
4. Em Project Settings → API, copie a Project URL e a chave rotulada
   **"anon" / "public"** (nunca a "service_role") — se você gerar uma
   chave nova depois, a antiga para de funcionar e você precisa colar a
   nova.
5. Cole os dois valores em `SUPABASE_URL` e `SUPABASE_ANON_KEY`, no topo
   de `js/sync.js`.
6. Abra `diagnostico.html` e rode os dois testes de nuvem (conexão simples
   e upload de mídia real de 8MB) para confirmar, com testes reais, que
   ficou tudo certo antes do grande dia.

Enquanto isso não for configurado, o botão "Compartilhar" continua
funcionando (compartilha o link), só não sincroniza os dados para outro
aparelho.

**Nota sobre segurança:** a chave "anon" do Supabase, por natureza desse
tipo de projeto (site 100% estático, sem servidor próprio), fica visível
no código-fonte da página — não existe "segredo perfeito" possível aqui.
Isso é esperado e é assim que projetos Supabase client-side funcionam;
proteção de verdade contra uso indevido da API (não da tela do site) é
configurada nas políticas do bucket (RLS) no painel do Supabase, não em
código. O mesmo raciocínio vale para `SENHA_RESET_SITE` (abaixo): ela
impede um toque acidental na tela, não uma chamada direta à API por
alguém que tenha a chave.

**Como funciona por baixo dos panos:** cada mídia (vídeo, foto, áudio) é
enviada como seu próprio arquivo dentro de um `.zip` — nunca como texto
base64 dentro de um JSON gigante (isso já foi um bug real: o arquivo
inflava e o envio inteiro falhava silenciosamente). Mídia grande (vídeo,
foto, áudio) sincroniza IMEDIATAMENTE ao ser salva, sem esperar; um aviso
fica visível no topo da tela ("Salvando na nuvem...") enquanto isso
acontece — é importante não travar a tela nem fechar o app enquanto esse
aviso estiver visível, senão o envio pode ser interrompido pelo sistema
(principalmente no iPhone).

## Reset do site (com senha + sincroniza entre aparelhos)

O botão "Resetar site" fica em `diagnostico.html` (fora do site principal,
pra evitar toque acidental — mesma senha de antes) e agora:
1. **Pede uma senha** (`SENHA_RESET_SITE` em `js/config.js`, padrão
   `13046700`) antes de fazer qualquer coisa. Ver nota de segurança acima
   sobre os limites dessa proteção.
2. **Publica o reset na nuvem primeiro, com várias tentativas e
   confirmação de leitura** (`publicarResetNaNuvem()` em `js/sync.js`) —
   só depois disso confirmar de verdade é que o aparelho local é limpo
   (IndexedDB, localStorage, sessionStorage e cache). Se a nuvem não
   confirmar (sem internet, por exemplo), NADA é apagado ainda, e a tela
   mostra pra tentar de novo — assim não existe mais o estado confuso de
   "resetei aqui mas o outro aparelho continua com os dados antigos".
3. **Avisa o outro aparelho.** Um marcador é publicado no `meta.json` da
   nuvem; qualquer aparelho que abrir o link depois confere esse marcador
   antes de mais nada e se limpa também, se for o caso. Ver
   `sincronizarNaAbertura()` em `js/sync.js`.

## Rever a lojinha (sem afetar nada)

Na página final, o botão "Rever a lojinha das alianças" mostra de novo a
home falsa da joalheria, só para relembrar — em modo somente leitura: o
botão de confirmar pedido fica escondido, e nada ali é salvo no banco.
Um aviso fixo no rodapé ("Só revendo — nada aqui é salvo") e um botão
"Voltar para nossa história" ficam sempre visíveis nesse modo. Ver
`abrirLojaSomenteVisualizacao()` em `js/romance.js`.

## Lembrete de backup manual

A sincronização automática com a nuvem é ótima, mas é uma dependência de
terceiro. Por isso, na página final, um pequeno card sugere baixar uma
cópia de segurança (o `.zip` completo) quando faz tempo que ninguém baixa
uma — nunca no meio da experiência, e sem incomodar toda vez (respeita
"lembrar depois" por 14 dias). Ver `verificarLembreteBackup()` em
`js/export.js`. Vale o hábito de baixar esse backup manualmente de vez em
quando, principalmente logo depois do pedido — é a única cópia que fica
100% com vocês, fora de qualquer serviço.

## Galeria de lembranças (página própria)

Álbum permanente, feito para crescer com o tempo — sem limite de itens.
Página própria em `galeria.html`, aberta pelo botão "Ver nossa galeria"
logo abaixo de "Nossos Momentos" na página de memórias. Descoberta
**automática**: nenhuma lista de números pra manter atualizada — o site
testa sozinho, a partir de `galeria_1`, `galeria_2`... até parar de achar
arquivos. Três tipos de item, todos na mesma pasta:

- **Foto** (padrão): salve em `assets/img/galeria/` como `galeria_1.jpg`,
  `galeria_2.jpg`... (extensões aceitas em `GALERIA_EXTENSOES_FOTO`, em
  `js/config.js`). Nenhuma configuração extra necessária.
- **Vídeo local**: mesma pasta, mesma numeração, só troca a extensão —
  ex. `galeria_3.mp4` (extensões aceitas em `GALERIA_EXTENSOES_VIDEO`). O
  site reconhece pela extensão automaticamente (inclusive em MAIÚSCULO,
  ex. `.MOV`/`.MP4`, comum em export de iPhone) — não precisa marcar nada
  em lugar nenhum. Aparece na grade com um ícone de play por cima da capa.
- **Vídeo do YouTube** (ótimo para vídeos grandes, sem precisar do
  arquivo): adicione uma entrada em `GALERIA_YOUTUBE` (em `js/config.js`)
  com o link (ou só o ID). Roda embutido dentro do site, sem levar a
  pessoa pro app do YouTube. Recomendo subir como "Não listado" no
  YouTube, assim só quem tem o link acessa.

No lightbox (ao abrir uma foto/vídeo): dá pra navegar entre os itens com
os botões `‹ ›`, setas do teclado ou arrastando o dedo (swipe), o fundo da
página fica travado (sem rolar por trás) enquanto está aberto, e tem um
botão de download (exceto para itens do YouTube, que abrem direto no
player embutido). Legendas são opcionais e funcionam igual para qualquer
tipo (`GALERIA_LEGENDAS`). Passo a passo completo também disponível em
`assets/img/galeria/LEIA-ME.md`.

## Contrato de namoro — até 5 regras

O contrato aceita de 2 a 5 regras personalizadas. Ver `MAX_REGRAS` em
`js/romance.js` e `OPCOES_REGRAS_CONTRATO` em `js/config.js` para editar
as opções disponíveis.

## Testar a carta final antes da versão definitiva

Em `js/config.js`, a constante `CARTA_USAR_TEXTO_TESTE` (e o texto
`TEXTO_CARTA_TESTE`, com o marcador `[CARTA_TESTE]`) permite testar toda
a animação da carta final (envelope, troca de "{AMOR}" pelo nome dela,
música, etc.) sem usar o texto definitivo ainda. Deixe `false` para usar
o texto de verdade; troque para `true` só durante os testes.

## Proteção por senha da área de memórias

Assim que o pedido acontece e é salvo (`aurora_stage` vira `'final'`),
qualquer novo acesso ao link passa a pedir a senha (`SENHA_AREA_MEMORIAS`
em `js/config.js`, padrão `1406`) antes de mostrar "Nossa História". O
primeiro acesso (a experiência do pedido em si) nunca pede senha. Ver
`solicitarSenhaMemorias()` em `js/romance.js` e o gate em `js/main.js`.

## Personalização padrão da home (joalheria)

Os campos de tamanho/gravação das alianças já abrem preenchidos com os
valores padrão (aro 19 / "Poloni ♡ 14/06" na masculina, aro 13 /
"Schmeisk ♡ 14/06" na feminina, aro 13 no solitário) — mas continuam
editáveis a qualquer momento. Para trocar os padrões, edite o objeto
`PEDIDO_PADRAO` em `js/config.js`.

## Polaroid do momento (com câmera)

O botão "Polaroid do momento" (página final) abre a câmera na hora, em
vez de usar uma foto genérica: tirar a foto → confirmar ou repetir → só
então a Polaroid é gerada, com a data do pedido automática e uma frase
personalizável (ou a frase padrão do projeto, se nada for digitado). A
Polaroid final fica salva no banco/nuvem, então aparece em qualquer
aparelho depois de sincronizar. Ver `abrirCameraPolaroid()` em
`js/export.js`.

## Compressão de mídia (fotos e vídeo)

Fotos (lembranças, Polaroid) são automaticamente redimensionadas e
comprimidas antes de salvar (JPEG, ~1600px no lado maior) — reduz o
tamanho em 60-85% sem perda visível no celular. Vídeo e áudio gravados
pelo site usam um bitrate limitado para não estourar o limite de tamanho
do bucket, **exceto no iPhone** (Safari e Chrome, que usam o mesmo motor
por exigência da Apple): o WebKit tem bugs conhecidos onde limitar o
bitrate corrompe a gravação silenciosamente, então nesse caso o site
prioriza "gravar de verdade" em vez de "arquivo menor". Ver
`comprimirImagem()` e `montarOpcoesMediaRecorder()` em `js/utils.js`.

## Backup completo (.zip) — baixar e restaurar

Cada mídia (vídeo, assinatura, fotos enviadas, Polaroids, mensagens para
o futuro em texto/áudio/vídeo, lembranças) vira um arquivo binário dentro
de um `.zip` — sem base64, sem string gigante para travar o navegador —
descrito por um `manifest.json` pequeno dentro do próprio zip. A lista de
mídias é montada automaticamente a partir de tudo que existir no
armazenamento local, então qualquer arquivo enviado por qualquer
funcionalidade do site entra no backup, sem precisar listar tipo por
tipo. Botões "Backup da Nossa História" (baixa) e "Restaurar Backup"
(escolhe um arquivo `.zip` ou `.json` antigo) ficam na página final. Ver
`js/export.js`.

## Bloqueio de desktop

Computadores veem uma tela com QR Code apontando para o próprio link, em
vez do site — garante que a experiência sempre aconteça no celular. Ver
`js/desktop-block.js`.

**Testar no computador:** digite `abrirauroradesktop` em qualquer lugar da
página (não precisa clicar em nada antes) para liberar o site nesse
navegador — fica lembrado (localStorage), então só precisa digitar uma vez
por computador. Digite a mesma sequência de novo para bloquear de volta
(útil em computador compartilhado).

## Cápsula do tempo ("carta para o futuro")

Uma carta que só abre sozinha 1 ano depois do pedido (`CAPSULA_DIAS_PARA_DESBLOQUEIO`
em `js/config.js`), na página final. Opcionalmente, um botão "Ver o
vídeo" aparece dentro da carta levando a um vídeo do YouTube — preencha
`CAPSULA_YOUTUBE_ID` (só o ID, não a URL inteira) quando gravar.

A checagem de desbloqueio usa a **hora do servidor** (não a do aparelho —
ver `obterHoraConfiavel()` em `js/sync.js`), justamente para que adiantar
a data/hora do celular não abra a carta antes da hora. **Importante ser
honesto sobre o limite disso**: como é um site estático, sem servidor ou
login por trás, essa proteção cobre bem o golpe mais comum (mudar a data
do aparelho) e impede abrir o console do navegador e forçar a revelação
direto, mas não impede alguém tecnicamente capaz de abrir os arquivos-
fonte do site (`js/config.js`) de ler o texto antes da data — isso é uma
limitação de qualquer site que roda 100% no navegador, sem exceção.


