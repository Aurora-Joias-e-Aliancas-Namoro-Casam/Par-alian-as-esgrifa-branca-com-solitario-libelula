# Salvamento com prioridade local

## Comportamento

- Aparelhos com dados no IndexedDB abrem a experiência local antes de consultar a nuvem. O primeiro acesso ainda importa a experiência existente.
- A consulta pequena identifica a geração, incluindo o código da experiência. Uma geração já aplicada não baixa o ZIP outra vez.
- Consultas ao voltar para a página são agrupadas por um minuto. Reconectar à internet força nova tentativa. Não existe polling de backup completo.
- O ZIP mantém o formato recuperável anterior. Cabeçalhos binários estáveis e manifesto textual comprimido permitem reutilizar partes por SHA-256, sem reenviar fotos e vídeos a cada mensagem.
- Partes imutáveis usam URLs estáveis, permitindo cache HTTP no navegador. Metadados e locks continuam sem cache. Cache ausente nunca é tratado como perda de dados: a parte pode ser baixada novamente.
- A primeira publicação deste formato ainda precisa transferir as partes que não têm hashes reutilizáveis. Gerar o ZIP e conferir integridade ainda envolve processamento local proporcional às mídias.
- A limpeza protege também as gerações de origem de partes reutilizadas. Publicar a alteração de `js/sync.js` junto com `scripts/limpar-geracoes-supabase.js` é obrigatório.
- Erros preservam a publicação anterior e a pendência local. Repetições usam espera crescente; requisições possuem prazo. O mural só limpa o campo depois de confirmar a gravação local.
- O carregamento inicial mostra indicador animado e contagem real de etapas/partes, sem estimativa fictícia de segundos.

## Verificação

`npm test` inclui uma simulação isolada de rede, sem gravar no Supabase real. Ela cobre mil mensagens, reutilização de mídia, leitura por outro aparelho, falha de envio, corrupção, prazo da conexão, abertura local e edição concorrente durante uma restauração.

`node tests/preview-local.cjs` serve a prévia em `http://127.0.0.1:4187/preview-loading`, sem conexão com o Supabase. A contagem 4/12 dessa rota é uma demonstração visual do componente real, não uma transferência em andamento.

## Limites e segurança

O bucket e o modelo de acesso existentes não foram alterados. A senha visual do site não protege os arquivos de um bucket público. Estes ajustes de desempenho não substituem autenticação e autorização reais.

Não limpe o armazenamento do navegador enquanto houver pendências. A sincronização depende de a página ter tempo e conexão para concluir o envio; nenhum navegador móvel garante trabalho contínuo depois de fechar a aba.
