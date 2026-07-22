# Vídeo de "Um instante em câmera lenta"

Pra essa seção aparecer na página de memórias (logo depois do vídeo do
pedido), basta colocar o vídeo aqui nesta pasta (`assets/video/`) com o
nome exato:

```
momento-camera-lenta.mp4
```

## Extensão do arquivo: qualquer uma dessas serve

`.mp4`, `.mov` ou `.webm` — maiúsculo ou minúsculo, tanto faz (`.MP4`
funciona igual a `.mp4`). O site testa sozinho até achar a extensão
certa. Essa lista fica em `GALERIA_EXTENSOES_VIDEO`, em `js/config.js`.

## O que escolher

Um clipe curto (uns 2 a 5 segundos já bastam, já que ele toca em loop e
bem devagar) de um instante marcante: ela rindo, um olhar, o balanço em
Sales de Oliveira, qualquer coisa que valha a pena "esticar no tempo".
Não precisa ter áudio, o vídeo toca sempre mudo.

## Enquanto o vídeo não existir

Sem problema — a seção inteira fica escondida (não aparece nada quebrado
nem um espaço vazio estranho). Assim que você adicionar o arquivo com o
nome certo, é só recarregar a página.

## As frases que aparecem por cima do vídeo

Ficam em `MOMENTO_LENTO_FRASES`, em `js/config.js` — edite à vontade,
qualquer quantidade de frases funciona, elas vão se revezando sozinhas.
A velocidade do vídeo (o quão devagar ele toca) fica em
`MOMENTO_LENTO_VELOCIDADE`, no mesmo arquivo.
