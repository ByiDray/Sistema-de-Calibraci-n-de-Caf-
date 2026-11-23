// Utilidades para manejar la app web (Expo en modo web) desde Chrome sin interfaz.
import puppeteer from 'puppeteer-core';
import { APP_URL, CHROME } from './config.mjs';

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export async function abrirApp({ escala = 3 } = {}) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: escala, isMobile: true });
  return { browser, page };
}

// Busca un elemento por su texto exacto (el más interno), lo centra en pantalla y devuelve sus coordenadas.
export async function buscar(page, texto, { timeout = 60000, centrar = true } = {}) {
  const fin = Date.now() + timeout;
  while (Date.now() < fin) {
    const p = await page.evaluate((t, centrar) => {
      // Las pantallas de otras pestañas siguen en el DOM; solo vale el elemento que de verdad recibe el toque.
      const v = [...document.querySelectorAll('div,span')].filter((e) => e.textContent.trim() === t && e.getBoundingClientRect().width > 0
        && ![...e.children].some((c) => c.textContent.trim() === t));
      for (const el of v) {
        if (centrar) el.scrollIntoView({ block: 'center' });
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        const tocado = document.elementFromPoint(x, y);
        if (tocado && (el.contains(tocado) || tocado.contains(el))) return { x, y };
      }
      return null;
    }, texto, centrar);
    if (p) return p;
    await esperar(300);
  }
  throw new Error('No apareció: ' + texto);
}

export async function tocar(page, texto, pausa = 1200) {
  const { x, y } = await buscar(page, texto);
  await page.mouse.move(x, y, { steps: 8 });
  await page.mouse.click(x, y);
  await esperar(pausa);
}

export async function inicio(page) {
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await buscar(page, 'Lotes activos', { centrar: false });
  await esperar(1500);
}

// Desplazamiento suave con la rueda, como lo haría una persona.
export async function desplazar(page, total, { x = 195, y = 420, paso = 40, pausa = 16 } = {}) {
  await page.mouse.move(x, y);
  const n = Math.round(Math.abs(total) / paso);
  for (let i = 0; i < n; i++) { await page.mouse.wheel({ deltaY: Math.sign(total) * paso }); await esperar(pausa); }
  await esperar(400);
}

// Lleva a la parte superior de la pantalla el elemento con ese texto.
export async function subirA(page, texto, margen = 90) {
  await page.evaluate((t, m) => {
    const el = [...document.querySelectorAll('div')].find((e) => e.textContent.trim() === t && e.children.length === 0);
    if (!el) return;
    let p = el.parentElement;
    while (p && !(p.scrollHeight > p.clientHeight + 10 && getComputedStyle(p).overflowY !== 'visible')) p = p.parentElement;
    if (p) p.scrollTop += el.getBoundingClientRect().top - m;
  }, texto, margen);
  await esperar(600);
}

// Escribe en un campo identificado por su etiqueta accesible, letra por letra.
export async function escribir(page, etiqueta, valor, retraso = 140) {
  const sel = `input[aria-label="${etiqueta}"], textarea[aria-label="${etiqueta}"]`;
  await page.waitForSelector(sel, { timeout: 15000 });
  const r = await page.$eval(sel, (el) => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  await page.mouse.move(r.x, r.y, { steps: 10 });
  await page.click(sel, { clickCount: 3 });
  await esperar(250);
  await page.type(sel, valor, { delay: retraso });
  await esperar(500);
}

// Muestra un círculo donde se toca la pantalla, para que en el video se vea la interacción.
export async function indicadorDeToques(page) {
  await page.evaluate(() => {
    const css = document.createElement('style');
    css.textContent = `.toque{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;
      background:rgba(91,58,41,.28);border:2px solid rgba(91,58,41,.55);pointer-events:none;z-index:99999;
      animation:toque .55s ease-out forwards}@keyframes toque{from{transform:scale(.5);opacity:1}to{transform:scale(1.4);opacity:0}}`;
    document.head.appendChild(css);
    window.addEventListener('pointerdown', (e) => {
      const d = document.createElement('div'); d.className = 'toque';
      d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
      document.body.appendChild(d); setTimeout(() => d.remove(), 600);
    }, true);
  });
}
