// Prévia isolada: não conecta nem grava no Supabase real.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/preview-loading') {
        const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
        const vinheta = index.slice(index.indexOf('<div id="vinhetaAbertura"'), index.indexOf('<script', index.indexOf('<div id="vinhetaAbertura"')));
        res.writeHead(200, { 'Content-Type': types['.html'] });
        res.end('<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/css/style.css"><title>Prévia isolada do carregamento</title><body>' +
            vinheta.replace('class="vinheta-abertura"', 'class="vinheta-abertura vinheta-modo-retorno"').replace('>ARYAH<', '>Para meu amor<') +
            '<script src="/js/sync.js"></script><script>atualizarProgressoEntrada("Buscando novidades", 4, 12);</script></body></html>');
        return;
    }
    const name = pathname === '/' ? '/index.html' : pathname;
    const file = path.resolve(root, '.' + name);
    if (!file.startsWith(root + path.sep) || name.includes('/.') || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404); res.end(); return;
    }
    let bytes = fs.readFileSync(file);
    if (name === '/js/sync.js') bytes = Buffer.from(bytes.toString().replace(/const SUPABASE_URL = '[^']*'/, "const SUPABASE_URL = ''"));
    if (name === '/js/config.js') bytes = Buffer.from(bytes.toString().replace(/const BLOQUEIO_DESKTOP_ATIVO\s*=\s*true/, 'const BLOQUEIO_DESKTOP_ATIVO = false'));
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(bytes);
}).listen(4187, '127.0.0.1', () => console.log('Prévia isolada: http://127.0.0.1:4187/preview-loading'));
