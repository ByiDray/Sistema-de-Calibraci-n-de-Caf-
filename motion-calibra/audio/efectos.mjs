// Genera los efectos de sonido del video en public/audio/sfx_*.wav
// Uso: node audio/efectos.mjs
import { Pista, SR, biquad, lpVariable, crearRuido, campana, reverb, midiAHz } from './sintesis.mjs';

const ruta = (n) => new URL(`../public/audio/${n}.wav`, import.meta.url);
const tono = (dur, fn) => { const y = new Float32Array(Math.ceil(dur * SR)); for (let i = 0; i < y.length; i++) y[i] = fn(i / SR); return y; };
const ruido = (dur, semilla) => { const r = crearRuido(semilla); return tono(dur, () => r()); };

function guardar(nombre, dur, armar, { rev = 0, db = -3 } = {}) {
  const p = new Pista(dur);
  armar(p);
  if (rev) reverb(p, { mezcla: rev, tamano: 0.9 });
  p.normalizar(db);
  p.guardar(ruta(nombre));
  console.log(`sfx_${nombre.replace('sfx_', '')}.wav · ${dur} s`);
}

// Barrido de aire para los cambios de placa.
guardar('sfx_whoosh', 0.9, (p) => {
  const x = ruido(0.9, 21);
  const env = tono(0.9, (t) => Math.sin(Math.PI * Math.min(1, t / 0.75)) ** 2);
  const a = lpVariable(x.map((v, i) => v * env[i]), 400, 5200, 1.4);
  const b = lpVariable(ruido(0.9, 22).map((v, i) => v * env[i]), 450, 4800, 1.4);
  p.sumar(0, a, 1, -0.6); p.sumar(0, b, 1, 0.6);
});

// "Tic" de la aguja al llegar a la zona verde: clic seco + resonancia metálica corta.
guardar('sfx_tic', 0.7, (p) => {
  p.sumar(0, biquad(ruido(0.02, 61).map((v, i) => v * Math.exp(-(i / SR) * 400)), 'hp', 2500), 0.9);
  p.sumar(0, tono(0.7, (t) => Math.sin(2 * Math.PI * 2093 * t) * Math.exp(-t * 18) * 0.5 + Math.sin(2 * Math.PI * 3136 * t) * Math.exp(-t * 26) * 0.3), 0.8);
}, { rev: 0.25 });

// Golpe suave y grave para el revelado del logo.
guardar('sfx_impacto', 2.2, (p) => {
  let fase = 0;
  p.sumar(0, tono(2.2, (t) => { fase += (2 * Math.PI * (38 + 70 * Math.exp(-t * 10))) / SR; return Math.sin(fase) * Math.exp(-t * 2.2); }), 1);
  p.sumar(0, biquad(ruido(0.6, 31).map((v, i) => v * Math.exp(-(i / SR) * 9)), 'lp', 900), 0.35);
}, { rev: 0.35 });

// "Pop" de burbuja cuando el panel cambia de color: verde (sube) y ámbar (baja).
const pop = (de, a) => (p) => {
  let fase = 0;
  p.sumar(0, tono(0.35, (t) => { const f = de * (a / de) ** Math.min(1, t / 0.07); fase += (2 * Math.PI * f) / SR; return Math.sin(fase) * Math.exp(-t * 22); }), 1);
  p.sumar(0, campana(a * 2, 0.05, 0.25, 9), 1);
};
guardar('sfx_pop_verde', 0.6, pop(420, 980), { rev: 0.18 });
guardar('sfx_pop_ambar', 0.6, pop(760, 360), { rev: 0.18 });

// Tecla suave (tecleo en el teléfono).
guardar('sfx_tecla', 0.12, (p) => {
  p.sumar(0, biquad(ruido(0.12, 41).map((v, i) => v * Math.exp(-(i / SR) * 90)), 'bp', 3200, 1.2), 1);
  p.sumar(0, tono(0.12, (t) => Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 70) * 0.5), 1);
}, { db: -6 });

// Toque de interfaz (tap).
guardar('sfx_toque', 0.25, (p) => {
  p.sumar(0, tono(0.25, (t) => Math.sin(2 * Math.PI * 1320 * t) * Math.exp(-t * 45) * 0.7 + Math.sin(2 * Math.PI * 660 * t) * Math.exp(-t * 30) * 0.4), 1);
}, { rev: 0.15, db: -6 });

// Campanita para revelar el EY.
guardar('sfx_ding', 2.0, (p) => {
  p.sumar(0, campana(midiAHz(86), 0.2, 1, 2.5), 0.8, -0.2);
  p.sumar(0.06, campana(midiAHz(93), 0.2, 0.7, 3), 0.6, 0.2);
}, { rev: 0.3 });

// Bloque de madera para cada barra de la gráfica (afinado en Re mayor).
for (const [i, m] of [[1, 74], [2, 76], [3, 78], [4, 81], [5, 86]]) {
  guardar(`sfx_madera_${i}`, 0.35, (p) => {
    const f = midiAHz(m);
    p.sumar(0, tono(0.35, (t) => (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 30)) * Math.exp(-t * 28)), 1);
  }, { rev: 0.15, db: -4 });
}

// Subida de ruido filtrado antes del logo y antes del cierre.
guardar('sfx_subida', 2.4, (p) => {
  const env = tono(2.4, (t) => (t / 2.4) ** 2.2 * (t > 2.32 ? Math.max(0, 1 - (t - 2.32) / 0.08) : 1));
  p.sumar(0, lpVariable(ruido(2.4, 51).map((v, i) => v * env[i]), 300, 7000, 2), 1, -0.4);
  p.sumar(0, lpVariable(ruido(2.4, 52).map((v, i) => v * env[i]), 320, 6500, 2), 1, 0.4);
});

// Brillo final: arpegio de campanas para el cierre.
guardar('sfx_brillo', 3.0, (p) => {
  [74, 78, 81, 86, 90].forEach((m, k) => p.sumar(k * 0.07, campana(midiAHz(m), 0.2, 0.8, 2.2), 0.5, -0.6 + k * 0.3));
}, { rev: 0.4 });
