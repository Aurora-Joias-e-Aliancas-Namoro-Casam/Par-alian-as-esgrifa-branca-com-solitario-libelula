/**
 * ============================================================================
 * MAIN.JS — Ponto de entrada da aplicação
 * ============================================================================
 * Ordem de inicialização:
 *   1. Bloqueio de desktop (interrompe tudo o mais se não for celular)
 *   2. Sincronização automática com a nuvem (puxa ou empurra, ver js/sync.js)
 *   3. Preenchimento dos nomes em todo o site
 *   4. Retomada do estado salvo (loja normal / retomando no meio / já concluído)
 *   5. Wiring de todos os módulos (loja, suspense, futuro, romance, export, sync)
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        iniciarBloqueioDesktop();
    } catch (e) {
        // BLOQUEIO_DESKTOP_ATIVO: a tela de bloqueio já foi exibida, então
        // paramos qualquer outra inicialização do site.
        return;
    }

    // Sincronização automática (sem precisar de "?c=" na URL): confere se a
    // nuvem tem algo mais novo que este aparelho (ex.: a experiência já foi
    // concluída em outro celular) e aplica antes de decidir o que mostrar.
    await sincronizarNaAbertura();

    document.querySelectorAll('.js-nome').forEach(el => { el.textContent = NOME_DELA; });
    document.querySelectorAll('.js-nome-apelido').forEach(el => { el.textContent = NOME_DELA_APELIDO; });
    document.querySelectorAll('.js-nome-dele').forEach(el => { el.textContent = NOME_DELE; });

    bloquearZoom();
    iniciarFallbackImagensGlobais();
    await obterOuCriarDataPrimeiroAcesso();
    solicitarArmazenamentoPersistente(); // não bloqueia a inicialização, só pede em segundo plano

    iniciarLoja();
    iniciarSuspense();
    iniciarModuloFuturo();
    iniciarModuloRomance();
    iniciarModuloExport();
    iniciarModuloSync();

    /**
     * ESTADO ÚNICO DA EXPERIÊNCIA (só existem dois estados: antes e depois
     * do pedido — ver prompt de correções, item 4):
     *   - 'final'                       -> já viu tudo, sempre cai na "Nossa História".
     *   - 'aurora_data_pedido' definido -> o pedido já aconteceu (contrato
     *     assinado) mas a jornada foi interrompida antes do fim; NUNCA
     *     repetimos perguntas/galeria/assinatura — retomamos exatamente de
     *     onde parou (rastreio/vídeo, ou direto na carta se o vídeo já
     *     tiver sido gravado).
     *   - nenhum dos dois                -> ainda não começou; mostra a loja normalmente.
     */
    const estagio = await obterConfiguracao('aurora_stage');
    if (estagio === 'final') {
        document.getElementById('maintenancePopup').style.display = 'none';
        await solicitarSenhaMemorias(); // só libera "Nossa História" com a senha certa (item 8 do prompt de melhorias)
        goToRomancePage();
    } else {
        const dataPedidoExistente = await obterConfiguracao('aurora_data_pedido');
        if (dataPedidoExistente) {
            document.getElementById('maintenancePopup').style.display = 'none';
            definirFundoBody(CORES_FUNDO.escuro);
            document.getElementById('lojaScreen').style.display = 'none';
            document.getElementById('suspenseOverlay').style.display = 'flex';
            document.getElementById('loaderSuspense').classList.add('d-none');
            const videoJaGravado = await obterMedia('video_pedido');
            if (videoJaGravado) {
                finalizarSequencia();
            } else {
                iniciarRastreio();
            }
        } else {
            definirFundoBody(CORES_FUNDO.claro);
        }
    }

    verificarOrientacao();
});
