// Genera los recursos de marca en comercial/01_marca: isotipo, logotipo y paleta (SVG y PNG con fondo transparente).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { CHROME, COLOR, FUENTES, MARCA, SALIDA, isotipoSVG } from './config.mjs';

const dir = new URL('01_marca/', SALIDA);
fs.mkdirSync(dir, { recursive: true });
const guardar = (n, t) => fs.writeFileSync(new URL(n, dir), t);

guardar('isotipo.svg', isotipoSVG());
guardar('isotipo_claro.svg', isotipoSVG({ fondo: COLOR.crema, trazo: COLOR.cafe, ideal: COLOR.verde }));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();

async function png(nombre, html, ancho, alto) {
  await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="${FUENTES.css}">
    <style>html,body{margin:0;background:transparent}</style>${html}`, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  await page.screenshot({ path: fileURLToPath(new URL(nombre, dir)), omitBackground: true });
  console.log('ok', nombre);
}

const iso = (o) => `data:image/svg+xml;base64,${Buffer.from(isotipoSVG(o)).toString('base64')}`;
const logo = (colorTexto, o) => `<div style="display:flex;align-items:center;gap:56px;height:100%;padding:0 40px">
  <img src="${iso(o)}" style="width:300px;height:300px">
  <span style="font:800 230px/1 ${FUENTES.titulos};color:${colorTexto};letter-spacing:-6px">${MARCA.nombre}</span></div>`;

await png('isotipo_1024.png', `<img src="${iso()}" style="width:1024px;height:1024px;display:block">`, 1024, 1024);
await png('icono_app_1024.png', `<img src="${iso({ radio: 0 })}" style="width:1024px;height:1024px;display:block">`, 1024, 1024);
await png('logo_horizontal_oscuro.png', logo(COLOR.cafeOscuro), 1500, 380);
await png('logo_horizontal_claro.png', logo(COLOR.crema, { fondo: COLOR.crema, trazo: COLOR.cafe, ideal: COLOR.verde }), 1500, 380);
await png('logo_vertical_oscuro.png', `<div style="display:flex;flex-direction:column;align-items:center;gap:40px;padding-top:40px">
  <img src="${iso()}" style="width:460px;height:460px"><span style="font:800 200px/1 ${FUENTES.titulos};color:${COLOR.cafeOscuro};letter-spacing:-5px">${MARCA.nombre}</span>
  <span style="font:500 64px/1 ${FUENTES.texto};color:${COLOR.textoSuave}">${MARCA.eslogan}</span></div>`, 1100, 900);

const muestras = [['Café', COLOR.cafe], ['Café oscuro', COLOR.cafeOscuro], ['Crema', COLOR.crema], ['Crema suave', COLOR.cremaSuave],
  ['Equilibrada', COLOR.verde], ['Subextraída', COLOR.ambar], ['Sobreextraída', COLOR.rojo], ['Texto suave', COLOR.textoSuave]];
await png('paleta.png', `<div style="background:${COLOR.blanco};padding:60px;font-family:${FUENTES.texto};width:1800px;box-sizing:border-box">
  <div style="font:700 56px ${FUENTES.titulos};color:${COLOR.texto};margin-bottom:8px">${MARCA.nombre} · paleta y tipografía</div>
  <div style="font:500 26px ${FUENTES.texto};color:${COLOR.textoSuave};margin-bottom:40px">Títulos: ${FUENTES.titulos} 700–800 · Texto: ${FUENTES.texto} 400–700 (Google Fonts, OFL)</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:28px">${muestras.map(([n, c]) => `<div>
    <div style="height:180px;border-radius:24px;background:${c};border:2px solid #E4DAD0"></div>
    <div style="font:700 28px ${FUENTES.texto};color:${COLOR.texto};margin-top:14px">${n}</div>
    <div style="font:500 24px ${FUENTES.texto};color:${COLOR.textoSuave}">${c}</div></div>`).join('')}</div></div>`, 1800, 760);

await browser.close();
