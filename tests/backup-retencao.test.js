'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
    criptografarBuffer,
    descriptografarBuffer,
    sha256,
    FORMATO
} = require('../scripts/backup-criptografia.js');
const {
    selecionarGeracoesParaExcluir,
    RETENCAO_MINIMA,
    GRACA_MS
} = require('../scripts/limpar-geracoes-supabase.js');

const segredo = 'chave-de-teste-com-mais-de-trinta-e-dois-caracteres-123456';
const original = Buffer.from('audio-video-fotos-e-memorias-importantes');
const criptografado = criptografarBuffer(original, segredo);
const restaurado = descriptografarBuffer(criptografado, segredo);
assert.deepEqual(restaurado, original, 'a cópia criptografada precisa restaurar exatamente os mesmos bytes');
assert.notEqual(sha256(criptografado), sha256(original), 'o artefato externo não pode expor o ZIP original');

const adulterado = Buffer.from(criptografado);
adulterado[adulterado.length - 1] ^= 1;
assert.throws(() => descriptografarBuffer(adulterado, segredo), /authenticat|unable|decrypt/i,
    'qualquer alteração no arquivo externo precisa invalidar a restauração');

const agora = Date.now();
const idsProtegidos = ['g10', 'g9', 'g8', 'g7', 'g6'];
const meta = {
    geracaoAtual: { id: 'g10' },
    historico: idsProtegidos.map(id => ({ id }))
};
const geracoes = [
    ...idsProtegidos.map((id, indice) => ({ id, criadoEmMs: agora - (indice + 1) * GRACA_MS })),
    { id: 'g5', criadoEmMs: agora - 3 * GRACA_MS },
    { id: 'g4-recente', criadoEmMs: agora - GRACA_MS / 2 },
    { id: 'g-sem-data', criadoEmMs: NaN }
];
assert.deepEqual(
    selecionarGeracoesParaExcluir({ geracoes, meta, agora }).map(item => item.id),
    ['g5'],
    'só uma geração fora das cinco protegidas e com mais de 24h pode ser removida'
);
assert.equal(
    selecionarGeracoesParaExcluir({ geracoes, meta: { geracaoAtual: { id: 'g10' }, historico: [] }, agora }).length,
    0,
    'sem cinco gerações confirmadas a limpeza precisa permanecer bloqueada'
);
assert.equal(RETENCAO_MINIMA, 5);
assert.deepEqual(selecionarGeracoesParaExcluir({ geracoes, agora, meta: {
    ...meta,
    geracaoAtual: { id: 'g10', partes: [{ objeto: 'experiencia/geracoes/g5/parte-000.zip' }] }
} }), [], 'parte reutilizada deve proteger sua geração de origem, mesmo fora das cinco últimas');

const workflow = fs.readFileSync(path.resolve(__dirname, '../.github/workflows/backup-externo-e-limpeza.yml'), 'utf8');
const posCriptografar = workflow.indexOf('Criptografar e conferir a restauração');
const posUpload = workflow.indexOf('Guardar a cópia externa por 30 dias');
const posLimpeza = workflow.indexOf('Limpar somente gerações antigas já protegidas');
assert.ok(posCriptografar >= 0 && posUpload > posCriptografar && posLimpeza > posUpload,
    'a ordem obrigatória deve ser verificar, criptografar, guardar externamente e só então limpar');
assert.equal(FORMATO, 'poloni-backup-criptografado-v1', 'formato criptografado precisa ser versionado');

console.log('OK  backup externo criptografado e retenção segura preservam as cinco gerações mais recentes');
