# Como adicionar fotos e vídeos na Galeria

## ⚠️ Antes de tudo — o erro mais comum

Se você tirou as fotos com iPhone, elas provavelmente estão salvas em formato **HEIC**
(`.heic`), não `.jpg`. **HEIC não funciona no site** — a maioria dos navegadores não
consegue exibir esse formato. Se as fotos "somem" ou nunca aparecem, é quase sempre isso.

**Solução:** ao transferir as fotos do iPhone para o computador, exporte/converta como
**JPEG**. No próprio iPhone: Ajustes → Câmera → Formatos → escolha "Mais Compatível" antes
de tirar novas fotos. Para fotos que você já tem, no Mac o Preview consegue exportar como
JPEG; no Windows, ferramentas gratuitas de conversão HEIC→JPG resolvem em segundos.

## Passo a passo (bem simples agora)

Salve os arquivos aqui sempre com este nome exato, em sequência a partir de 1:

```
galeria_1.jpg
galeria_2.mp4      <- um vídeo, nesse exemplo — funciona igual à foto
galeria_3.jpg
galeria_4.jpg
...
```

**É só isso.** O site descobre sozinho:
- **Quantos itens existem** — não precisa contar nem configurar nada em lugar nenhum.
- **Se cada um é foto ou vídeo** — só pela extensão do arquivo.

Não existe mais nenhum número pra atualizar em `js/config.js` toda vez que você adiciona um
item novo.

**Atenção aos detalhes que mais dão erro:**
- Tudo em **minúsculo**: `galeria_1.jpg`, nunca `Galeria_1.JPG` ou `GALERIA_1.jpg`.
- Sem espaços, sem acentos, sem "(1)" no nome.
- Siga a sequência sem pular muitos números — o site para de procurar depois de 6 números
  seguidos sem encontrar nada (então um buraco pequeno tudo bem, mas não pule de 1 pra 20).

**Formatos aceitos:**
- Fotos: `.jpg`, `.jpeg`, `.png`, `.webp`. **Não** `.heic`.
- Vídeos: `.mp4`, `.mov`, `.webm`.

## Como testar se deu certo

Abra `diagnostico.html` no celular e toque em **"Testar galeria"** — ele mostra exatamente
quais itens foram encontrados e de qual tipo, sem precisar abrir a galeria de verdade.

---

## Vídeos do YouTube (sem precisar do arquivo — ótimo pra vídeos grandes)

Se um vídeo estiver muito grande para guardar como arquivo, você pode deixá-lo no YouTube
(pode ser como **"Não listado"**, assim só quem tem o link acessa) e só apontar pra ele. Ele
roda embutido, dentro do próprio site — a pessoa não é levada pro app/site do YouTube.

Não precisa criar nenhum arquivo em `assets/img/galeria/` para isso. Em `js/config.js`,
procure por `GALERIA_YOUTUBE` e adicione uma linha:

```js
const GALERIA_YOUTUBE = [
    { link: 'https://www.youtube.com/watch?v=XXXXXXXXXXX', legenda: 'Legenda opcional' },
];
```

Aceita o link como vier do botão "Compartilhar" do YouTube (celular ou navegador), inclusive
links curtos `youtu.be` e Shorts. Pode adicionar quantos vídeos quiser, um por linha.

---

## Legendas (opcional)

Para dar uma frase a uma foto ou vídeo local específico, abra `js/config.js` e adicione uma
entrada em `GALERIA_LEGENDAS`, usando o mesmo número do arquivo:

```js
const GALERIA_LEGENDAS = {
    3: 'Aquele dia na praia.',
};
```

Para um vídeo do YouTube, a legenda já vai junto na própria entrada de `GALERIA_YOUTUBE`
(ver acima).

**Dica:** para vídeos locais, prefira arquivos já comprimidos/curtos quando possível — isso
deixa a página carregando mais rápido no celular. Para vídeos maiores/mais longos, o YouTube
(acima) é o caminho mais leve.
