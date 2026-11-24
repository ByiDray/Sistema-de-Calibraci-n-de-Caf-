import { Easing, interpolate } from 'remotion';
import T from './tiempos.json';

// Ritmo de la música: 100 BPM a 30 fps → un tiempo = 18 cuadros, un compás = 72.
export const TIEMPO = T.cuadrosPorTiempo;
export const COMPAS = T.cuadrosPorCompas;

export const SALIDA_SUAVE = Easing.bezier(0.16, 1, 0.3, 1);
export const ENTRADA_SALIDA = Easing.bezier(0.65, 0, 0.35, 1);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Progreso 0→1 entre dos cuadros con salida suave.
export const prog = (frame: number, desde: number, dur: number, easing = SALIDA_SUAVE) =>
  interpolate(frame, [desde, desde + dur], [0, 1], { ...clamp, easing });

// Entrada típica de un elemento: aparece y sube unos píxeles.
export const entrada = (frame: number, desde: number, dur = 18, distancia = 40) => {
  const p = prog(frame, desde, dur);
  return { opacity: p, translate: `0px ${(1 - p) * distancia}px` };
};

// Salida de placa: todo se desvanece y sube un poco en los últimos cuadros.
export const salida = (frame: number, total: number, dur = 12) => {
  const p = interpolate(frame, [total - dur, total], [0, 1], { ...clamp, easing: ENTRADA_SALIDA });
  return { opacity: 1 - p, translate: `0px ${-p * 30}px` };
};

export const placa = (id: string) => {
  const p = T.placas.find((x) => x.id === id)!;
  return { from: p.compas * COMPAS, durationInFrames: Math.round(p.compases * COMPAS), nombre: `${p.id} · ${p.nombre}` };
};
