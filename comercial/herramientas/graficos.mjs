// Gráficos de texto (PNG con transparencia) en 16:9 y 9:16, end cards, fondos y subtítulos SRT.
// Salida: comercial/05_graficos y comercial/06_audio/subtitulos.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { CHROME, COLOR, FUENTES, MARCA, SALIDA, isotipoSVG } from './config.mjs';
import { CORTES, ESCENAS } from './guion.mjs';

const FORMATOS = { '16x9': [1920, 1080], '9x16': [1080, 1920] };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();

async function png(ruta, html, [w, h], transparente = true) {
  const destino = new URL(ruta, SALIDA);
  fs.mkdirSync(new URL('./', destino), { recursive: true });
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="${FUENTES.css}">
    <style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${transparente ? 'transparent' : COLOR.crema}}</style>${html}`,
  { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  await page.screenshot({ path: fileURLToPath(destino), omitBackground: transparente });
  console.log('ok', ruta);
}

const iso = `data:image/svg+xml;base64,${Buffer.from(isotipoSVG()).toString('base64')}`;
const trio = fs.existsSync(new URL('03_mockups/trio_telefonos_1920x1080.png', SALIDA))
  ? `data:image/png;base64,${fs.readFileSync(new URL('03_mockups/trio_telefonos_1920x1080.png', SALIDA)).toString('base64')}` : null;

for (const [f, tam] of Object.entries(FORMATOS)) {
  const vertical = f === '9x16';
  const u = tam[0] / 1920 * (vertical ? 1.6 : 1); // escala tipográfica

  // Fondo liso de la marca
  await png(`05_graficos/${f}/fondo_crema.png`, '', tam, false);

  // E03: la pregunta, centrada
  const e03 = ESCENAS.find((e) => e.id === 'E03');
  await png(`05_graficos/${f}/E03_pregunta.png`, `<div style="height:100%;display:flex;align-items:center;justify-content:center;padding:0 ${120 * u}px;box-sizing:border-box">
    <div style="font:700 ${(vertical ? 150 : 112) * (tam[0] / 1920)}px/1.08 ${FUENTES.titulos};color:${COLOR.cafeOscuro};text-align:center;letter-spacing:-1px">${e03.super}</div></div>`, tam);

  // E05–E08: rótulos inferiores (pastilla crema con acento verde)
  for (const e of ESCENAS.filter((x) => x.super && x.tipo.startsWith('App'))) {
    const fs_ = (vertical ? 58 : 46);
    await png(`05_graficos/${f}/${e.id}_rotulo.png`, `<div style="position:absolute;left:${vertical ? 60 : 120}px;right:${vertical ? 60 : 'auto'};bottom:${vertical ? 260 : 110}px;
      display:flex;align-items:center;gap:22px;background:${COLOR.crema};border-radius:28px;padding:26px 40px;box-shadow:0 10px 40px rgba(43,29,20,.18)">
      <div style="width:10px;align-self:stretch;border-radius:6px;background:${COLOR.verde}"></div>
      <div style="font:700 ${fs_}px/1.15 ${FUENTES.texto};color:${COLOR.cafeOscuro}">${e.super}</div></div>`, tam);
  }

  // E10: end card completa (opaca) y solo el bloque de logo (transparente)
  const bloque = `<div style="display:flex;flex-direction:column;align-items:center;gap:${vertical ? 34 : 26}px">
      <div style="display:flex;align-items:center;gap:${vertical ? 34 : 30}px">
        <img src="${iso}" style="width:${vertical ? 190 : 150}px;height:${vertical ? 190 : 150}px">
        <span style="font:800 ${vertical ? 170 : 150}px/1 ${FUENTES.titulos};color:${COLOR.cafeOscuro};letter-spacing:-4px">${MARCA.nombre}</span></div>
      <div style="font:600 ${vertical ? 64 : 54}px/1.2 ${FUENTES.titulos};color:${COLOR.cafe};text-align:center">${MARCA.eslogan}</div>
      <div style="margin-top:${vertical ? 20 : 10}px;font:600 ${vertical ? 40 : 30}px ${FUENTES.texto};color:${COLOR.crema};background:${COLOR.cafe};border-radius:999px;padding:${vertical ? '22px 44px' : '16px 36px'}">${MARCA.cta}</div></div>`;
  await png(`05_graficos/${f}/E10_logo_y_cta.png`, `<div style="height:100%;display:flex;align-items:center;justify-content:center">${bloque}</div>`, tam);
  await png(`05_graficos/${f}/E10_end_card.png`, vertical
    ? `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px">${bloque}
        ${trio ? `<img src="${trio}" style="width:1300px;margin-top:40px">` : ''}</div>`
    : `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center">
        ${trio ? `<img src="${trio}" style="width:900px;margin:-70px 0 20px">` : ''}
        <div style="transform:scale(.78);transform-origin:top center;margin-bottom:-80px">${bloque}</div></div>`, tam, false);
}
await browser.close();

// ---------- Subtítulos SRT ----------
const hhmm = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
// Una línea por escena; se deja 0.2 s al inicio de cada escena para que el texto no aparezca antes que la imagen.
function srt(lineas) {
  return lineas.map((l, i) => `${i + 1}\n${hhmm(l.ini + 0.2)} --> ${hhmm(l.fin - 0.15)}\n${l.vo}\n`).join('\n');
}
const dirSub = new URL('06_audio/subtitulos/', SALIDA);
fs.mkdirSync(dirSub, { recursive: true });
fs.writeFileSync(new URL('subtitulos_60s.srt', dirSub), srt(ESCENAS));
for (const [nombre, corte] of Object.entries(CORTES)) {
  let t = 0;
  const lineas = corte.map((c) => { const l = { ini: t, fin: t + c.dur, vo: c.vo }; t += c.dur; return l; });
  fs.writeFileSync(new URL(`subtitulos_${nombre}.srt`, dirSub), srt(lineas));
}
console.log('ok subtítulos SRT (60s, 30s, 15s_vertical)');
