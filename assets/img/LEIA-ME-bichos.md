# Fotos de "Seus bichos"

Pra cada bicho aparecer com foto ao tocar no nome dele (na seção "Seus
bichos", na página de memórias), basta colocar o arquivo aqui nesta pasta
(`assets/img/`) com o nome exato da tabela abaixo — não precisa editar
nenhum código.

## Extensão do arquivo: qualquer uma dessas serve

`.jpg`, `.jpeg`, `.png` ou `.webp` — maiúsculo ou minúsculo, tanto faz
(`.JPG` funciona igual a `.jpg`). O site testa sozinho até achar a
extensão certa. Essa lista de extensões aceitas fica em
`EXTENSOES_FOTO_ACEITAS`, em `js/config.js`, caso um dia precise aceitar
outro formato.

## Nome do arquivo (a parte antes da extensão)

| Bicho | Nome do arquivo (qualquer extensão da lista acima) |
|---|---|
| Koda | `bicho-koda` |
| Xixico | `bicho-xixico` |
| Kovu | `bicho-kovu` |
| Yuk | `bicho-yuk` |
| Ahadi | `bicho-ahadi` |
| Shury | `bicho-shury` |
| Sol | `bicho-sol` |
| Lua | `bicho-lua` |
| Negão (em memória) | `bicho-negao` |
| Slinky (em memória) | `bicho-slinky` |
| Tommy (em memória) | `bicho-tommy` |
| Anne (em memória) | `bicho-anne` |

Exemplos válidos pro Koda: `bicho-koda.jpg`, `bicho-koda.png`,
`bicho-koda.webp`, `bicho-koda.JPG`. Só não vale ter mais de um arquivo
com o mesmo nome base e extensões diferentes ao mesmo tempo (ex.:
`bicho-koda.jpg` E `bicho-koda.png` juntos) — nesse caso o site usa o
primeiro que encontrar, na ordem da lista de extensões aceitas.

## Se ainda não tiver a foto de algum bicho

Sem problema — enquanto o arquivo não existir, aparece um quadradinho de
espaço reservado no lugar (com o nome do bicho escrito), em vez de
quebrar ou dar erro. Assim que você adicionar o arquivo com o nome certo,
é só recarregar a página.
