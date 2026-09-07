'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
require('fake-indexeddb/auto');
global.Dexie = require('../vendor/dexie-4.4.5.min.js');
global.JSZip = require('../vendor/jszip-3.10.1.min.js');
global.location = { pathname: '/teste', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node-test', onLine: true }, configurable: true });
global.NOME_DELA = 'Teste';
global.NOME_DELE = 'Teste';
global.EXPERIENCE_ID = 'teste-offline';
global.gerarIdUnico = prefixo => `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
global.chaveConfigPodeSerApagada = () => false;
const espelho = new Map();
global.localStorage = {
    getItem: chave => espelho.get(chave) ?? null,
    setItem: (chave, valor) => espelho.set(chave, String(valor)),
    removeItem: chave => espelho.delete(chave)
};
global.sessionStorage = global.localStorage;
global.window = { addEventListener() {}, dispatchEvent() {}, location: global.location };
global.document = { addEventListener() {}, getElementById() { return null; } };
Object.assign(global, require('../js/db.js'));
global.obterOuCriarDataPrimeiroAcesso = async () => '2026-01-01T00:00:00.000Z';
Object.assign(global, require('../js/export.js'));
vm.runInThisContext(fs.readFileSync(require.resolve('../js/sync.js'), 'utf8'));
window.__auroraSuprimirSyncDiagnostico = true;

const remoto = new Map();
const chamadas = [];
let falharEnvio = false;
global.fetch = async (url, opcoes = {}) => {
    const objeto = new URL(url).pathname.replace(/^.*\/aurora-backups\//, '');
    const metodo = opcoes.method || 'GET';
    chamadas.push({ objeto, metodo, bytes: opcoes.body instanceof Blob ? opcoes.body.size : 0 });
    if (metodo === 'POST') {
        if (falharEnvio && objeto.endsWith('.zip')) return new Response('{}', { status: 503 });
        if (remoto.has(objeto) && opcoes.headers['x-upsert'] === 'false') {
            return new Response(JSON.stringify({ error: 'Duplicate', statusCode: '409' }), { status: 400 });
        }
        remoto.set(objeto, new Blob([opcoes.body]));
        return new Response('{}', { status: 200 });
    }
    if (metodo === 'DELETE') { remoto.delete(objeto); return new Response('{}'); }
    const blob = remoto.get(objeto);
    if (!blob) return new Response('{}', { status: 404 });
    return new Response(metodo === 'HEAD' ? null : blob, { headers: { 'content-length': String(blob.size), date: new Date().toUTCString() } });
};

(async () => {
    await db.open();
    await salvarConfiguracao('aurora_mural_ana', JSON.stringify([{ id: 'a', texto: 'Primeiro texto' }]), false, false);
    await salvarMedia({ id: 'video', tipo: 'video_pedido', blob: new Blob([new Uint8Array(7 * 1024 * 1024).fill(7)], { type: 'video/webm' }) });
    const primeira = await publicarBackupNaNuvem(EXPERIENCE_ID);
    assert.equal(primeira.formato, 2, 'mantém compatibilidade com backup externo e leitores anteriores');
    const binarios = primeira.geracaoAtual.partes.slice(0, -1);
    assert.ok(binarios.length >= 2);
    const textos = Array.from({ length: 1000 }, (_, i) => ({ id: `m${i}`, texto: `Mensagem ${i}: ${'lembrança '.repeat(30)}` }));
    await salvarConfiguracao('aurora_mural_ana', JSON.stringify(textos), false, false);
    chamadas.length = 0;
    const segunda = await publicarBackupNaNuvem(EXPERIENCE_ID);
    assert.deepEqual(segunda.geracaoAtual.partes.slice(0, -1), binarios, 'texto novo reutiliza os mesmos objetos binários');
    assert.equal(chamadas.filter(x => x.metodo === 'GET' && binarios.some(p => p.objeto === x.objeto)).length, 0,
        'não baixa o backup nem as partes binárias quando a revisão já foi aplicada');
    const bytesEnviados = chamadas.filter(x => x.metodo === 'POST').reduce((s, x) => s + x.bytes, 0);
    assert.ok(bytesEnviados < 100000, `mil mensagens devem enviar só o manifesto comprimido, não os 7 MB: ${bytesEnviados}`);
    assert.equal(segunda.revisao, primeira.revisao + 1);
    const zipRemontado = await buscarBackupZipDaNuvem(EXPERIENCE_ID, segunda.partes, segunda);
    await validarEPrepararBackupZip(zipRemontado);
    console.log(`OK  1000 mensagens: ${bytesEnviados} bytes enviados; 7 MB de mídia não reenviados`);

    await salvarConfiguracao('aurora_mural_ana', JSON.stringify([...textos, { id: 'pendente', texto: 'Não pode perder' }]), false, false);
    await salvarConfiguracao('aurora_sync_dirty', '1', false, false);
    falharEnvio = true;
    await assert.rejects(() => publicarBackupNaNuvem(EXPERIENCE_ID), /HTTP 503/);
    assert.equal((await buscarMetaDaNuvem(EXPERIENCE_ID)).revisao, segunda.revisao, 'upload incompleto não muda o ponteiro');
    assert.equal(await obterConfiguracao('aurora_sync_dirty'), '1');
    assert.ok((await obterConfiguracao('aurora_mural_ana')).includes('Não pode perder'));
    falharEnvio = false;
    const terceira = await publicarBackupNaNuvem(EXPERIENCE_ID);
    assert.equal(terceira.revisao, segunda.revisao + 1);

    // Simula outro navegador, que precisa incorporar a geração desconhecida.
    await db.media.clear();
    await db.configuracoes.clear();
    espelho.clear();
    await salvarConfiguracao('aurora_mural_ana', JSON.stringify([{ id: 'outro', texto: 'Outro aparelho' }]), false, false);
    const quarta = await publicarBackupNaNuvem(EXPERIENCE_ID);
    const mural = JSON.parse(await obterConfiguracao('aurora_mural_ana'));
    assert.ok(mural.some(x => x.id === 'outro') && mural.some(x => x.id === 'pendente'));
    assert.ok(await obterMedia('video'), 'um navegador novo recupera também as mídias');
    assert.equal(quarta.revisao, terceira.revisao + 1);
    console.log('OK  falha preserva dados locais e ponteiro; outro aparelho mescla todas as mensagens');

    chamadas.length = 0;
    await prepararDadosParaEntrada();
    assert.equal(chamadas.length, 0, 'aparelho com dados abre localmente sem aguardar a rede');
    await salvarConfiguracao('aurora_sync_dirty', '0', false, false);
    window.__auroraSyncDirtyMemoria = false;
    await sincronizarNaAbertura();
    assert.equal(chamadas.filter(x => x.objeto.endsWith('.zip')).length, 0, 'revisão conhecida só consulta metadados');
    console.log('OK  abertura local e consulta sem novidade não transferem o backup');

    const dadosAntesDaEdicao = await buscarBackupZipDaNuvem(EXPERIENCE_ID, quarta.partes, quarta);
    const transacaoOriginal = db.transaction.bind(db);
    let injetarEdicao = true;
    db.transaction = async function (modo, ...args) {
        if (injetarEdicao && modo === 'rw') {
            injetarEdicao = false;
            await db.configuracoes.put({ chave: 'aurora_mural_ana', valor: JSON.stringify([{ id: 'durante', texto: 'Digitado durante o download' }]) });
        }
        return transacaoOriginal(modo, ...args);
    };
    await assert.rejects(() => aplicarBackupDeZip(dadosAntesDaEdicao), /dados locais mudaram/);
    db.transaction = transacaoOriginal;
    assert.ok((await obterConfiguracao('aurora_mural_ana')).includes('Digitado durante o download'));
    console.log('OK  restauração concorrente não sobrescreve uma edição local recente');

    const referencia = quarta.geracaoAtual.partes[0];
    const original = remoto.get(referencia.objeto);
    remoto.set(referencia.objeto, new Blob([new Uint8Array(original.size).fill(9)]));
    await assert.rejects(() => buscarBackupZipDaNuvem(EXPERIENCE_ID, quarta.partes, quarta), /Checksum/);
    console.log('OK  bytes corrompidos são recusados mesmo com tamanho correto');

    const fetchAnterior = global.fetch;
    global.fetch = async (_url, opcoes) => new Promise((_, reject) => {
        opcoes.signal.addEventListener('abort', () => reject(new Error('abort')));
    });
    await assert.rejects(() => requisicaoNuvem('https://exemplo.invalid', {}, r => r, 10), /demorou demais/);
    global.fetch = fetchAnterior;
    console.log('OK  conexão travada é interrompida pelo prazo');
    await db.delete();
})().catch(async erro => {
    console.error(erro);
    try { await db.delete(); } catch (_) { /* encerra o banco de teste */ }
    process.exitCode = 1;
});
