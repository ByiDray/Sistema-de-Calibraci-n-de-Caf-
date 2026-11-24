// Pequeña caja de herramientas de síntesis de audio, sin dependencias.
// Todo el sonido del video sale de aquí: osciladores, envolventes, filtros, ruido y reverberación.
import { writeFileSync } from 'node:fs';

export const SR = 48000;
export const midiAHz = (m) => 440 * 2 ** ((m - 69) / 12);

// Ruido pseudoaleatorio con semilla, para que cada render suene idéntico.
export function crearRuido(semilla = 1) {
  let s = semilla >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return (s / 4294967296) * 2 - 1;
  };
}

export class Pista {
  constructor(segundos) {
    this.n = Math.ceil(segundos * SR);
    this.L = new Float32Array(this.n);
    this.R = new Float32Array(this.n);
  }
  // Suma una señal mono con paneo (-1 izquierda … 1 derecha).
  sumar(inicioSeg, muestras, ganancia = 1, pan = 0) {
    const i0 = Math.round(inicioSeg * SR);
    const gl = ganancia * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = ganancia * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < muestras.length; i++) {
      const j = i0 + i;
      if (j < 0 || j >= this.n) continue;
      this.L[j] += muestras[i] * gl;
      this.R[j] += muestras[i] * gr;
    }
  }
  sumarPista(otra, ganancia = 1) {
    for (let i = 0; i < this.n; i++) { this.L[i] += otra.L[i] * ganancia; this.R[i] += otra.R[i] * ganancia; }
  }
  pico() {
    let p = 0;
    for (let i = 0; i < this.n; i++) p = Math.max(p, Math.abs(this.L[i]), Math.abs(this.R[i]));
    return p;
  }
  normalizar(dbfs = -3) {
    const p = this.pico() || 1;
    const g = 10 ** (dbfs / 20) / p;
    for (let i = 0; i < this.n; i++) { this.L[i] *= g; this.R[i] *= g; }
  }
  // Saturación suave para "pegar" la mezcla sin que truene.
  saturar(drive = 1.2) {
    const k = Math.tanh(drive);
    for (let i = 0; i < this.n; i++) { this.L[i] = Math.tanh(this.L[i] * drive) / k; this.R[i] = Math.tanh(this.R[i] * drive) / k; }
  }
  fundido(inicioSeg, finSeg) {
    const a = Math.round(inicioSeg * SR), b = Math.min(this.n, Math.round(finSeg * SR));
    for (let i = a; i < this.n; i++) {
      const g = i >= b ? 0 : 1 - (i - a) / (b - a);
      const c = g * g;
      this.L[i] *= c; this.R[i] *= c;
    }
  }
  guardar(ruta) {
    const canales = 2, bytes = 2;
    const datos = Buffer.alloc(this.n * canales * bytes);
    for (let i = 0; i < this.n; i++) {
      datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, this.L[i])) * 32767), i * 4);
      datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, this.R[i])) * 32767), i * 4 + 2);
    }
    const h = Buffer.alloc(44);
    h.write('RIFF', 0); h.writeUInt32LE(36 + datos.length, 4); h.write('WAVE', 8);
    h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(canales, 22);
    h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * canales * bytes, 28); h.writeUInt16LE(canales * bytes, 32);
    h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(datos.length, 40);
    writeFileSync(ruta, Buffer.concat([h, datos]));
  }
}

// Filtro biquad (RBJ). tipo: 'lp' | 'hp' | 'bp'
export function biquad(x, tipo, f, q = 0.707) {
  const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
  const a = Math.sin(w) / (2 * q), c = Math.cos(w);
  let b0, b1, b2;
  if (tipo === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
  else if (tipo === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
  else { b0 = a; b1 = 0; b2 = -a; }
  const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}

// Filtro con frecuencia de corte que cambia en el tiempo (para barridos).
export function lpVariable(x, fDe, fA, q = 0.9) {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / x.length;
    const f = fDe * (fA / fDe) ** t;
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
    const a = Math.sin(w) / (2 * q), c = Math.cos(w);
    const b0 = (1 - c) / 2, b1 = 1 - c, b2 = b0, a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}

// Envolvente ADSR (segundos). "sostenido" es la duración de la nota antes de soltarla.
export function adsr(t, sostenido, { a = 0.005, d = 0.3, s = 0.5, r = 0.3 } = {}) {
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < sostenido) return s;
  const tr = t - sostenido;
  return tr < r ? s * (1 - tr / r) : 0;
}

// Piano eléctrico por FM (tipo Rhodes): cálido y redondo.
export function rhodes(f, dur, vel = 1) {
  const len = Math.ceil((dur + 1.2) * SR);
  const y = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const idx = 0.25 + 1.6 * Math.exp(-t * 3.5) * vel;
    const mod = Math.sin(2 * Math.PI * f * t) * idx;
    const tine = Math.sin(2 * Math.PI * f * 14 * t) * Math.exp(-t * 40) * 0.12 * vel;
    const env = Math.exp(-t * 0.9) * (t < 0.004 ? t / 0.004 : 1) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.35) : 1);
    y[i] = (Math.sin(2 * Math.PI * f * t + mod) + tine) * env * vel;
  }
  return y;
}

// Cuerda pulsada (Karplus-Strong): suena a guitarra acústica.
export function cuerda(f, dur, vel = 1, brillo = 0.5, semilla = 7) {
  const rnd = crearRuido(semilla);
  const N = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(N);
  let prev = 0;
  for (let i = 0; i < N; i++) { const r = rnd(); prev = prev + brillo * (r - prev); buf[i] = prev; }
  const len = Math.ceil((dur + 0.6) * SR);
  const y = new Float32Array(len);
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const a = buf[idx], b = buf[(idx + 1) % N];
    const v = 0.4985 * (a + b);
    buf[idx] = v; y[i] = a;
    idx = (idx + 1) % N;
  }
  const t0 = dur * SR;
  for (let i = 0; i < len; i++) {
    const env = i < t0 ? 1 : Math.max(0, 1 - (i - t0) / (0.25 * SR));
    y[i] *= env * vel;
  }
  return biquad(y, 'lp', 3800);
}

export function bajo(f, dur, vel = 1) {
  const len = Math.ceil((dur + 0.25) * SR);
  const y = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = adsr(t, dur, { a: 0.008, d: 0.4, s: 0.6, r: 0.18 });
    y[i] = (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) + 0.12 * Math.sin(6 * Math.PI * f * t)) * env * vel;
  }
  return biquad(y, 'lp', 900);
}

// Colchón de cuerdas: sierras desafinadas, filtradas y con ataque lento.
export function colchon(f, dur, vel = 1, ataque = 0.8) {
  const len = Math.ceil((dur + 1.5) * SR);
  const y = new Float32Array(len);
  const det = [-0.11, 0.0, 0.09];
  const fase = [0, 0.33, 0.71];
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    let v = 0;
    for (let k = 0; k < 3; k++) {
      const fk = f * 2 ** (det[k] / 12);
      const p = (fk * t + fase[k]) % 1;
      v += 2 * p - 1;
    }
    const env = adsr(t, dur, { a: ataque, d: 0.5, s: 0.85, r: 1.4 });
    y[i] = (v / 3) * env * vel;
  }
  return biquad(biquad(y, 'lp', 1400), 'lp', 2200);
}

// Campanita por FM (relación inarmónica), para la melodía y los "ding".
export function campana(f, dur, vel = 1, decaimiento = 2.2) {
  const len = Math.ceil((dur + 2) * SR);
  const y = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const mod = Math.sin(2 * Math.PI * f * 3.5 * t) * 1.2 * Math.exp(-t * 6);
    const env = Math.exp(-t * decaimiento) * (t < 0.002 ? t / 0.002 : 1);
    y[i] = (Math.sin(2 * Math.PI * f * t + mod) * 0.8 + Math.sin(2 * Math.PI * f * 2 * t) * 0.2 * Math.exp(-t * 5)) * env * vel;
  }
  return y;
}

export function bombo(vel = 1) {
  const len = Math.ceil(0.45 * SR);
  const y = new Float32Array(len);
  let fase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = 44 + 90 * Math.exp(-t * 32);
    fase += (2 * Math.PI * f) / SR;
    y[i] = Math.sin(fase) * Math.exp(-t * 9) * vel;
  }
  return y;
}

export function ruidoEnv(dur, semilla, decay, vel = 1) {
  const rnd = crearRuido(semilla);
  const len = Math.ceil(dur * SR);
  const y = new Float32Array(len);
  for (let i = 0; i < len; i++) { const t = i / SR; y[i] = rnd() * Math.exp(-t * decay) * (t < 0.001 ? t / 0.001 : 1) * vel; }
  return y;
}

// Chasquido de dedos / aro: ruido de banda media muy corto.
export function chasquido(vel = 1, semilla = 3) {
  return biquad(biquad(ruidoEnv(0.18, semilla, 38, vel), 'bp', 1900, 1.1), 'hp', 500);
}
export function shaker(vel = 1, semilla = 5) {
  return biquad(ruidoEnv(0.09, semilla, 60, vel), 'hp', 6000);
}

// Reverberación Schroeder estéreo (4 peines + 2 pasatodos por canal).
export function reverb(pista, { mezcla = 0.25, tamano = 1, amort = 0.35 } = {}) {
  const proc = (x, desp) => {
    const combs = [1557, 1617, 1491, 1422].map((d) => Math.round((d + desp) * tamano));
    const out = new Float32Array(x.length);
    for (const d of combs) {
      const b = new Float32Array(d); let k = 0, lp = 0;
      for (let i = 0; i < x.length; i++) {
        const v = b[k];
        lp = v * (1 - amort) + lp * amort;
        b[k] = x[i] + lp * 0.84;
        out[i] += v * 0.25;
        k = (k + 1) % d;
      }
    }
    for (const d of [225 + desp, 556 + desp]) {
      const b = new Float32Array(d); let k = 0;
      for (let i = 0; i < x.length; i++) {
        const bv = b[k];
        const v = -out[i] + bv;
        b[k] = out[i] + bv * 0.5;
        out[i] = v;
        k = (k + 1) % d;
      }
    }
    return out;
  };
  const wl = proc(pista.L, 0), wr = proc(pista.R, 23);
  for (let i = 0; i < pista.n; i++) {
    pista.L[i] = pista.L[i] * (1 - mezcla) + wl[i] * mezcla;
    pista.R[i] = pista.R[i] * (1 - mezcla) + wr[i] * mezcla;
  }
}
