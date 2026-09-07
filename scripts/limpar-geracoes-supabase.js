'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { extrairConstante, sha256, buscarBytes } = require('./verificar-backup-remoto.js');
const { descriptografarBuffer, FORMATO } = require('./backup-criptografia.js');

const RETENCAO_MINIMA = 5;
const GRACA_MS = 24 * 60 * 60 * 1000;

function selecionarGeracoesParaExcluir({ geracoes, meta, agora = Date.now(), retencao = RETENCAO_MINIMA, gracaMs = GRACA_MS }) {
    const protegidas = new Set();
    if (meta && meta.geracaoAtual && meta.geracaoAtual.id) protegidas.add(meta.geracaoAtual.id);
    for (const geracao of Array.isArray(meta && meta.historico) ? meta.historico : []) {
        if (geracao && geracao.id) protegidas.add(geracao.id);
    }
    if (protegidas.size < retencao) return [];
    // Uma geração nova pode reutilizar partes imutáveis de uma geração antiga.
    // Protege os arquivos referenciados, não apenas os cinco ids de publicação.
    for (const geracao of [meta?.geracaoAtual, ...(meta?.historico || [])]) {
        for (const parte of geracao?.partes || []) {
            const origem = String(parte.objeto || '').match(/\/geracoes\/([^/]+)\//);
            if (origem) protegidas.add(origem[1]);
        }
    }

    return geracoes
        .filter(geracao => geracao && geracao.id && !protegidas.has(geracao.id))
        .filter(geracao => Number.isFinite(geracao.criadoEmMs) && geracao.criadoEmMs <= agora - gracaMs)
        .sort((a, b) => a.criadoEmMs - b.criadoEmMs);
}

function valorArgumento(nome, obrigatorio = true) {
    const indice = process.argv.indexOf(nome);
    if (indice < 0) {
        if (obrigatorio) throw new Error(`Argumento obrigatório ausente: ${nome}.`);
        return null;
    }
    const valor = process.argv[indice + 1];
    if (!valor || valor.startsWith('--')) throw new Error(`Informe um valor depois de ${nome}.`);
    return valor;
}

function lerSegredo() {
    const arquivoChave = valorArgumento('--chave-arquivo', false);
    if (arquivoChave) {
        const texto = fs.readFileSync(path.resolve(arquivoChave), 'utf8');
        const linha = texto.split(/\r?\n/).find(item => item.startsWith('POLONI_BACKUP_PASSPHRASE='));
        if (!linha) throw new Error('Arquivo de chave inválido.');
        return linha.slice('POLONI_BACKUP_PASSPHRASE='.length).trim();
    }
    return process.env.POLONI_BACKUP_PASSPHRASE || '';
}

async function requisicaoStorage(url, anonKey, caminho, metodo, corpo) {
    const resposta = await fetch(`${url}/storage/v1/${caminho}`, {
        method: metodo,
        headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
        signal: AbortSignal.timeout(60000)
    });
    const texto = await resposta.text();
    if (!resposta.ok) throw new Error(`Storage respondeu ${resposta.status}: ${texto.slice(0, 300)}`);
    return texto ? JSON.parse(texto) : null;
}

async function listarObjetos(url, anonKey, bucket, prefixo) {
    const itens = await requisicaoStorage(url, anonKey, `object/list/${bucket}`, 'POST', {
        prefix: prefixo,
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
    });
    return Array.isArray(itens) ? itens : [];
}

function caminhoCompleto(prefixo, nome) {
    if (nome === prefixo || nome.startsWith(`${prefixo}/`)) return nome;
    return `${prefixo}/${nome}`;
}

async function descobrirGeracoes(url, anonKey, bucket, codigo) {
    const raizGeracoes = `${codigo}/geracoes`;
    const pastas = await listarObjetos(url, anonKey, bucket, raizGeracoes);
    const resultado = [];
    for (const item of pastas) {
        const id = String(item && item.name || '').split('/').filter(Boolean).pop();
        if (!id || !/^[a-z0-9_-]+$/i.test(id)) continue;
        try {
            const bytes = await buscarBytes(`${url}/storage/v1/object/public/${bucket}/${raizGeracoes}/${id}/manifest.json`);
            const manifesto = JSON.parse(bytes.toString('utf8'));
            const criadoEmMs = Date.parse(manifesto.criadoEm || '');
            resultado.push({ id, criadoEmMs, manifesto });
        } catch (_) {
            // Pasta recente/incompleta pode pertencer a um upload em voo.
            // Sem manifesto válido ela nunca é candidata à exclusão automática.
        }
    }
    return resultado;
}

async function validarCopiaExterna(recibo, arquivoCriptografado, segredo) {
    if (!recibo.criptografia || recibo.criptografia.formato !== FORMATO) {
        throw new Error('O recibo não confirma uma cópia externa criptografada válida.');
    }
    const pacote = fs.readFileSync(arquivoCriptografado);
    if (pacote.length !== Number(recibo.criptografia.bytes) || sha256(pacote) !== recibo.criptografia.sha256) {
        throw new Error('O arquivo externo não corresponde ao recibo verificado.');
    }
    const original = descriptografarBuffer(pacote, segredo);
    if (sha256(original) !== recibo.sha256 || original.length !== Number(recibo.zipBytes)) {
        throw new Error('A cópia externa não reproduz o ZIP original.');
    }
}

async function testarStorageApi() {
    const supabaseUrl = extrairConstante('js/sync.js', 'SUPABASE_URL');
    const anonKey = extrairConstante('js/sync.js', 'SUPABASE_ANON_KEY');
    const bucket = extrairConstante('js/sync.js', 'SUPABASE_BUCKET');
    const codigo = extrairConstante('js/config.js', 'EXPERIENCE_ID');
    const prefixo = `${codigo}/testes-retencao`;
    const objeto = `${prefixo}/teste-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
    let enviado = false;
    try {
        const resposta = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objeto}`, {
            method: 'POST',
            headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
                'Content-Type': 'application/json',
                'x-upsert': 'false'
            },
            body: JSON.stringify({ teste: true, criadoEm: new Date().toISOString() }),
            signal: AbortSignal.timeout(60000)
        });
        if (!resposta.ok) throw new Error(`Upload de teste falhou (${resposta.status}): ${(await resposta.text()).slice(0, 300)}`);
        enviado = true;
        const itens = await listarObjetos(supabaseUrl, anonKey, bucket, prefixo);
        if (!itens.some(item => caminhoCompleto(prefixo, item.name) === objeto)) {
            throw new Error('O objeto de teste foi enviado, mas não apareceu na listagem do Storage.');
        }
    } finally {
        if (enviado) await requisicaoStorage(supabaseUrl, anonKey, `object/${bucket}`, 'DELETE', { prefixes: [objeto] });
    }
    const restantes = await listarObjetos(supabaseUrl, anonKey, bucket, prefixo);
    if (restantes.some(item => caminhoCompleto(prefixo, item.name) === objeto)) {
        throw new Error('O objeto descartável continuou no Storage depois do teste de exclusão.');
    }
    console.log(JSON.stringify({ ok: true, teste: 'upload-list-delete', objetoRemovido: objeto }, null, 2));
}

async function executar() {
    if (process.argv.includes('--testar-api')) {
        await testarStorageApi();
        return;
    }
    const reciboPath = path.resolve(valorArgumento('--recibo'));
    const criptografadoPath = path.resolve(valorArgumento('--arquivo-criptografado'));
    const somenteSimular = process.argv.includes('--dry-run');
    const recibo = JSON.parse(fs.readFileSync(reciboPath, 'utf8'));
    await validarCopiaExterna(recibo, criptografadoPath, lerSegredo());

    const supabaseUrl = extrairConstante('js/sync.js', 'SUPABASE_URL');
    const anonKey = extrairConstante('js/sync.js', 'SUPABASE_ANON_KEY');
    const bucket = extrairConstante('js/sync.js', 'SUPABASE_BUCKET');
    const codigo = extrairConstante('js/config.js', 'EXPERIENCE_ID');
    if (recibo.projeto !== new URL(supabaseUrl).hostname.split('.')[0] || recibo.bucket !== bucket || recibo.codigo !== codigo) {
        throw new Error('O recibo pertence a outro projeto, bucket ou experiência.');
    }

    const metaBytes = await buscarBytes(`${supabaseUrl}/storage/v1/object/public/${bucket}/${codigo}-meta.json`);
    const meta = JSON.parse(metaBytes.toString('utf8'));
    if (Number(meta.revisao) !== Number(recibo.revisao) || meta.geracaoAtual?.id !== recibo.geracao || meta.geracaoAtual?.sha256 !== recibo.sha256) {
        throw new Error('A nuvem mudou depois da cópia externa; a limpeza foi cancelada para preservar a nova geração.');
    }

    const geracoes = await descobrirGeracoes(supabaseUrl, anonKey, bucket, codigo);
    const candidatas = selecionarGeracoesParaExcluir({ geracoes, meta });
    const removidos = [];

    for (const geracao of candidatas) {
        const prefixo = `${codigo}/geracoes/${geracao.id}`;
        const itens = await listarObjetos(supabaseUrl, anonKey, bucket, prefixo);
        const caminhos = itens.map(item => caminhoCompleto(prefixo, item.name)).filter(Boolean);
        if (!caminhos.length) continue;
        if (!somenteSimular) {
            await requisicaoStorage(supabaseUrl, anonKey, `object/${bucket}`, 'DELETE', { prefixes: caminhos });
            const restantes = await listarObjetos(supabaseUrl, anonKey, bucket, prefixo);
            if (restantes.length) throw new Error(`A geração ${geracao.id} não foi removida por completo.`);
        }
        removidos.push({ id: geracao.id, objetos: caminhos.length, bytes: Number(geracao.manifesto.tamanho) || null });
    }

    const nomesAtuais = new Set();
    const prefixosAtuais = new Set((meta.geracaoAtual.partes || []).map(parte => parte.objeto.slice(0, parte.objeto.lastIndexOf('/'))));
    for (const prefixoAtual of prefixosAtuais) {
        const atuais = await listarObjetos(supabaseUrl, anonKey, bucket, prefixoAtual);
        for (const item of atuais) nomesAtuais.add(caminhoCompleto(prefixoAtual, item.name));
    }
    for (const parte of meta.geracaoAtual.partes || []) {
        if (!nomesAtuais.has(parte.objeto)) throw new Error(`Proteção final falhou: parte atual ausente (${parte.objeto}).`);
    }

    console.log(JSON.stringify({
        ok: true,
        dryRun: somenteSimular,
        revisaoProtegida: Number(meta.revisao),
        geracaoProtegida: meta.geracaoAtual.id,
        geracoesEncontradas: geracoes.length,
        retencaoMinima: RETENCAO_MINIMA,
        candidatas: candidatas.length,
        removidos
    }, null, 2));
}

if (require.main === module) {
    executar().catch(erro => {
        console.error(`FALHA: ${erro.message}`);
        process.exitCode = 1;
    });
}

module.exports = { RETENCAO_MINIMA, GRACA_MS, selecionarGeracoesParaExcluir, validarCopiaExterna };
