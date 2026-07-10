# Como adicionar fotos e vídeos na Galeria

Salve as fotos e vídeos aqui sempre com este nome, em sequência, sem limite de quantidade:

```
galeria_1.jpg
galeria_2.jpg
galeria_3.mp4      <- um vídeo local, nesse exemplo
galeria_4.jpg
...
```

Depois de salvar o arquivo:

1. Abra `js/config.js`.
2. Procure por `TOTAL_FOTOS_GALERIA` e atualize o número para o total de itens que agora existem
   nesta pasta (contando fotos e vídeos juntos).
3. **Se o item novo for um VÍDEO LOCAL**, procure por `TIPO_GALERIA` (logo abaixo) e adicione uma
   linha com o mesmo número, assim: `3: 'video',` — é isso que diz pro site montar um player de
   vídeo ali em vez de uma foto. Fotos não precisam de nenhuma entrada aqui.

Pronto — nenhum outro arquivo do projeto precisa ser tocado. A página `galeria.html` lê essas
configurações e monta o álbum automaticamente (vídeos aparecem com um ícone de play por cima,
e abrem com controles de reprodução ao tocar).

**Formatos aceitos:**
- Fotos: `.jpg` (padrão), `.jpeg`, `.png`, `.webp`.
- Vídeos locais: `.mp4` (padrão), `.mov`, `.webm`.

Se algum item específico não usar a extensão padrão do seu tipo, informe a extensão real no
objeto `EXTENSAO_GALERIA` (também em `js/config.js`) — por exemplo `5: 'png'` para uma foto, ou
`3: 'mov'` para um vídeo.

---

## Vídeos do YouTube (sem precisar do arquivo — ótimo pra vídeos grandes)

Se um vídeo estiver muito grande para guardar como arquivo, você pode deixá-lo no YouTube (pode
ser como **"Não listado"**, assim só quem tem o link acessa) e só apontar pra ele daqui. Ele roda
embutido, dentro do próprio site — a pessoa não é levada pro app/site do YouTube.

Não precisa criar nenhum arquivo em `assets/img/galeria/` para esse número. Só:

1. Em `js/config.js`, no `TIPO_GALERIA`, marque o número como vídeo do YouTube:
   `6: 'youtube',`
2. Logo abaixo, em `YOUTUBE_GALERIA`, cole o link do vídeo (ou só o código, se preferir) com o
   mesmo número:
   `6: 'https://www.youtube.com/watch?v=XXXXXXXXXXX',`
3. Atualize `TOTAL_FOTOS_GALERIA` incluindo esse número, como qualquer outro item.

Aceita o link como vier do botão "Compartilhar" do YouTube (celular ou navegador), inclusive
links curtos `youtu.be` e Shorts.

---

Legendas são opcionais e funcionam igual para foto, vídeo local ou vídeo do YouTube — para dar
uma frase a um item específico, adicione uma entrada em `GALERIA_LEGENDAS` (também em
`js/config.js`) usando o mesmo número do item.

**Dica:** para vídeos locais, prefira arquivos já comprimidos/curtos quando possível — isso deixa
a página carregando mais rápido no celular. Para vídeos maiores/mais longos, o YouTube (acima) é
o caminho mais leve.
