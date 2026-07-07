/**
 * ============================================================================
 * SYNC.JS — Sincronização na nuvem (Prioridade 1, item 6)
 * ============================================================================
 * IMPORTANTE — LEIA ANTES DE USAR "COMPARTILHAR":
 * Por padrão, tudo neste site fica salvo SÓ no aparelho onde foi criado
 * (é assim que IndexedDB funciona em qualquer site, não é uma limitação
 * deste projeto especificamente). Para o link "Compartilhar" abrir de
 * verdade em outro celular — com fotos, vídeo, contrato e mensagens — é
 * necessário um lugar na nuvem para guardar esses dados.
 *
 * Eu (Claude) não tenho acesso à internet neste ambiente, então não
 * recebo, não guardo e não posso validar nenhuma chave por conta própria
 * — as constantes abaixo começam vazias até você mesmo colar os valores.
 *
 * COMO ATIVAR (gratuito, leva ~5 minutos, sem precisar programar):
 *   1. Crie uma conta em https://supabase.com (tem plano gratuito).
 *   2. Crie um novo projeto.
 *   3. No menu lateral, vá em "Storage" e crie um bucket público chamado
 *      exatamente: aurora-backups
 *   4. Ainda em Storage > aurora-backups > Policies, adicione uma política
 *      permitindo INSERT, UPDATE, SELECT e DELETE para o público (anon) —
 *      o próprio painel do Supabase tem um botão "New policy" com modelos
 *      prontos ("Enable read access for all users" / "Enable insert for
 *      anon users" / "Enable delete for anon users"); use esses modelos.
 *   5. Vá em "Project Settings" > "API".
 *        - Copie a "Project URL" → cole em SUPABASE_URL.
 *        - Copie a chave da seção "Project API keys" com o rótulo
 *          "anon" / "public" (NÃO a "service_role", que é secreta e não
 *          deve nunca ir para um site público) → cole em SUPABASE_ANON_KEY.
 *        - Se você já tinha uma chave antiga colada aqui e gerou uma nova
 *          (botão "Generate new anon key" no Supabase), troque pela nova —
 *          a antiga para de funcionar assim que é regenerada.
 *   6. Abra diagnostico.html no celular e toque em "Testar conexão com a
 *      nuvem": isso faz uma escrita + leitura reais no seu bucket, então
 *      você confirma que a chave colada é a correta antes do grande dia.
 *
 * Enquanto essas duas constantes estiverem vazias, o botão "Compartilhar"
 * continua funcionando normalmente (compartilha o link), mas avisa que a
 * sincronização entre aparelhos ainda não está ativada.
 * ============================================================================
 */

const SUPABASE_URL = 'https://mdiohswwximmsggmrzue.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kaW9oc3d3eGltbXNnZ21yenVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNTYzNjgsImV4cCI6MjA5ODczMjM2OH0.maRn6Wax6uIEyVo8ETXxOGQ5Mi61B6rafl7CCC1fGcs';
const SUPABASE_BUCKET = 'aurora-backups';

function syncEstaConfigurado() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Validação básica de formato (não garante que a chave é válida no
 * servidor — só confere se "parece" uma chave anon do Supabase, que é
 * sempre um JWT com 3 partes separadas por ponto, começando com "eyJ").
 * Ajuda a pegar erros bobos de copiar/colar (chave cortada, com espaço,
 * ou colada a "service_role" por engano, que também é um JWT mas nunca
 * deve ser usada aqui).
 */
function validarFormatoAnonKey(chave) {
    if (!chave) return { ok: false, motivo: 'Chave vazia.' };
    const partes = chave.trim().split('.');
    if (partes.length !== 3) return { ok: false, motivo: 'Não parece um JWT válido (deveria ter 3 partes separadas por ponto).' };
    if (!chave.startsWith('eyJ')) return { ok: false, motivo: 'Chaves do Supabase começam com "eyJ". Confira se copiou a chave inteira.' };
    try {
        const payload = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.role === 'service_role') return { ok: false, motivo: 'Esta é a chave "service_role" (secreta) — use a chave "anon public".' };
        if (payload.role && payload.role !== 'anon') return { ok: false, motivo: `Papel inesperado na chave: "${payload.role}".` };
        return { ok: true, motivo: `Formato ok (papel: ${payload.role || 'desconhecido'}).` };
    } catch (e) {
        return { ok: false, motivo: 'Não foi possível decodificar a chave — confira se ela foi colada por inteiro.' };
    }
}

/** Gera (ou reaproveita) um código curto que identifica esta experiência na nuvem. */
async function obterOuCriarCodigoCompartilhamento() {
    let codigo = await obterConfiguracao('aurora_share_code');
    if (!codigo) {
        codigo = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
        await salvarConfiguracao('aurora_share_code', codigo);
    }
    return codigo;
}

/** Envia o backup completo (JSON) para o bucket público do Supabase Storage. */
async function publicarBackupNaNuvem(codigo) {
    const backup = await gerarBackupCompleto();
    const corpo = JSON.stringify(backup);
    const url = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${codigo}.json`;

    const resposta = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'x-upsert': 'true'
        },
        body: corpo
    });

    if (!resposta.ok) throw new Error(`Falha ao publicar na nuvem: ${resposta.status}`);
    return true;
}

/** Baixa o backup de um código de compartilhamento e aplica no aparelho atual. */
async function importarBackupDaNuvem(codigo) {
    const backup = await buscarBackupDaNuvem(codigo);
    if (!backup) throw new Error('Não foi possível localizar essa experiência.');
    await aplicarBackupNoDispositivo(backup);
}

/** Baixa o backup de um código, sem aplicar. Retorna `null` se ainda não existir na nuvem (404). */
async function buscarBackupDaNuvem(codigo) {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${codigo}.json`;
    const resposta = await fetch(url, { cache: 'no-store' });
    if (resposta.status === 404) return null;
    if (!resposta.ok) throw new Error(`Falha ao consultar a nuvem (${resposta.status})`);
    return await resposta.json();
}

/** Apaga o backup desta experiência na nuvem (usado pelo botão "Resetar Site"). */
async function apagarBackupDaNuvem() {
    if (!syncEstaConfigurado()) return;
    try {
        await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${EXPERIENCE_ID}.json`, {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
    } catch (err) {
        console.error('Falha ao apagar backup na nuvem:', err);
    }
}

/* ----------------------------------------------------------------------
 * SINCRONIZAÇÃO AUTOMÁTICA (link único, sem "?c=")
 * ----------------------------------------------------------------------
 * Diferente do fluxo antigo (que só sincronizava quando alguém tocava em
 * "Compartilhar" e gerava um "?c=codigo" na URL), aqui TODA alteração de
 * dados (ver hook em db.js) agenda um envio para a nuvem, e TODA abertura
 * da página primeiro confere se existe algo mais novo na nuvem do que no
 * aparelho local. Isso é o que garante que abrir o link puro em qualquer
 * celular mostre exatamente o mesmo estado, sem precisar de código nenhum.
 * ---------------------------------------------------------------------- */

let __auroraAplicandoBackupRemoto = false; // suprime auto-envio enquanto aplicamos um backup vindo da nuvem
let __auroraTimeoutEnvioNuvem = null;

/** Chamado (via hook em db.js) sempre que algo muda localmente. Debounced para não martelar a rede. */
function agendarEnvioNuvem() {
    if (!syncEstaConfigurado()) return;
    if (__auroraAplicandoBackupRemoto) return; // essa mudança veio de um backup importado, não precisa reenviar
    clearTimeout(__auroraTimeoutEnvioNuvem);
    __auroraTimeoutEnvioNuvem = setTimeout(() => {
        publicarBackupNaNuvem(EXPERIENCE_ID).catch(err => console.error('Falha no envio automático para a nuvem:', err));
    }, 2000);
}

/**
 * Roda uma vez, no carregamento da página. Decide entre "puxar" (a nuvem
 * tem algo mais recente que este aparelho nunca viu) ou "empurrar" (este
 * aparelho tem mudanças que a nuvem ainda não tem).
 */
async function sincronizarNaAbertura() {
    // Compatibilidade com links antigos que ainda usem "?c=codigo".
    await verificarImportacaoPorLink();

    if (!syncEstaConfigurado()) return;

    const timestampLocal = parseInt(await obterConfiguracao('aurora_atualizado_em'), 10) || 0;

    let backupNuvem = null;
    try {
        backupNuvem = await buscarBackupDaNuvem(EXPERIENCE_ID);
    } catch (err) {
        console.error('Não foi possível consultar a nuvem ao abrir o site (seguindo com os dados locais):', err);
        return;
    }

    const timestampNuvem = (backupNuvem && backupNuvem.atualizadoEm) ? backupNuvem.atualizadoEm : 0;

    if (backupNuvem && timestampNuvem > timestampLocal) {
        // A nuvem tem uma versão mais nova (ex.: foi concluída em outro aparelho) — aplica aqui.
        __auroraAplicandoBackupRemoto = true;
        try {
            await aplicarBackupNoDispositivo(backupNuvem);
            await db.configuracoes.put({ chave: 'aurora_atualizado_em', valor: String(timestampNuvem) });
            try { localStorage.setItem('aurora_atualizado_em', String(timestampNuvem)); } catch (e) { /* ignora */ }
        } finally {
            __auroraAplicandoBackupRemoto = false;
        }
    } else if (timestampLocal > 0 && timestampLocal >= timestampNuvem) {
        // Este aparelho tem dados que a nuvem ainda não tem (ex.: primeira vez, ou sem internet antes) — envia agora.
        try {
            await publicarBackupNaNuvem(EXPERIENCE_ID);
        } catch (err) {
            console.error('Falha ao publicar dados locais na nuvem ao abrir o site:', err);
        }
    }
}

/**
 * Ao carregar a página: se a URL tiver "?c=CODIGO" e a sincronização
 * estiver configurada, baixa e aplica os dados automaticamente — é assim
 * que o link abre "igual" em outro celular.
 */
async function verificarImportacaoPorLink() {
    if (!syncEstaConfigurado()) return;
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('c');
    if (!codigo) return;

    // Evita reimportar toda vez que a pessoa já está usando o link normalmente.
    const jaImportado = sessionStorage.getItem(`aurora_importado_${codigo}`);
    if (jaImportado) return;

    try {
        await importarBackupDaNuvem(codigo);
        sessionStorage.setItem(`aurora_importado_${codigo}`, '1');
        await salvarConfiguracao('aurora_share_code', codigo);
    } catch (err) {
        console.error('Falha ao importar experiência compartilhada:', err);
    }
}

/** Botão "Compartilhar": publica (se configurado) e abre o menu de compartilhamento nativo. */
async function compartilharExperiencia() {
    const statusEl = document.getElementById('compartilharStatus');
    const setStatus = (msg, tipo) => { if (statusEl) { statusEl.textContent = msg; statusEl.className = tipo ? `save-status ${tipo}` : 'save-status'; } };

    // O link agora é sempre o link puro (sem "?c=..."): a sincronização usa o
    // EXPERIENCE_ID fixo, então o mesmo link já abre igual em qualquer aparelho.
    let urlParaCompartilhar = window.location.href.split('?')[0];

    if (syncEstaConfigurado()) {
        setStatus('Sincronizando com a nuvem...', 'pending');
        try {
            await publicarBackupNaNuvem(EXPERIENCE_ID);
            setStatus('Sincronizado! O link já pode ser aberto em qualquer aparelho.', 'ok');
        } catch (err) {
            console.error('Falha ao sincronizar com a nuvem:', err);
            setStatus('Não foi possível sincronizar agora. Compartilhando o link local.', 'err');
        }
    } else {
        setStatus('Sincronização na nuvem ainda não configurada — compartilhando o link local (funciona apenas neste aparelho). Veja as instruções em sync.js.', 'pending');
    }

    try {
        if (navigator.share) {
            await navigator.share({ title: TEXTOS.heroTituloRomance, text: 'Um momento nosso ❤️', url: urlParaCompartilhar });
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(urlParaCompartilhar);
            setStatus('Link copiado para a área de transferência!', 'ok');
        }
    } catch (e) { /* usuário cancelou o compartilhamento nativo, sem problema */ }
}

/**
 * Teste real de conexão com a nuvem (usado em diagnostico.html): sobe um
 * arquivo pequeno de teste, baixa de volta, confere que o conteúdo bate, e
 * apaga o arquivo de teste em seguida. Diferente de validarFormatoAnonKey
 * (que só confere o formato), esta função realmente conversa com o
 * Supabase — é a prova definitiva de que URL + chave estão certos e que
 * as políticas do bucket permitem inserir/ler/apagar.
 */
async function testarConexaoNuvem() {
    if (!syncEstaConfigurado()) {
        return { ok: false, etapa: 'configuracao', motivo: 'SUPABASE_URL e/ou SUPABASE_ANON_KEY ainda estão vazios em js/sync.js.' };
    }

    const formato = validarFormatoAnonKey(SUPABASE_ANON_KEY);
    if (!formato.ok) {
        return { ok: false, etapa: 'formato_da_chave', motivo: formato.motivo };
    }

    const codigoTeste = `diagnostico_${Date.now()}`;
    const conteudoTeste = { teste: true, ts: new Date().toISOString() };
    const caminho = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${codigoTeste}.json`;
    const caminhoPublico = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${codigoTeste}.json`;

    // 1) Upload
    let respostaUpload;
    try {
        respostaUpload = await fetch(caminho, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'x-upsert': 'true' },
            body: JSON.stringify(conteudoTeste)
        });
    } catch (err) {
        return { ok: false, etapa: 'upload', motivo: `Não foi possível conectar ao Supabase (rede ou URL incorreta): ${err.message}` };
    }
    if (!respostaUpload.ok) {
        const corpo = await respostaUpload.text().catch(() => '');
        return { ok: false, etapa: 'upload', motivo: `Upload falhou (HTTP ${respostaUpload.status}). Confira a policy de INSERT do bucket. Detalhe: ${corpo.slice(0, 200)}` };
    }

    // 2) Download público
    let respostaDownload;
    try {
        respostaDownload = await fetch(caminhoPublico, { cache: 'no-store' });
    } catch (err) {
        return { ok: false, etapa: 'download', motivo: `Upload funcionou, mas o download falhou: ${err.message}` };
    }
    if (!respostaDownload.ok) {
        return { ok: false, etapa: 'download', motivo: `Upload funcionou, mas o download falhou (HTTP ${respostaDownload.status}). Confira se o bucket está marcado como público e se a policy de SELECT existe.` };
    }
    const baixado = await respostaDownload.json().catch(() => null);
    if (!baixado || baixado.ts !== conteudoTeste.ts) {
        return { ok: false, etapa: 'integridade', motivo: 'O conteúdo baixado não confere com o que foi enviado.' };
    }

    // 3) Limpeza (apaga o arquivo de teste) — falha aqui não invalida o teste principal.
    try {
        await fetch(caminho, { method: 'DELETE', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
    } catch (e) { /* não crítico */ }

    return { ok: true, etapa: 'completo', motivo: 'Upload, download e integridade confirmados com sucesso.' };
}

function iniciarModuloSync() {
    document.getElementById('btnCompartilhar').addEventListener('click', compartilharExperiencia);
}
