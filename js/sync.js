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
 * recebo, não guardo e não posso validar nenhuma chave por conta própria.
 * As constantes abaixo já foram preenchidas em uma etapa anterior deste
 * projeto (ver nota "Já configurado", abaixo).
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
 * Já configurado: as constantes abaixo já estão com URL/chave preenchidas
 * (feito em uma etapa anterior). Se um dia precisar trocar de projeto
 * Supabase, é só repetir os passos acima e colar os novos valores aqui.
 *
 * LIMITE DE SEGURANÇA HONESTO (vale a pena entender):
 * a chave "anon" É PARA SER PÚBLICA — é assim que o Supabase funciona
 * (a proteção de verdade vem das "Policies" do bucket, não do segredo da
 * chave). Como este é um site 100% estático (sem servidor próprio), a
 * senha "1406" protege a TELA do site, mas não o arquivo bruto no bucket:
 * qualquer pessoa que veja o código-fonte da página (ex: "Ver código-fonte"
 * no navegador) consegue ler SUPABASE_URL, a chave e o nome do arquivo
 * (EXPERIENCE_ID, em js/config.js) e montar a URL pública do backup direto
 * pelo Supabase, sem passar pela senha. Isso é uma limitação inerente de
 * qualquer app puramente estático (sem back-end) que sincroniza dados
 * "privados" na nuvem — não é um bug para corrigir com mais código, e sim
 * um limite de arquitetura. Na prática, o link só chega a quem vocês dois
 * compartilharem, então o risco real é baixo — mas é bom saber que a
 * senha protege a experiência dentro do site, não o arquivo na nuvem.
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

/**
 * Envia o backup completo para o bucket público do Supabase Storage.
 * Formato NOVO (ver js/export.js): um .zip binário com todas as mídias
 * (sem base64), mais um arquivo ".meta.json" pequeno contendo só o
 * timestamp — para que sincronizarNaAbertura() consiga checar "existe
 * algo mais novo?" sem precisar baixar o zip inteiro toda vez.
 */
async function publicarBackupNaNuvem(codigo) {
    const zipBlob = await gerarBackupZipBlob();
    const atualizadoEm = parseInt(await obterConfiguracao('aurora_atualizado_em'), 10) || Date.now();

    const urlZip = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${codigo}.zip`;
    const respostaZip = await fetch(urlZip, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/zip',
            'x-upsert': 'true'
        },
        body: zipBlob
    });
    if (!respostaZip.ok) throw new Error(`Falha ao publicar na nuvem: ${respostaZip.status}`);

    const urlMeta = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${codigo}-meta.json`;
    const respostaMeta = await fetch(urlMeta, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'x-upsert': 'true'
        },
        body: JSON.stringify({ atualizadoEm })
    });
    if (!respostaMeta.ok) throw new Error(`Falha ao publicar metadados na nuvem: ${respostaMeta.status}`);

    return true;
}

/** Baixa o backup (.zip) de um código de compartilhamento e aplica no aparelho atual. */
async function importarBackupDaNuvem(codigo) {
    const zipDados = await buscarBackupZipDaNuvem(codigo);
    if (!zipDados) throw new Error('Não foi possível localizar essa experiência.');
    await aplicarBackupDeZip(zipDados);
}

/** Baixa só o arquivo pequeno de metadados (timestamp) de um código. Retorna `null` se não existir (404). */
async function buscarMetaDaNuvem(codigo) {
    // "?t=" muda a cada chamada de propósito: as URLs "públicas" do Supabase
    // Storage passam por um CDN, e "cache: no-store" só evita o cache do
    // NAVEGADOR — não evita o cache do CDN na frente do bucket. Sem isso, um
    // aparelho podia continuar recebendo uma resposta antiga (inclusive um
    // 404 já superado) por um tempo depois de algo mudar de verdade.
    const url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${codigo}-meta.json?t=${Date.now()}`;
    const resposta = await fetch(url, { cache: 'no-store' });
    if (resposta.status === 404) return null;
    if (!resposta.ok) throw new Error(`Falha ao consultar a nuvem (${resposta.status})`);
    return await resposta.json();
}

/** Baixa o .zip completo (ArrayBuffer) de um código. Retorna `null` se não existir (404). */
async function buscarBackupZipDaNuvem(codigo) {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${codigo}.zip?t=${Date.now()}`; // ver nota sobre cache do CDN em buscarMetaDaNuvem
    const resposta = await fetch(url, { cache: 'no-store' });
    if (resposta.status === 404) return null;
    if (!resposta.ok) throw new Error(`Falha ao consultar a nuvem (${resposta.status})`);
    return await resposta.arrayBuffer();
}

/** Apaga o backup desta experiência na nuvem (usado pelo botão "Resetar Site"). */
async function apagarBackupDaNuvem() {
    if (!syncEstaConfigurado()) return;
    // Inclui o nome antigo (.json) por compatibilidade com experiências criadas antes desta correção.
    const arquivos = [`${EXPERIENCE_ID}.zip`, `${EXPERIENCE_ID}-meta.json`, `${EXPERIENCE_ID}.json`];
    for (const nomeArquivo of arquivos) {
        try {
            await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${nomeArquivo}`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
        } catch (err) {
            console.error(`Falha ao apagar "${nomeArquivo}" na nuvem:`, err);
        }
    }
}

/* ----------------------------------------------------------------------
 * MARCADOR DE RESET ("tombstone")
 * ----------------------------------------------------------------------
 * CORREÇÃO IMPORTANTE (bug relatado: resetar em um aparelho não resetava
 * o outro): apagar o backup da nuvem sozinho não bastava. O OUTRO
 * aparelho ainda tinha os dados antigos guardados localmente (vídeo,
 * fotos, etc.) — e como ele nunca soube que um reset aconteceu, na
 * próxima vez que fosse aberto ele via "eu tenho dados e a nuvem não
 * tem nada", e reenviava tudo de volta pra nuvem, ressuscitando o que
 * acabou de ser apagado.
 *
 * CORREÇÃO DE UM BUG QUE ISSO CAUSOU DEPOIS (relatado: "para meu amor"
 * aparece e, segundos depois, volta pra tela de comprar as alianças): a
 * primeira versão comparava o marcador de reset contra um "ack" salvo em
 * CADA aparelho — se aquele aparelho nunca tivesse "visto" aquele reset
 * específico (por exemplo: um teste de reset feito há tempos, cujo
 * marcador nunca é apagado), ele se limpava de novo, MESMO que a nuvem já
 * tivesse dados reais e mais novos que aquele reset. Ou seja, um reset de
 * teste antigo conseguia apagar dados de verdade, mais recentes.
 *
 * A correção: em vez de comparar contra um "ack" por aparelho, comparamos
 * o instante do reset contra o instante do dado mais recente que existe
 * de verdade (nuvem OU local). Um reset só é "válido"/pendente se for MAIS
 * NOVO que qualquer dado real conhecido — ou seja, se ninguém ainda
 * recomeçou desde então. Assim que dados novos são publicados na nuvem
 * depois de um reset, aquele reset vira automaticamente "página virada"
 * para sempre, sem precisar de nenhum controle extra por aparelho.
 * ---------------------------------------------------------------------- */

/** Baixa só o marcador de reset (timestamp). Retorna `null` se nunca existiu (404). */
async function buscarMarcadorDeReset() {
    const resposta = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${EXPERIENCE_ID}-reset.json?t=${Date.now()}`, { cache: 'no-store' }); // ver nota sobre cache do CDN em buscarMetaDaNuvem
    if (resposta.status === 404) return null;
    if (!resposta.ok) throw new Error(`Falha ao consultar marcador de reset (HTTP ${resposta.status})`);
    return await resposta.json();
}

/** Publica o marcador de reset na nuvem, avisando qualquer outro aparelho a se limpar também. */
async function publicarMarcadorDeReset() {
    if (!syncEstaConfigurado()) return;
    const resposta = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${EXPERIENCE_ID}-reset.json`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'x-upsert': 'true' },
        body: JSON.stringify({ resetadoEm: Date.now() })
    });
    if (!resposta.ok) throw new Error(`Falha ao publicar marcador de reset (HTTP ${resposta.status})`);
}

/** Limpeza local completa (IndexedDB + localStorage + sessionStorage + cache) — usada pelo reset manual e pelo reset remoto detectado. */
async function limparArmazenamentoLocal() {
    try { await db.media.clear(); await db.configuracoes.clear(); } catch (e) { console.error('Falha ao limpar IndexedDB:', e); }
    try { localStorage.clear(); } catch (e) { /* ignora */ }
    try { sessionStorage.clear(); } catch (e) { /* ignora */ }
    try {
        if (window.caches && caches.keys) {
            const nomes = await caches.keys();
            await Promise.all(nomes.map(nome => caches.delete(nome)));
        }
    } catch (e) { /* ignora */ }
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
let __auroraSyncEmAndamento = 0; // contador de envios em voo (pode haver mais de um sobreposto)

/**
 * CORREÇÃO IMPORTANTE (bug relatado: vídeo/foto/áudio somem em outro
 * aparelho mesmo com "diagnóstico" passando): o envio automático era
 * SILENCIOSO e esperava 2 segundos pra começar. No iPhone, se a pessoa
 * trava a tela ou troca de app logo depois de gravar (bem comum!), o
 * Safari/Chrome (que no iOS usa o mesmo motor do Safari) costuma
 * suspender esse envio antes dele terminar — o vídeo fica salvo NO
 * APARELHO, mas nunca chega na nuvem, e por isso nunca aparece no outro
 * celular. Agora: (1) mídia grande dispara o envio IMEDIATAMENTE, sem
 * esperar; (2) um aviso fica visível na tela dizendo pra não fechar o
 * app até terminar; (3) se a pessoa tentar fechar a aba/navegar para
 * fora durante o envio, o navegador pergunta antes de sair.
 */
function mostrarBannerSync(emAndamento) {
    __auroraSyncEmAndamento = Math.max(0, __auroraSyncEmAndamento + (emAndamento ? 1 : -1));
    const banner = document.getElementById('auroraSyncBanner');
    if (banner) banner.classList.toggle('d-none', __auroraSyncEmAndamento <= 0);
}

window.addEventListener('beforeunload', (evt) => {
    if (__auroraSyncEmAndamento > 0) {
        evt.preventDefault();
        evt.returnValue = 'Ainda estamos salvando na nuvem — se sair agora, o que você acabou de gravar pode não aparecer no outro aparelho.';
        return evt.returnValue;
    }
});

let __auroraPublicacaoEmAndamento = false; // true enquanto um envio já está em voo
let __auroraPublicacaoPendente = false;    // true se algo mudou DE NOVO enquanto esse envio estava em voo

/**
 * Publica na nuvem mostrando o aviso visível na tela enquanto durar. Serializado
 * de propósito: como mídia grande agora dispara o envio IMEDIATAMENTE (ver
 * agendarEnvioNuvem), duas ações rápidas em sequência (ex.: gravar o vídeo e,
 * enquanto ele ainda está subindo, adicionar uma lembrança) poderiam disparar
 * DOIS envios em paralelo — e se o mais antigo (e mais lento, por ser maior)
 * terminasse DEPOIS do mais novo, ele sobrescreveria a nuvem com um estado
 * desatualizado, perdendo a lembrança adicionada depois. Em vez de deixar os
 * dois rodarem ao mesmo tempo, uma nova chamada enquanto já existe um envio em
 * voo só marca "pendente" e é reprocessada assim que o envio atual terminar —
 * sempre lendo o estado mais atual do banco na hora de gerar o próximo zip.
 */
async function publicarComIndicadorVisivel() {
    if (__auroraPublicacaoEmAndamento) {
        __auroraPublicacaoPendente = true;
        return;
    }

    __auroraPublicacaoEmAndamento = true;
    mostrarBannerSync(true);
    try {
        do {
            __auroraPublicacaoPendente = false;
            await publicarBackupNaNuvem(EXPERIENCE_ID);
        } while (__auroraPublicacaoPendente);
    } finally {
        __auroraPublicacaoEmAndamento = false;
        mostrarBannerSync(false);
    }
}

/**
 * Chamado (via hook em db.js) sempre que algo muda localmente.
 * `imediato = true` (usado para vídeo, foto, áudio — ver salvarMedia em
 * js/db.js) dispara o envio na hora, sem esperar; `imediato = false`
 * (usado para configurações pequenas, ex.: respostas de quiz) continua
 * agrupando várias mudanças rápidas num único envio, para não martelar
 * a rede a cada tecla digitada.
 */
function agendarEnvioNuvem(imediato = false) {
    if (!syncEstaConfigurado()) return;
    if (__auroraAplicandoBackupRemoto) return; // essa mudança veio de um backup importado, não precisa reenviar

    clearTimeout(__auroraTimeoutEnvioNuvem);
    const disparar = () => {
        publicarComIndicadorVisivel().catch(err => {
            console.error('Falha no envio automático para a nuvem:', err);
            const statusEl = document.getElementById('compartilharStatus');
            if (statusEl) { statusEl.textContent = 'Não sincronizou automaticamente — toque em "Compartilhar" para tentar de novo, ou confira sua internet.'; statusEl.className = 'save-status err'; }
        });
    };

    if (imediato) {
        disparar();
    } else {
        __auroraTimeoutEnvioNuvem = setTimeout(disparar, 1200);
    }
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

    let marcadorReset = null;
    let meta = null;
    try {
        [marcadorReset, meta] = await Promise.all([
            buscarMarcadorDeReset().catch(err => { console.error('Falha ao checar marcador de reset (seguindo normalmente):', err); return null; }),
            buscarMetaDaNuvem(EXPERIENCE_ID).catch(err => { console.error('Não foi possível consultar a nuvem ao abrir o site:', err); return null; })
        ]);
    } catch (err) {
        console.error('Falha ao consultar a nuvem ao abrir o site (seguindo com os dados locais):', err);
        return;
    }

    const resetadoEm = (marcadorReset && marcadorReset.resetadoEm) ? marcadorReset.resetadoEm : 0;
    const timestampNuvem = (meta && meta.atualizadoEm) ? meta.atualizadoEm : 0;

    // Um reset só é "pendente" se for mais novo que QUALQUER dado real
    // conhecido (nuvem OU local) — ou seja, se ninguém ainda recomeçou
    // desde então. Assim que dados novos existem depois de um reset
    // (nuvem ou localmente), aquele reset já foi superado e é ignorado —
    // é isso que evita um reset de teste antigo apagar dados de verdade
    // mais recentes.
    const resetPendente = resetadoEm > 0 && resetadoEm > timestampNuvem && resetadoEm > timestampLocal;

    if (resetPendente) {
        await limparArmazenamentoLocal();
        location.reload();
        return; // location.reload() é assíncrono — não deixa nada mais rodar neste ciclo
    }

    if (meta && timestampNuvem > timestampLocal) {
        // A nuvem tem uma versão mais nova (ex.: foi concluída em outro aparelho) — baixa o zip completo e aplica aqui.
        __auroraAplicandoBackupRemoto = true;
        try {
            const zipDados = await buscarBackupZipDaNuvem(EXPERIENCE_ID);
            if (zipDados) {
                await aplicarBackupDeZip(zipDados);
                await db.configuracoes.put({ chave: 'aurora_atualizado_em', valor: String(timestampNuvem) });
                try { localStorage.setItem('aurora_atualizado_em', String(timestampNuvem)); } catch (e) { /* ignora */ }
            }
        } catch (err) {
            console.error('Falha ao baixar/aplicar o backup da nuvem:', err);
        } finally {
            __auroraAplicandoBackupRemoto = false;
        }
    } else if (timestampLocal > 0 && timestampLocal >= timestampNuvem) {
        // Este aparelho tem dados que a nuvem ainda não tem (ex.: primeira vez, ou sem internet antes) — envia agora.
        try {
            await publicarComIndicadorVisivel();
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
            await publicarComIndicadorVisivel();
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

/**
 * Teste de UPLOAD BINÁRIO REAL — sobe um arquivo de alguns MB (simulando o
 * peso de um vídeo/foto de verdade) pelo MESMO caminho que o backup .zip
 * real usa (POST binário direto, "Content-Type: application/zip",
 * "x-upsert"). Isso é essencial porque testarConexaoNuvem() só testa um
 * JSON de poucos bytes — passa tranquilamente mesmo que o bucket tenha um
 * "File size limit" baixo demais, ou mesmo que a rede do celular seja
 * lenta o bastante para o upload de um vídeo real cair pela metade. Este
 * teste é o que realmente reproduz o problema que fotos e vídeos grandes
 * podem encontrar.
 */
async function testarUploadMediaReal() {
    if (!syncEstaConfigurado()) {
        return { ok: false, motivo: 'Sincronização não configurada em js/sync.js.' };
    }

    const idTeste = `diagnostico_zip_${Date.now()}`;
    const tamanhoBytes = 8 * 1024 * 1024; // 8MB — próximo do peso real de um backup .zip com fotos + um vídeo curto
    const blobTeste = criarBlobDeTeste(tamanhoBytes);
    const caminho = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${idTeste}.zip`;
    const caminhoPublico = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${idTeste}.zip`;
    const inicio = performance.now();

    // 1) Upload binário (mesmo formato usado por publicarBackupNaNuvem).
    try {
        const respostaUpload = await fetch(caminho, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/zip',
                'x-upsert': 'true'
            },
            body: blobTeste
        });
        if (!respostaUpload.ok) {
            const corpo = await respostaUpload.text().catch(() => '');
            return {
                ok: false,
                motivo: `Upload de ${(tamanhoBytes / (1024 * 1024)).toFixed(0)}MB falhou (HTTP ${respostaUpload.status}). Causa mais comum: "File size limit" do bucket (Storage > aurora-backups > Edit bucket, no painel do Supabase) ou política de INSERT ausente. Detalhe: ${corpo.slice(0, 200)}`
            };
        }
    } catch (err) {
        return { ok: false, motivo: `Não foi possível conectar ao Supabase para o upload: ${err.message}` };
    }

    // 2) Download público, para confirmar que o arquivo realmente chegou íntegro.
    let blobBaixado;
    try {
        const respostaDownload = await fetch(caminhoPublico, { cache: 'no-store' });
        if (!respostaDownload.ok) return { ok: false, motivo: `Upload funcionou, mas o download falhou (HTTP ${respostaDownload.status}). Confira se o bucket está público e se a policy de SELECT existe.` };
        blobBaixado = await respostaDownload.blob();
    } catch (err) {
        return { ok: false, motivo: `Upload funcionou, mas o download falhou: ${err.message}` };
    }

    const duracaoMs = Math.round(performance.now() - inicio);

    // 3) Limpeza (apaga o arquivo de teste) — falha aqui não invalida o teste principal.
    try {
        await fetch(caminho, { method: 'DELETE', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
    } catch (e) { /* não crítico */ }

    if (!blobBaixado || blobBaixado.size !== blobTeste.size) {
        return { ok: false, motivo: `O arquivo baixado não bate em tamanho com o enviado (enviado ${blobTeste.size} bytes, baixado ${blobBaixado ? blobBaixado.size : 0} bytes) — algo está truncando o upload/download.` };
    }

    return { ok: true, motivo: `Upload e download de ${(tamanhoBytes / (1024 * 1024)).toFixed(0)}MB binários confirmados em ${duracaoMs}ms, pelo mesmo caminho usado pelo backup .zip real. Vídeos e fotos devem sincronizar normalmente (respeitando o "File size limit" do bucket para o .zip completo).` };
}

function iniciarModuloSync() {
    document.getElementById('btnCompartilhar').addEventListener('click', compartilharExperiencia);
}
