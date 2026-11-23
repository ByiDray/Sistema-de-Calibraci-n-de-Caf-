// Graba clips MP4 (H.264, 780 × 1688, 30 fps) de la app en uso, en comercial/04_video_app.
// Chrome captura la pantalla con el screencast de DevTools y la codifica con WebCodecs;
// mp4-muxer arma el archivo. No necesita ffmpeg. Requiere la API local y la app web corriendo.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { APP_URL, SALIDA } from './config.mjs';
import { abrirApp, escribir, esperar, indicadorDeToques, inicio, subirA, tocar } from './comun.mjs';

const require = createRequire(import.meta.url);
const dir = new URL('04_video_app/', SALIDA);
fs.mkdirSync(dir, { recursive: true });
const FPS = 30, ANCHO = 780, ALTO = 1688, RELLENO = 1.0; // segundos de imagen fija al inicio y al final

const { browser, page } = await abrirApp({ escala: 2 });
const cdp = await page.createCDPSession();

async function grabar(nombre, preparar, accion) {
  await preparar();
  await indicadorDeToques(page);
  await esperar(500);
  const cuadros = [];
  const alRecibir = ({ data, metadata, sessionId }) => {
    cuadros.push({ t: metadata.timestamp, data });
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  };
  cdp.on('Page.screencastFrame', alRecibir);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: ANCHO, maxHeight: ALTO, everyNthFrame: 1 });
  await esperar(RELLENO * 1000);
  await accion();
  await esperar(RELLENO * 1000);
  await cdp.send('Page.stopScreencast');
  cdp.off('Page.screencastFrame', alRecibir);
  const fin = Date.now() / 1000;
  await codificar(nombre, cuadros, fin);
}

// Convierte los cuadros (que llegan solo cuando algo cambia) a 30 fps constantes y los codifica.
async function codificar(nombre, cuadros, fin) {
  const enc = await browser.newPage();
  await enc.goto(`${APP_URL}/favicon.ico`); // contexto seguro (localhost) para WebCodecs
  await enc.addScriptTag({ path: fileURLToPath(new URL('node_modules/mp4-muxer/build/mp4-muxer.js', import.meta.url)) });
  await enc.evaluate(() => { window.cuadros = []; });
  for (let i = 0; i < cuadros.length; i += 25) {
    await enc.evaluate((lote) => { window.cuadros.push(...lote); }, cuadros.slice(i, i + 25));
  }
  const base64 = await enc.evaluate(async (FPS, ANCHO, ALTO, fin) => {
    const c = window.cuadros;
    const t0 = c[0].t;
    const total = Math.ceil((fin - t0) * FPS);
    const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: 'avc', width: ANCHO, height: ALTO, frameRate: FPS }, fastStart: 'in-memory' });
    const encoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { throw e; } });
    encoder.configure({ codec: 'avc1.640033', width: ANCHO, height: ALTO, bitrate: 14e6, framerate: FPS, avc: { format: 'avc' } });
    const imagenes = new Map();
    const imagen = async (k) => {
      if (!imagenes.has(k)) {
        const blob = await (await fetch(`data:image/jpeg;base64,${c[k].data}`)).blob();
        imagenes.set(k, await createImageBitmap(blob, { resizeWidth: ANCHO, resizeHeight: ALTO }));
        if (imagenes.size > 8) { const [viejo] = imagenes.keys(); imagenes.get(viejo).close(); imagenes.delete(viejo); }
      }
      return imagenes.get(k);
    };
    let k = 0;
    for (let i = 0; i < total; i++) {
      const t = t0 + i / FPS;
      while (k + 1 < c.length && c[k + 1].t <= t) k++;
      const vf = new VideoFrame(await imagen(k), { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
      encoder.encode(vf, { keyFrame: i % FPS === 0 });
      vf.close();
      while (encoder.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 5));
    }
    await encoder.flush();
    muxer.finalize();
    const bytes = new Uint8Array(muxer.target.buffer);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }, FPS, ANCHO, ALTO, fin);
  await enc.close();
  const ruta = fileURLToPath(new URL(`${nombre}.mp4`, dir));
  fs.writeFileSync(ruta, Buffer.from(base64, 'base64'));
  const seg = (fin - cuadros[0].t).toFixed(1);
  console.log(`ok ${nombre}.mp4 · ${seg} s · ${cuadros.length} cuadros capturados · ${(fs.statSync(ruta).size / 1e6).toFixed(1)} MB`);
}

// Desplazamiento suave grabado cuadro por cuadro: se mueve la vista una fracción, se toma la foto
// y se repite. Así el video tiene 30 fps reales aunque Chrome sin interfaz no los entregue.
async function grabarDesplazamiento(nombre, preparar, { distancia, segundos, quietoAntes = 1.5, quietoDespues = 2 }) {
  await preparar();
  await esperar(800);
  const mover = (y) => page.evaluate((y) => {
    const lista = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 10
      && getComputedStyle(d).overflowY !== 'visible' && d.getBoundingClientRect().width > 0 && d.getBoundingClientRect().height > 300);
    const s = lista.find((d) => { const r = d.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('div') && d.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)); });
    if (s) { if (window.__y0 === undefined) window.__y0 = s.scrollTop; s.scrollTop = window.__y0 + y; }
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, y);
  await page.evaluate(() => { delete window.__y0; });
  const cuadros = [];
  const foto = async (t) => cuadros.push({ t, data: await page.screenshot({ type: 'jpeg', quality: 92, encoding: 'base64' }) });
  const n = Math.round(segundos * FPS);
  const suave = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2); // aceleración y frenado
  const tIni = RELLENO + quietoAntes;
  await foto(0);
  for (let i = 1; i <= n; i++) { await mover(distancia * suave(i / n)); await foto(tIni + i / FPS); }
  const fin = tIni + n / FPS + quietoDespues + RELLENO;
  await codificar(nombre, cuadros, fin);
}

// ---------- Clips ----------
await grabarDesplazamiento('01_inicio_resumen', async () => { await inicio(page); }, { distancia: 1250, segundos: 4.5 });

await grabar('02_de_cafes_a_lote',
  async () => { await inicio(page); await tocar(page, 'Cafés', 1500); },
  async () => {
    await esperar(800);
    await tocar(page, 'Chiapas Altura Selecta', 1800);
    await tocar(page, 'LT-2026-001', 1800);
  });

await grabarDesplazamiento('03_grafica_del_lote',
  async () => { await inicio(page); await tocar(page, 'Cafés'); await tocar(page, 'Chiapas Altura Selecta'); await tocar(page, 'LT-2026-001', 2000); },
  { distancia: 640, segundos: 3, quietoDespues: 3 });

await grabar('04_calibracion_en_vivo',
  async () => {
    await inicio(page); await tocar(page, 'Cafés'); await tocar(page, 'Chiapas Altura Selecta'); await tocar(page, 'LT-2026-001', 2000);
    await tocar(page, 'Nueva calibración', 2500);
    await subirA(page, '3 · RESULTADO DEL SHOT', 30);
  },
  async () => {
    await esperar(800);
    await escribir(page, 'Bebida', '36', 220);
    await escribir(page, 'Tiempo', '28', 220);
    await escribir(page, 'TDS', '9.2', 260);
    await esperar(2200);
    await escribir(page, 'TDS', '7.5', 260);   // subextraída: la app dice qué corregir
    await esperar(2200);
    await escribir(page, 'TDS', '9.2', 260);   // de vuelta a la zona ideal
    await esperar(1500);
  });

await browser.close();
