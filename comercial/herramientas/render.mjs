// Renderiza los videos finales del comercial, sin editor de video:
//   comercial/07_videos_finales/Calibra_60s_16x9.mp4, Calibra_30s_16x9.mp4 y Calibra_15s_9x16.mp4
// Usa los recursos ya generados (clips de la app, marco, end cards, locución guía). No necesita la app corriendo.
// Uso: node render.mjs            (los tres)   ·   node render.mjs 60s   (solo uno)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { CHROME, COLOR, FUENTES, MARCA, SALIDA } from './config.mjs';
import { CORTES, ESCENAS } from './guion.mjs';

const raiz = fileURLToPath(SALIDA);
const destino = path.join(raiz, '07_videos_finales');
fs.mkdirSync(destino, { recursive: true });
const TIPOS = { '.png': 'image/png', '.mp4': 'video/mp4', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mov': 'video/mp4', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

// Servidor local: entrega los recursos de comercial/ y recibe el MP4 terminado.
const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/guardar') {
    const archivo = path.join(destino, path.basename(url.searchParams.get('nombre')));
    const partes = [];
    req.on('data', (d) => partes.push(d));
    req.on('end', () => { fs.writeFileSync(archivo, Buffer.concat(partes)); res.end('ok'); });
    return;
  }
  if (url.pathname === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="${FUENTES.css}">
      <body style="font-family:${FUENTES.titulos},${FUENTES.texto}">.</body>
      <script>window.STOCK=${JSON.stringify(STOCK)};window.MARCA=${JSON.stringify(MARCA)};window.MARCA_COLOR=${JSON.stringify(COLOR)};</script>
      <script src="/herramientas/node_modules/mp4-muxer/build/mp4-muxer.js"></script>
      <script src="/herramientas/composicion.js"></script>`);
  }
  const archivo = path.join(raiz, decodeURIComponent(url.pathname));
  if (!archivo.startsWith(raiz) || !fs.existsSync(archivo)) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', TIPOS[path.extname(archivo)] ?? 'application/octet-stream');
  fs.createReadStream(archivo).pipe(res);
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const base = `http://localhost:${servidor.address().port}`;

// Usa la locución que exista: MP3 (voz neuronal) o WAV (voz de Windows).
// Tomas de Adobe Stock por escena (archivos en comercial/08_stock; si no están, se usa la animación).
const STOCK = { E01: 'E01_espresso_501155700.mov', E02a: 'E02a_molido_125333823.mov', E02b: 'E02b_compactar_574960367.mov', E09: 'E09_servir_464409799.mov' };
const vo = (id) => { const d = path.join(raiz, '06_audio/locucion_guia'); const f = fs.readdirSync(d).find((x) => x.startsWith(`VO_${id}.`)); return `/06_audio/locucion_guia/${f}`; };
const VERSIONES = {
  '60s': { nombre: 'Calibra_60s_16x9.mp4', ancho: 1920, alto: 1080, subtitulos: false,
    segmentos: ESCENAS.map((e) => ({ escena: e.id, dur: e.fin - e.ini, vo: vo(e.id), texto: e.vo })) },
  '30s': { nombre: 'Calibra_30s_16x9.mp4', ancho: 1920, alto: 1080, subtitulos: false,
    segmentos: CORTES['30s'].map((c, i) => ({ escena: c.de, dur: c.dur, vo: vo(`30s_${i + 1}`), texto: c.vo })) },
  '15s': { nombre: 'Calibra_15s_9x16.mp4', ancho: 1080, alto: 1920, subtitulos: true,
    segmentos: CORTES['15s_vertical'].map((c, i) => ({ escena: c.de, dur: c.dur, vo: vo(`15s_vertical_${i + 1}`), texto: c.vo })) },
};
const pedidas = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VERSIONES);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 1800000 });
const page = await browser.newPage();
page.on('console', (m) => console.log('  ', m.text()));
page.on('pageerror', (e) => console.log('  error en la página:', e.message));
await page.goto(base, { waitUntil: 'load' });
// Modo revisión: node render.mjs cuadro <escena> <t> <dur> <ancho> <alto> <salida.png>
if (pedidas[0] === 'cuadro') {
  const [, escena, t, dur, W, H, salida] = pedidas;
  const bin = await page.evaluate((a) => window.cuadro(a[0], +a[1], +a[2], +a[3], +a[4]), [escena, t, dur, W, H]);
  fs.writeFileSync(salida, Buffer.from(bin, 'latin1'));
  pedidas.length = 0;
}
for (const k of pedidas) {
  const inicio = Date.now();
  const r = await page.evaluate((ver) => window.renderizar(ver), VERSIONES[k]);
  const ruta = path.join(destino, VERSIONES[k].nombre);
  console.log(`ok ${VERSIONES[k].nombre} · ${r.total} s · ${r.cuadros} cuadros · pico de audio ${r.pico} · ${(fs.statSync(ruta).size / 1e6).toFixed(1)} MB · ${Math.round((Date.now() - inicio) / 1000)} s de render`);
}
await browser.close();
servidor.close();
