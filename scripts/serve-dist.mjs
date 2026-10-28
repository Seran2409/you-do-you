/*
 * Serves the static web export (dist/) under /you-do-you/ like GitHub Pages does:
 * /todos -> todos.html, unknown paths -> 404.html. Used for local checks and the E2E tests.
 * Run: node scripts/serve-dist.mjs [port]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.argv[2] || 8090);
const BASE = '/you-do-you';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

function send(res, status, file) {
  res.writeHead(status, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const path = decodeURIComponent((req.url || '/').split('?')[0]);
  if (path === '/') {
    res.writeHead(302, { Location: BASE + '/' });
    return res.end();
  }
  if (path.startsWith(BASE)) {
    const rel = path.slice(BASE.length) || '/';
    for (const candidate of [rel, rel + '.html', join(rel, 'index.html')]) {
      const file = normalize(join(root, candidate));
      if (file.startsWith(root) && existsSync(file) && statSync(file).isFile()) return send(res, 200, file);
    }
  }
  const notFound = join(root, '404.html');
  if (existsSync(notFound)) return send(res, 404, notFound);
  res.writeHead(404);
  res.end('Not found');
}).listen(port, () => console.log(`Serving dist on http://localhost:${port}${BASE}/`));
