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
 * Hora "confiável" para checagens de data que não podem depender só do
 * relógio do próprio aparelho (ex.: desbloqueio da cápsula do tempo) —
 * sem isso, adiantar a data/hora do celular nas Configurações seria
 * suficiente pra abrir a cápsula antes da hora. Lê o cabeçalho HTTP
 * "Date" (todo servidor manda isso, não precisa de nenhuma rota
 * especial) de uma chamada já usada no projeto. Se não houver internet,
 * cai de volta pro relógio do aparelho (única opção possível offline —
 * ver aviso sobre isso na resposta ao usuário: essa é uma proteção
 * prática contra o golpe mais comum ("mudar a data do celular"), não uma
 * garantia absoluta, já que o app roda 100% no navegador da pessoa.
 */
async function obterHoraConfiavel() {
    if (!syncEstaConfigurado()) return new Date();
    try {
        const resposta = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/`, {
            method: 'HEAD',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const cabecalhoData = resposta.headers.get('date');
        if (cabecalhoData) {
            const dataServidor = new Date(cabecalhoData);
            if (!isNaN(dataServidor.getTime())) return dataServidor;
        }
    } catch (e) {
        console.warn('Não consegui confirmar a hora do servidor (sem internet?) — usando o relógio do aparelho como alternativa.', e);
    }
    return new Date(); // alternativa offline — inevitável sem servidor próprio
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

const TAMANHO_MAXIMO_PARTE_BYTES = 45 * 1024 * 1024; // cada parte fica um pouco abaixo do limite fixo de 50MB do plano gratuito
const AVISO_QUOTA_TOTAL_BYTES = 900 * 1024 * 1024; // aviso ao se aproximar do 1GB de espaço TOTAL do plano gratuito (dividir em partes não resolve isso)

/** Caminho de uma parte do backup — se só existe 1 parte, usa o nome de sempre (compatível com backups antigos). */
function caminhoParteZip(codigo, indice, totalPartes) {
    return totalPartes <= 1 ? `${codigo}.zip` : `${codigo}.zip.parte${indice}`;
}

/**
 * CORREÇÃO (a pergunta que gerou isso: "não dá pra, se passar de 48MB,
 * dividir em 2 arquivos?"): em vez de só recusar backups grandes demais,
 * quando o total passa do limite fixo de 50MB por arquivo do plano
 * gratuito do Supabase, o backup é dividido em pedaços menores — cada um
 * enviado como um arquivo próprio — e remontado automaticamente na hora
 * de baixar (ver buscarBackupZipDaNuvem, mais abaixo). O meta.json passa
 * a guardar quantas partes existem.
 *
 * Importante: isso contorna o limite POR ARQUIVO, mas não aumenta o
 * espaço TOTAL disponível — o plano gratuito do Supabase continua tendo
 * 1GB no total, somando tudo (por isso ainda existe um aviso separado se
 * o backup sozinho já estiver perto disso). Se esse for o caso, vale
 * considerar o YouTube pro vídeo do pedido (sai da conta do backup) ou o
 * plano pago do Supabase.
 */
async function publicarBackupNaNuvem(codigo) {
    const zipBlob = await gerarBackupZipBlob();
    const atualizadoEm = parseInt(await obterConfiguracao('aurora_atualizado_em'), 10) || Date.now();

    if (zipBlob.size > AVISO_QUOTA_TOTAL_BYTES) {
        const tamanhoMB = (zipBlob.size / (1024 * 1024)).toFixed(0);
        throw new Error(`O backup ficou com ${tamanhoMB}MB — perto do espaço TOTAL de 1GB do plano gratuito da nuvem (dividir em partes não resolve isso, é um limite de espaço, não de tamanho por arquivo). Baixe uma cópia manual ("Backup da Nossa História", na página final) para não perder nada, e considere usar o YouTube para o vídeo do pedido (cole o link na seção "Vídeo do nosso pedido") em vez de depender do envio automático dele.`);
    }

    const totalPartes = Math.max(1, Math.ceil(zipBlob.size / TAMANHO_MAXIMO_PARTE_BYTES));

    for (let i = 0; i < totalPartes; i++) {
        const inicio = i * TAMANHO_MAXIMO_PARTE_BYTES;
        const fim = Math.min(inicio + TAMANHO_MAXIMO_PARTE_BYTES, zipBlob.size);
        const parte = zipBlob.slice(inicio, fim);

        const url = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${caminhoParteZip(codigo, i, totalPartes)}`;
        const resposta = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/zip',
                'x-upsert': 'true'
            },
            body: parte
        });
        if (!resposta.ok) throw new Error(`Falha ao publicar parte ${i + 1} de ${totalPartes} na nuvem: ${resposta.status}`);
    }

    // Limpeza best-effort de partes "sobrando" de um envio anterior maior
    // (ex.: o backup diminuiu de tamanho, ou voltou a caber numa parte só).
    try {
        const nomesParaApagar = [];
        for (let i = totalPartes; i < totalPartes + 3; i++) nomesParaApagar.push(`${codigo}.zip.parte${i}`);
        if (totalPartes > 1) nomesParaApagar.push(`${codigo}.zip`); // era um arquivo único, agora virou múltiplas partes
        await Promise.all(nomesParaApagar.map(nome => fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${nome}`, {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        }).catch(() => {})));
    } catch (e) { /* limpeza, não crítico */ }

    const urlMeta = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${codigo}-meta.json`;
    const respostaMeta = await fetch(urlMeta, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'x-upsert': 'true'
        },
        body: JSON.stringify({ atualizadoEm, partes: totalPartes })
    });
    if (!respostaMeta.ok) throw new Error(`Falha ao publicar metadados na nuvem: ${respostaMeta.status}`);

    return true;
}

/** Baixa o backup (.zip) de um código de compartilhamento e aplica no aparelho atual. */
async function importarBackupDaNuvem(codigo) {
    const meta = await buscarMetaDaNuvem(codigo);
    const zipDados = await buscarBackupZipDaNuvem(codigo, meta ? meta.partes : 1);
    if (!zipDados) throw new Error('Não foi possível localizar essa experiência.');
    await aplicarBackupDeZip(zipDados);
}

/** Baixa só o arquivo pequeno de metadados (timestamp + quantas partes o backup tem) de um código. Retorna `null` se não existir (404). */
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

/**
 * Baixa o .zip completo (ArrayBuffer) de um código. Se o backup foi
 * dividido em várias partes (ver publicarBackupNaNuvem), baixa cada uma e
 * remonta na ordem certa antes de devolver. Retorna `null` se não existir
 * (404) — inclusive se alguma parte estiver faltando, pra nunca aplicar
 * um backup incompleto/corrompido.
 */
async function buscarBackupZipDaNuvem(codigo, totalPartes) {
    const partes = Math.max(1, totalPartes || 1);

    if (partes === 1) {
        const url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${codigo}.zip?t=${Date.now()}`; // ver nota sobre cache do CDN em buscarMetaDaNuvem
        const resposta = await fetch(url, { cache: 'no-store' });
        if (resposta.status === 404) return null;
        if (!resposta.ok) throw new Error(`Falha ao consultar a nuvem (${resposta.status})`);
        return await resposta.arrayBuffer();
    }

    const buffers = [];
    for (let i = 0; i < partes; i++) {
        const url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${codigo}.zip.parte${i}?t=${Date.now()}`;
        const resposta = await fetch(url, { cache: 'no-store' });
        if (resposta.status === 404) return null; // uma parte sumiu — não aplica um backup incompleto
        if (!resposta.ok) throw new Error(`Falha ao baixar parte ${i + 1} de ${partes} da nuvem (${resposta.status})`);
        buffers.push(await resposta.arrayBuffer());
    }

    const tamanhoTotal = buffers.reduce((soma, b) => soma + b.byteLength, 0);
    const combinado = new Uint8Array(tamanhoTotal);
    let offset = 0;
    for (const b of buffers) { combinado.set(new Uint8Array(b), offset); offset += b.byteLength; }
    return combinado.buffer;
}

/** Apaga o(s) arquivo(s) de backup antigo(s) da nuvem — incluindo partes, se o backup tiver sido dividido (limpeza — não é a parte crítica do reset, ver publicarResetNaNuvem). */
async function apagarZipDaNuvem() {
    if (!syncEstaConfigurado()) return;
    // Inclui o nome antigo (.json) por compatibilidade com experiências criadas antes desta correção,
    // e um número generoso de partes possíveis (ver publicarBackupNaNuvem) — DELETE num arquivo que
    // não existe simplesmente não faz nada, então não tem problema tentar mais do que o necessário.
    const arquivos = [`${EXPERIENCE_ID}.zip`, `${EXPERIENCE_ID}.json`, `${EXPERIENCE_ID}-reset.json`];
    for (let i = 0; i < 20; i++) arquivos.push(`${EXPERIENCE_ID}.zip.parte${i}`);

    await Promise.all(arquivos.map(nomeArquivo => fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${nomeArquivo}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    }).catch(err => console.error(`Falha ao apagar "${nomeArquivo}" na nuvem (não crítico):`, err))));
}

/* ----------------------------------------------------------------------
 * RESET PROPAGADO VIA O PRÓPRIO meta.json (sem arquivo separado)
 * ----------------------------------------------------------------------
 * CORREÇÃO IMPORTANTE (bug relatado: resetar em um aparelho não resetava
 * o outro): apagar o backup da nuvem sozinho não bastava. O OUTRO
 * aparelho ainda tinha os dados antigos guardados localmente — e como ele
 * nunca soube que um reset aconteceu, reenviava tudo de volta pra nuvem,
 * ressuscitando o que acabou de ser apagado.
 *
 * TENTATIVA 2 (bug: "para meu amor" some e volta pra loja): comparar
 * contra um "ack" por aparelho falhava quando aquele aparelho nunca tinha
 * visto um reset específico (ex.: teste antigo).
 *
 * TENTATIVA 3 (bug relatado: banco resetava mas o outro aparelho
 * continuava pedindo a senha e voltando pro final) — a causa provável:
 * essa versão usava um ARQUIVO SEPARADO ("${EXPERIENCE_ID}-reset.json")
 * publicado numa segunda escrita, depois de apagar o backup. Se essa
 * segunda escrita falhasse silenciosamente por qualquer motivo (rede,
 * política do bucket, etc.) — mesmo a primeira (apagar) tendo funcionado
 * — o outro aparelho nunca via sinal nenhum de reset, e pior: ao ver a
 * nuvem "vazia" sem saber por quê, ele reenviava seus dados antigos de
 * volta, resSUCITANDO tudo outra vez.
 *
 * CORREÇÃO FINAL: eliminar o arquivo separado. O reset agora SOBRESCREVE
 * o próprio "${EXPERIENCE_ID}-meta.json" (o mesmo arquivo pequeno que já
 * é lido em toda sincronização normal) com uma marca "resetado: true".
 * Uma única escrita, um único arquivo, sem risco de "uma parte funcionou
 * e a outra não" — ou o reset é publicado, ou não é; nunca um meio-termo.
 * ---------------------------------------------------------------------- */

/** Publica o reset diretamente no meta.json (sobrescreve), avisando qualquer outro aparelho a se limpar também.
 *  Tenta várias vezes antes de desistir: essa é a escrita mais crítica de todo o fluxo de reset — se ela
 *  falhar silenciosamente (rede instável, por exemplo), o outro aparelho nunca fica sabendo do reset. */
async function publicarResetNaNuvem() {
    if (!syncEstaConfigurado()) return;

    const TENTATIVAS = 4;
    let ultimoErro = null;

    for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
        try {
            const resposta = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${EXPERIENCE_ID}-meta.json`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'x-upsert': 'true' },
                body: JSON.stringify({ atualizadoEm: Date.now(), resetado: true })
            });
            if (!resposta.ok) throw new Error(`Falha ao publicar o reset na nuvem (HTTP ${resposta.status})`);

            // Confirma de verdade: relê o meta.json da nuvem e confere se o
            // reset realmente "pegou", em vez de confiar só no HTTP 200 (o
            // bucket pode aceitar a escrita e mesmo assim não refletir por
            // alguma inconsistência momentânea).
            const confirmado = await buscarMetaDaNuvem(EXPERIENCE_ID);
            if (confirmado && confirmado.resetado === true) return; // sucesso confirmado

            throw new Error('O reset foi enviado, mas a confirmação de leitura não mostrou "resetado: true".');
        } catch (err) {
            ultimoErro = err;
            console.error(`publicarResetNaNuvem — tentativa ${tentativa}/${TENTATIVAS} falhou:`, err);
            if (tentativa < TENTATIVAS) await new Promise(r => setTimeout(r, 800 * tentativa)); // espera crescente entre tentativas
        }
    }

    throw ultimoErro || new Error('Falha desconhecida ao publicar o reset na nuvem.');
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
    if (!banner) return;
    if (emAndamento) {
        // Reseta pro texto padrão — evita mostrar um erro antigo (com botão de
        // fechar) por cima de um envio novo que está começando agora.
        banner.classList.remove('aurora-sync-banner-erro');
        banner.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando na nuvem — não feche o app nem tranque a tela ainda...';
    }
    banner.classList.toggle('d-none', __auroraSyncEmAndamento <= 0);
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
 * Mostra um aviso persistente no topo da tela (o mesmo espaço do "Salvando
 * na nuvem...") — diferente do status pequeno da página final
 * (#compartilharStatus), este aparece em QUALQUER tela do site, o que
 * importa pra avisos críticos como "o backup passou perto do limite total de espaço",
 * que costumam acontecer logo depois de gravar o vídeo — bem antes da
 * pessoa chegar na página final onde o status pequeno fica escondido.
 * Fica visível até a pessoa tocar pra fechar (não se limita a alguns
 * segundos, pra não passar despercebido).
 */
function mostrarAvisoPersistente(mensagem) {
    const banner = document.getElementById('auroraSyncBanner');
    if (!banner) return;
    banner.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${mensagem} <button type="button" class="aurora-aviso-fechar" aria-label="Fechar">&times;</button>`;
    banner.classList.remove('d-none');
    banner.classList.add('aurora-sync-banner-erro');
    banner.querySelector('.aurora-aviso-fechar').addEventListener('click', () => {
        banner.classList.add('d-none');
        banner.classList.remove('aurora-sync-banner-erro');
        banner.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando na nuvem — não feche o app nem tranque a tela ainda...';
    });
}

/**
 * Chamado (via hook em db.js) sempre que algo muda localmente.
 * `imediato = true` (usado para vídeo, foto, áudio — ver salvarMedia em
 * js/db.js) dispara o envio na hora, sem esperar; `imediato = false`
 * (usado para configurações pequenas, ex.: respostas de quiz) continua
 * agrupando várias mudanças rápidas num único envio, para não martelar
 * a rede a cada tecla digitada.
 */
/**
 * CORREÇÃO CRÍTICA (bug relatado: reset não propagava mesmo depois de
 * várias tentativas): os testes de diagnóstico em diagnostico.html salvam
 * e apagam dados de teste reais no banco (pra confirmar que salvar/ler
 * funciona) — e isso, sem essa proteção, disparava sincronizações de
 * verdade com a nuvem, reenviando (ou sobrescrevendo) o estado real só
 * por causa de um teste técnico. Como o diagnóstico roda automaticamente
 * toda vez que a página abre, isso significava que CONFERIR o estado do
 * reset podia, ele mesmo, apagar o sinal de reset antes do outro
 * aparelho ter a chance de vê-lo. js/diagnostics.js liga essa chave antes
 * de rodar os testes e desliga depois.
 */
window.__auroraSuprimirSyncDiagnostico = false;

function agendarEnvioNuvem(imediato = false) {
    if (!syncEstaConfigurado()) return;
    if (__auroraAplicandoBackupRemoto) return; // essa mudança veio de um backup importado, não precisa reenviar
    if (window.__auroraSuprimirSyncDiagnostico) return; // mudança causada por um teste de diagnóstico — não é conteúdo real, não sincroniza

    clearTimeout(__auroraTimeoutEnvioNuvem);
    const disparar = () => {
        publicarComIndicadorVisivel().catch(err => {
            console.error('Falha no envio automático para a nuvem:', err);
            const mensagemEspecifica = (err && err.message && err.message.includes('espaço TOTAL')) ? err.message : null;

            if (mensagemEspecifica) {
                // Aviso importante — mostra em qualquer tela do site, não só na página final.
                mostrarAvisoPersistente(mensagemEspecifica);
            }

            const statusEl = document.getElementById('compartilharStatus');
            if (statusEl) {
                statusEl.textContent = mensagemEspecifica || 'Não sincronizou automaticamente — toque em "Compartilhar" para tentar de novo, ou confira sua internet.';
                statusEl.className = 'save-status err';
            }
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

    let meta = null;
    try {
        meta = await buscarMetaDaNuvem(EXPERIENCE_ID);
    } catch (err) {
        console.error('Não foi possível consultar a nuvem ao abrir o site (seguindo com os dados locais):', err);
        return;
    }

    const timestampNuvem = (meta && meta.atualizadoEm) ? meta.atualizadoEm : 0;
    const nuvemFoiResetada = Boolean(meta && meta.resetado);

    // Um reset só é "pendente" pra este aparelho se for mais novo que
    // qualquer dado que ele já conhece — ou seja, se ele ainda não sabe
    // desse reset. Assim que este aparelho publica algo novo (mesmo que
    // seja só "recomeçando vazio"), o meta.json deixa de ter a marca
    // "resetado", e o reset vira página virada pra sempre — sem precisar
    // de nenhum controle extra por aparelho.
    const resetPendente = nuvemFoiResetada && timestampNuvem > timestampLocal;

    if (resetPendente) {
        await limparArmazenamentoLocal();
        // Alinha o relógio local com o do reset (em vez de deixar em zero):
        // assim, na PRÓXIMA abertura (logo depois do reload abaixo), este
        // aparelho já sabe que está "em dia" com esse reset específico, e
        // não entra num loop de detectar o mesmo reset de novo a cada
        // recarregamento (o que aconteceria se local ficasse em zero pra
        // sempre, já que zero é sempre "mais velho" que qualquer reset).
        try { await db.configuracoes.put({ chave: 'aurora_atualizado_em', valor: String(timestampNuvem) }); } catch (e) { /* ignora */ }
        try { localStorage.setItem('aurora_atualizado_em', String(timestampNuvem)); } catch (e) { /* ignora */ }
        location.reload();
        return; // location.reload() é assíncrono — não deixa nada mais rodar neste ciclo
    }

    if (meta && !nuvemFoiResetada && timestampNuvem > timestampLocal) {
        // A nuvem tem uma versão mais nova (ex.: foi concluída em outro aparelho) — baixa o zip completo e aplica aqui.
        __auroraAplicandoBackupRemoto = true;
        try {
            const zipDados = await buscarBackupZipDaNuvem(EXPERIENCE_ID, meta.partes);
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
    } else if (!nuvemFoiResetada && timestampLocal > 0 && timestampLocal >= timestampNuvem) {
        // Este aparelho tem dados que a nuvem ainda não tem (ex.: primeira vez, ou sem internet antes) — envia agora.
        // Isso também é o que "tira" a marca de reset do meta.json quando este aparelho já está em dia com o reset.
        // CORREÇÃO: exige "!nuvemFoiResetada" — sem isso, um aparelho cujo timestamp local já fosse >= ao do
        // reset (por já ter "visto" esse reset antes) podia reenviar dados antigos por cima da marca de reset,
        // ressuscitando informação que deveria ter sido apagada.
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
