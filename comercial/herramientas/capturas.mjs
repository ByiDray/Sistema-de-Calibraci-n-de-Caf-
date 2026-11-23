// Capturas de la app a 1170 × 2532 (tamaño de un teléfono a 3x) en comercial/02_capturas,
// y mockups con marco de teléfono y fondo transparente en comercial/03_mockups.
// Requiere la API local y la app web corriendo (ver LEEME_EDITOR.md).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COLOR, FUENTES, MARCA, SALIDA } from './config.mjs';
import { abrirApp, buscar, desplazar, escribir, esperar, inicio, subirA, tocar } from './comun.mjs';

const dirCap = new URL('02_capturas/', SALIDA);
const dirMock = new URL('03_mockups/', SALIDA);
fs.mkdirSync(dirCap, { recursive: true });
fs.mkdirSync(dirMock, { recursive: true });

const { browser, page } = await abrirApp({ escala: 3 });
const foto = async (n) => { await esperar(700); await page.screenshot({ path: fileURLToPath(new URL(n + '.png', dirCap)) }); console.log('ok', n); };

await inicio(page);
await foto('01_inicio');
await desplazar(page, 1300);
await foto('02_inicio_ranking');

await tocar(page, 'Cafés');
await foto('03_mis_cafes');
await tocar(page, 'Chiapas Altura Selecta');
await foto('04_lotes_del_cafe');
await tocar(page, 'LT-2026-001');
await foto('05_detalle_lote');
await subirA(page, 'CALIBRACIONES (5)');
await foto('06_grafica_lote');

await subirA(page, 'NOTAS DE CATA', 400);
await tocar(page, 'Nueva calibración', 2000);
await foto('07_calibracion_inicio');
await escribir(page, 'Bebida', '36', 0);
await escribir(page, 'Tiempo', '28', 0);
await escribir(page, 'TDS', '9.2', 0);
await subirA(page, '3 · RESULTADO DEL SHOT', 30);
await foto('08_calibracion_en_vivo');
await escribir(page, 'TDS', '7.5', 0);
await subirA(page, '3 · RESULTADO DEL SHOT', 30);
await foto('09_calibracion_subextraida');

await tocar(page, 'Equipos');
await foto('10_equipos');
await browser.close();

// ---------- Mockups: la captura dentro de un teléfono genérico ----------
const { browser: b2, page: p2 } = await abrirApp({ escala: 1 });
const src = (n) => `data:image/png;base64,${fs.readFileSync(new URL(n + '.png', dirCap)).toString('base64')}`;
// La captura no trae barra de estado; se dibuja una (hora y batería) para que la muesca no tape la app.
const telefono = (n, ancho) => `<div style="width:${ancho}px;padding:${ancho * 0.035}px;background:#1b1512;box-sizing:border-box;
  border-radius:${ancho * 0.14}px;box-shadow:0 0 0 ${ancho * 0.008}px #3a2e28 inset;position:relative">
  <div style="border-radius:${ancho * 0.11}px;overflow:hidden;background:${COLOR.crema}">
    <div style="height:${ancho * 0.115}px;display:flex;align-items:center;justify-content:space-between;padding:0 ${ancho * 0.09}px;
      font:600 ${ancho * 0.036}px ${FUENTES.texto};color:${COLOR.texto}"><span>9:41</span><span style="letter-spacing:2px">▮▮▮ ▰</span></div>
    <img src="${src(n)}" style="width:100%;display:block"></div>
  <div style="position:absolute;top:${ancho * 0.055}px;left:50%;transform:translateX(-50%);width:${ancho * 0.28}px;height:${ancho * 0.075}px;background:#1b1512;border-radius:999px"></div></div>`;

async function mockup(nombre, html, w, h) {
  await p2.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p2.setContent(`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="${FUENTES.css}">
    <style>html,body{margin:0;background:transparent}</style>${html}`, { waitUntil: 'load', timeout: 60000 });
  await p2.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  await p2.screenshot({ path: fileURLToPath(new URL(nombre + '.png', dirMock)), omitBackground: true });
  console.log('ok', nombre);
}

for (const n of ['01_inicio', '03_mis_cafes', '06_grafica_lote', '08_calibracion_en_vivo', '09_calibracion_subextraida', '10_equipos']) {
  await mockup(`telefono_${n}`, `<div style="padding:40px">${telefono(n, 900)}</div>`, 980, Math.ceil(900 * 2532 / 1170 * 0.93 + 900 * 0.185) + 80);
}
// Marco vacío: la pantalla es transparente para poner debajo los videos de 04_video_app.
// Con un ancho de 900 px, la pantalla mide 837 × 1811 px y empieza en x = 71.5, y = 175 (ver LEEME_EDITOR.md).
{
  const W = 900, pad = W * 0.035, barra = W * 0.115, pantallaAlto = (W - 2 * pad) * 1688 / 780;
  await mockup('marco_telefono_vacio', `<div style="padding:40px"><div style="width:${W}px;box-sizing:border-box;border:${pad}px solid #1b1512;
    border-radius:${W * 0.14}px;position:relative">
    <div style="height:${barra}px;display:flex;align-items:center;justify-content:space-between;padding:0 ${W * 0.09 - pad}px;background:${COLOR.crema};
      border-radius:${W * 0.11}px ${W * 0.11}px 0 0;font:600 ${W * 0.036}px ${FUENTES.texto};color:${COLOR.texto}"><span>9:41</span><span style="letter-spacing:2px">▮▮▮ ▰</span></div>
    <div style="height:${pantallaAlto}px"></div>
    <div style="position:absolute;top:${W * 0.02}px;left:50%;transform:translateX(-50%);width:${W * 0.28}px;height:${W * 0.075}px;background:#1b1512;border-radius:999px"></div>
  </div></div>`, 980, Math.ceil(2 * pad + barra + pantallaAlto) + 80);
}
// Composición de tres teléfonos para el cierre o para miniaturas (1920 × 1080).
await mockup('trio_telefonos_1920x1080', `<div style="width:1920px;height:1080px;display:flex;align-items:center;justify-content:center;gap:60px">
  <div style="transform:rotate(-6deg) translateY(40px)">${telefono('01_inicio', 400)}</div>
  <div style="z-index:2">${telefono('08_calibracion_en_vivo', 440)}</div>
  <div style="transform:rotate(6deg) translateY(40px)">${telefono('06_grafica_lote', 400)}</div></div>`, 1920, 1080);
await b2.close();
console.log(`Listo · ${MARCA.nombre} · fondo ${COLOR.crema}`);
