# Como adicionar fotos na Galeria

Salve as fotos aqui sempre com este nome, em sequência, sem limite de quantidade:

```
galeria_1.jpg
galeria_2.jpg
galeria_3.jpg
galeria_4.jpg
...
```

Depois de salvar o arquivo:

1. Abra `js/config.js`.
2. Procure por `TOTAL_FOTOS_GALERIA`.
3. Atualize o número para o total de fotos que agora existem nesta pasta.

Pronto — nenhum outro arquivo do projeto precisa ser tocado. A página `galeria.html` lê esse número
e monta o álbum automaticamente.

Formatos aceitos: `.jpg` (padrão). Se alguma foto específica for `.png` ou `.webp`, informe a
extensão real no objeto `EXTENSAO_GALERIA` (também em `js/config.js`).

Legendas são opcionais — para dar uma frase a uma foto específica, adicione uma entrada em
`GALERIA_LEGENDAS` (também em `js/config.js`) usando o mesmo número da foto.
