/**
 * ============================================================================
 * MAIN.JS — Ponto de entrada da aplicação
 * ============================================================================
 * Ordem de inicialização:
 *   1. Bloqueio de desktop (interrompe tudo o mais se não for celular)
 *   2. Importação via link de compartilhamento (se aplicável)
 *   3. Preenchimento dos nomes em todo o site
 *   4. Retomada do estágio salvo (loja normal vs. já chegou em "Nossa História")
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

    await verificarImportacaoPorLink();

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

    const estagio = await obterConfiguracao('aurora_stage');
    if (estagio === 'final') {
        document.getElementById('maintenancePopup').style.display = 'none';
        goToRomancePage();
    } else {
        definirFundoBody(CORES_FUNDO.claro);
    }

    verificarOrientacao();
});
