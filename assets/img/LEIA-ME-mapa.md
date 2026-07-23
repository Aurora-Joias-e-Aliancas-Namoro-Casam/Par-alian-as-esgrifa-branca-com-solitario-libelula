# Fotos do "Nosso mapa" (usadas no cartão postal e na constelação)

Cada local do mapa pode ter uma foto de verdade, que aparece tanto na
seção "Nosso mapa" quanto no cartão postal pra imprimir. Coloque o
arquivo aqui (`assets/img/`) com o nome exato da tabela abaixo.

## Extensão do arquivo: qualquer uma dessas serve

`.jpg`, `.jpeg`, `.png` ou `.webp` — maiúsculo ou minúsculo, tanto faz.

## Nome do arquivo (a parte antes da extensão)

| Local | Nome do arquivo |
|---|---|
| Colina (Orlândia) | `mapa-colina` |
| Santa Rosa de Viterbo | `mapa-santa-rosa` |
| Parque Curupira | `mapa-curupira` |
| O balanço (Sales de Oliveira) | `mapa-balanco` |
| Nuporanga | `mapa-nuporanga` |
| Próximo destino | `mapa-proximo` |

## Se adicionar um lugar novo no mapa

Ao adicionar um novo objeto em `MAPA_LUGARES` (em `js/config.js`), dê a
ele um `foto: 'algum_id'` e crie a entrada correspondente em
`PLACEHOLDERS` (no mesmo arquivo, procure pela seção "Fotos de cada
local do Nosso mapa" pra ver o padrão). O cartão postal e a constelação
pra imprimir já vão incluir esse lugar novo automaticamente no próximo
download, sem precisar editar mais nada.

## Se ainda não tiver a foto de algum lugar

Sem problema — aparece um quadradinho de espaço reservado no lugar (com
o nome do local escrito), tanto na tela quanto no cartão postal
exportado. Assim que adicionar o arquivo, é só recarregar a página e
gerar o cartão de novo.
