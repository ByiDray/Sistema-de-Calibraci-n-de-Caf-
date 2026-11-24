// Compone la música del video (100 BPM, Re mayor) siguiendo las placas de src/tiempos.json.
// Uso: node audio/musica.mjs  →  public/audio/musica.wav
import { readFileSync } from 'node:fs';
import { Pista, midiAHz, rhodes, cuerda, bajo, colchon, campana, bombo, chasquido, shaker, reverb, SR } from './sintesis.mjs';

const T = JSON.parse(readFileSync(new URL('../src/tiempos.json', import.meta.url)));
const BEAT = 60 / T.bpm;            // 0.6 s
const BAR = BEAT * 4;                // 2.4 s
const DUR = T.duracionCuadros / T.fps;
const seg = (compas, tiempo = 0) => compas * BAR + tiempo * BEAT;

// Acordes (MIDI). Voces del piano, nota del bajo y notas para el arpegio de guitarra.
const ACORDES = {
  D:  { piano: [50, 54, 57, 61], bajo: 38, arp: [62, 66, 69, 73, 69, 66, 62, 69] },
  Bm: { piano: [50, 54, 57, 59], bajo: 35, arp: [59, 62, 66, 69, 66, 62, 59, 66] },
  G:  { piano: [50, 55, 59, 66], bajo: 31, arp: [55, 62, 66, 71, 66, 62, 59, 62] },
  A:  { piano: [52, 57, 61, 64], bajo: 33, arp: [57, 61, 64, 69, 64, 61, 57, 64] },
};
const PROG = ['D', 'Bm', 'G', 'A'];
const acordeDe = (c) => (c >= 35 ? 'D' : PROG[(((c - 6) % 4) + 4) % 4]);

// Qué suena en cada compás, según la placa.
function seccion(c) {
  if (c < 4) return 'intro';        // P01
  if (c === 4) return 'pregunta';   // P02
  if (c === 5) return 'subida';
  if (c === 6) return 'logo';       // P03
  if (c < 9) return 'arranque';
  if (c < 22) return 'groove';      // P04–P06
  if (c < 26) return 'alto';        // P07: punto alto
  if (c < 31) return 'respira';     // P08
  if (c < 33) return 'pausa';       // P09
  if (c < 35) return 'final';       // P10
  return 'acorde';
}

const piano = new Pista(DUR), guitarra = new Pista(DUR), bajos = new Pista(DUR);
const bateria = new Pista(DUR), colchones = new Pista(DUR), melodia = new Pista(DUR);

// Melodía de cuatro compases (tiempo, nota, duración en tiempos) sobre D–Bm–G–A.
const FRASE = [
  [[0, 78, 1], [1, 81, 0.5], [1.5, 83, 0.5], [2, 81, 1], [3, 78, 1]],
  [[0, 74, 1], [1, 76, 0.5], [1.5, 78, 1.5], [3, 69, 1]],
  [[0, 71, 1], [1, 74, 0.5], [1.5, 76, 0.5], [2, 74, 1], [3, 71, 1]],
  [[0, 73, 1.5], [1.5, 76, 0.5], [2, 81, 2]],
];

let semilla = 11;
const compases = Math.ceil(DUR / BAR);
for (let c = 0; c < compases; c++) {
  const s = seccion(c);
  const A = ACORDES[acordeDe(c)];
  const t0 = seg(c);

  // Piano eléctrico
  if (['intro', 'pregunta', 'pausa'].includes(s)) {
    A.piano.forEach((m, k) => piano.sumar(t0 + k * 0.03, rhodes(midiAHz(m), BAR * 0.95, 0.55), 0.22, -0.3 + k * 0.2));
  } else if (s === 'logo' || s === 'acorde') {
    const dur = s === 'acorde' ? DUR - t0 : BAR;
    A.piano.concat([A.piano[0] + 12]).forEach((m, k) => piano.sumar(t0 + k * 0.015, rhodes(midiAHz(m), dur, 0.8), 0.24, -0.4 + k * 0.2));
  } else if (s !== 'subida') {
    // Comping: tiempo 1, el "y" del 2 y el 4.
    for (const [b, d, v] of [[0, 1.2, 0.75], [1.5, 0.45, 0.5], [3, 0.8, 0.6]]) {
      A.piano.forEach((m, k) => piano.sumar(seg(c, b) + k * 0.01, rhodes(midiAHz(m), d * BEAT, v), 0.2, -0.3 + k * 0.2));
    }
  }

  // Colchón de cuerdas
  if (['intro', 'logo', 'alto', 'final', 'acorde', 'pausa'].includes(s)) {
    const dur = s === 'acorde' ? DUR - t0 - 1 : BAR;
    const v = s === 'intro' || s === 'pausa' ? 0.5 : 0.75;
    [A.bajo + 12, A.piano[1], A.piano[2] + 12].forEach((m, k) => colchones.sumar(t0, colchon(midiAHz(m), dur, v, s === 'intro' ? 1.2 : 0.4), 0.12, -0.5 + k * 0.5));
  }

  // Guitarra (cuerda pulsada) en corcheas
  if (['intro', 'pausa'].includes(s)) {
    [0, 2, 3.5].forEach((b, k) => guitarra.sumar(seg(c, b), cuerda(midiAHz(A.arp[k * 2]), BEAT * 1.5, 0.7, 0.45, semilla++), 0.35, 0.35));
  } else if (['groove', 'alto', 'respira', 'final', 'arranque'].includes(s)) {
    A.arp.forEach((m, k) => {
      const acento = k % 2 === 0 ? 0.8 : 0.55;
      guitarra.sumar(seg(c, k * 0.5) + (k % 2 ? 0.012 : 0), cuerda(midiAHz(m), BEAT * 0.7, acento, 0.5, semilla++), 0.3, 0.35);
    });
  } else if (s === 'acorde') {
    A.arp.slice(0, 5).forEach((m, k) => guitarra.sumar(t0 + k * 0.045, cuerda(midiAHz(m), DUR - t0, 0.8, 0.5, semilla++), 0.32, 0.3));
  }

  // Bajo
  if (['arranque', 'groove', 'alto', 'respira', 'final'].includes(s)) {
    const f = midiAHz(A.bajo);
    [[0, 1.4], [1.5, 0.45], [2, 1], [3.5, 0.45]].forEach(([b, d], k) =>
      bajos.sumar(seg(c, b), bajo(k === 3 ? f * 2 : f, d * BEAT, k === 0 ? 1 : 0.75), 0.5));
  } else if (s === 'logo' || s === 'acorde') {
    bajos.sumar(t0, bajo(midiAHz(A.bajo), s === 'acorde' ? 3.5 : BAR, 1), 0.5);
  }

  // Batería suave (bombo, chasquido, shaker)
  const conBombo = ['groove', 'alto', 'final'].includes(s) || (s === 'arranque' && c === 8) || s === 'respira';
  if (conBombo) {
    const vb = s === 'respira' ? 0.6 : 1;
    bateria.sumar(seg(c, 0), bombo(vb), 0.55);
    bateria.sumar(seg(c, 2), bombo(vb * 0.85), 0.55);
    if (s !== 'respira') bateria.sumar(seg(c, 2.5), bombo(0.5), 0.45);
  }
  if (['groove', 'alto', 'final'].includes(s)) {
    bateria.sumar(seg(c, 1), chasquido(0.9, semilla++), 0.4, -0.1);
    bateria.sumar(seg(c, 3), chasquido(0.9, semilla++), 0.4, -0.1);
  }
  if (['intro', 'arranque', 'groove', 'alto', 'respira', 'final'].includes(s) && !(s === 'intro' && c < 2)) {
    for (let k = 0; k < 8; k++) {
      const v = (k % 2 ? 0.5 : 0.85) * (s === 'intro' ? 0.5 : 1);
      bateria.sumar(seg(c, k * 0.5) + (k % 2 ? 0.018 : 0), shaker(v, semilla++), 0.22, 0.45);
    }
  }

  // Melodía de campana en el punto alto y en el cierre
  if (s === 'alto' || s === 'final') {
    const fr = FRASE[(((c - 6) % 4) + 4) % 4];
    fr.forEach(([b, m, d]) => melodia.sumar(seg(c, b), campana(midiAHz(m), d * BEAT, 0.7, 2.6), 0.16, -0.25));
  }
}

// Subida (compás 5): colchón que crece con un barrido, rumbo al logo.
{
  const t0 = seg(5);
  [62, 66, 69].forEach((m, k) => colchones.sumar(t0, colchon(midiAHz(m), BAR, 0.9, BAR * 0.9), 0.14, -0.5 + k * 0.5));
}

// Mezcla
reverb(piano, { mezcla: 0.28, tamano: 1.1 });
reverb(guitarra, { mezcla: 0.22 });
reverb(melodia, { mezcla: 0.4, tamano: 1.3 });
reverb(colchones, { mezcla: 0.35, tamano: 1.3 });
reverb(bateria, { mezcla: 0.12, tamano: 0.7 });

const mezcla = new Pista(DUR);
mezcla.sumarPista(piano, 1);
mezcla.sumarPista(guitarra, 0.9);
mezcla.sumarPista(bajos, 0.95);
mezcla.sumarPista(bateria, 0.85);
mezcla.sumarPista(colchones, 0.8);
mezcla.sumarPista(melodia, 1);
mezcla.normalizar(-1.5);
mezcla.saturar(1.15);
mezcla.fundido(DUR - 1.6, DUR - 0.05);
mezcla.normalizar(-2);
mezcla.guardar(new URL('../public/audio/musica.wav', import.meta.url));
console.log(`musica.wav · ${DUR.toFixed(1)} s · ${T.bpm} BPM · ${SR} Hz`);
