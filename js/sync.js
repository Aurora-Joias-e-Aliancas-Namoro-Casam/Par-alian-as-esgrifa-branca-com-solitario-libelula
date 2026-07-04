/**
 * ============================================================================
 * SYNC.JS — Sincronização na nuvem (Prioridade 1, item 6)
 * ============================================================================
 * IMPORTANTE — LEIA ANTES DE USAR "COMPARTILHAR":
 * Por padrão, tudo neste site fica salvo SÓ no aparelho onde foi criado
 * (é assim que IndexedDB funciona em qualquer site, não é uma limitação
 * deste projeto especificamente). Para o link "Compartilhar" abrir de
 * verdade em outro celular — com fotos, vídeo, contrato e mensagens — é
 * necessário um lugar na nuvem para guardar esses dados. Não é possível
 * eu criar essa conta por você (ela é sua e gratuita), mas o código abaixo
 * já está pronto para funcionar assim que você configurar duas linhas.
 *
 * COMO ATIVAR (gratuito, leva ~5 minutos, sem precisar programar):
 *   1. Crie uma conta em https://supabase.com (tem plano gratuito).
 *   2. Crie um novo projeto.
 *   3. No menu lateral, vá em "Storage" e crie um bucket público chamado
 *      exatamente: aurora-backups
 *   4. Ainda em Storage > aurora-backups > Policies, adicione uma política
 *      permitindo INSERT, UPDATE e SELECT para o público (anon) — o
 *      próprio painel do Supabase tem um botão "New policy" com modelos
 *      prontos ("Enable read access for all users" / "Enable insert for
 *      anon users"); use esses modelos.
 *   5. Vá em "Project Settings" > "API". Copie a "Project URL" e a chave
 *      "anon public".
 *   6. Cole os dois valores nas constantes SUPABASE_URL e
 *      SUPABASE_ANON_KEY logo abaixo (a chave "anon" é longa, começando
 *      com "eyJ...").
 *
 * Enquanto essas duas constantes estiverem vazias, o botão "Compartilhar"
 * continua funcionando normalmente (compartilha o link), mas avisa que a
 * sincronização entre aparelhos ainda não está ativada.
 * ============================================================================
 */

const SUPABASE_URL = 'https://mdiohswwximmsggmrzue.supabase.co';        // ex: 'https://mdiohswwximmsggmrzue.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_S4jr8HeIkemKqvtzkqNMzw_p3o8a3SX';   // ex: ''
const SUPABASE_BUCKET = 'aurora-backups';

function syncEstaConfigurado() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
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
    const url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${codigo}.json`;
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`Não foi possível localizar essa experiência (${resposta.status})`);
    const backup = await resposta.json();
    await aplicarBackupNoDispositivo(backup);
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

    let urlParaCompartilhar = window.location.href.split('?')[0];

    if (syncEstaConfigurado()) {
        setStatus('Sincronizando com a nuvem...', 'pending');
        try {
            const codigo = await obterOuCriarCodigoCompartilhamento();
            await publicarBackupNaNuvem(codigo);
            urlParaCompartilhar = `${urlParaCompartilhar}?c=${codigo}`;
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

function iniciarModuloSync() {
    document.getElementById('btnCompartilhar').addEventListener('click', compartilharExperiencia);
}
