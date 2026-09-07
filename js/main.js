/**
 * MAIN.JS — Ponto de entrada da aplicação.
 * Bloqueia desktop, sincroniza com a nuvem, preenche nomes, inicializa os
 * módulos e decide em que ponto da experiência retomar (loja / rastreio /
 * "Nossa História"), conforme o estágio salvo em aurora_stage.
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        iniciarBloqueioDesktop();
    } catch (e) {
        return; // tela de bloqueio já exibida, para o resto da inicialização
    }

    await prepararDadosParaEntrada();

    // Regrava os 3 valores fixos do pedido (data/horário/local — ver
    // js/config.js e js/preservacao.js) a cada abertura, garantindo que
    // nunca fiquem vazios ou desatualizados, independentemente do que
    // aconteceu antes (reset, sincronização, limpeza parcial de dados).
    if (typeof garantirDadosPermanentesDoPedido === 'function') await garantirDadosPermanentesDoPedido();

    document.querySelectorAll('.js-nome').forEach(el => { el.textContent = NOME_DELA; });
    document.querySelectorAll('.js-nome-apelido').forEach(el => { el.textContent = NOME_DELA_APELIDO; });
    document.querySelectorAll('.js-nome-dele').forEach(el => { el.textContent = NOME_DELE; });

    bloquearZoom();
    iniciarFallbackImagensGlobais();
    await obterOuCriarDataPrimeiroAcesso();
    solicitarArmazenamentoPersistente();

    // Cada módulo é independente dos outros — roda isolado em try/catch
    // pra uma falha num deles (ex.: por causa de alguma diferença de
    // navegador) não impedir os seguintes de rodar.
    const rodarModuloIsolado = (fn, nome) => { try { fn(); } catch (e) { console.error(`Falha ao iniciar módulo "${nome}" (não deve afetar os demais):`, e); } };
    rodarModuloIsolado(iniciarLoja, 'loja');
    rodarModuloIsolado(iniciarSuspense, 'suspense');
    rodarModuloIsolado(iniciarModuloFuturo, 'futuro');
    rodarModuloIsolado(iniciarModuloRomance, 'romance');
    rodarModuloIsolado(iniciarModuloExport, 'export');
    rodarModuloIsolado(iniciarModuloSync, 'sync');
    rodarModuloIsolado(iniciarPresenca, 'presenca');

    // Estágio da experiência: 'final' = já viu tudo; data de pedido definida
    // = pedido feito mas jornada interrompida (retoma de onde parou); nenhum
    // dos dois = ainda não começou (mostra a loja).
    const estagio = await obterConfiguracao('aurora_stage');
    if (estagio === 'final') {
        document.getElementById('maintenancePopup').style.display = 'none';
        desbloquearScrollFundoLembranca();
        atualizarProgressoEntrada('Aguardando sua senha para continuar');
        await solicitarSenhaMemorias();
        await goToRomancePage();
    } else {
        const dataPedidoExistente = await obterConfiguracao('aurora_data_pedido');
        if (dataPedidoExistente) {
            document.getElementById('maintenancePopup').style.display = 'none';
            desbloquearScrollFundoLembranca();
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
    atualizarProgressoEntrada('Tudo pronto', 3, 3);
    esconderVinhetaCarregamento();
    consultarAtualizacoesEmSegundoPlano();

    // Reforço: garante o topo mesmo se fontes/imagens ainda estiverem
    // terminando de carregar e empurrando o layout depois deste ponto.
    window.scrollTo(0, 0);
    window.addEventListener('load', () => window.scrollTo(0, 0), { once: true });

    // O MESMO problema que forcarRecalculoDeLayout() já resolve ao voltar
    // de outra aba (ver js/utils.js) também acontece no carregamento
    // inicial, com uma página tão alta quanto esta (várias telas empilhadas,
    // ~17000px): o navegador às vezes desenha a altura errada na primeira
    // passada, deixando "preso" um pedaço do topo escondido atrás do que já
    // foi pintado — o mesmo aparecer/sumir que apagar e desfazer o elemento
    // no DevTools corrige na mão. Chamando a função aqui, no fim da
    // inicialização, sem precisar trocar de aba.
    forcarRecalculoDeLayout();
    setTimeout(forcarRecalculoDeLayout, 400); // roda de novo depois que fontes/imagens tardias terminarem de carregar
});
