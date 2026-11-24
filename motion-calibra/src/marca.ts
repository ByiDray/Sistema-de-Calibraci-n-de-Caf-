// Marca de Calibra: tomada de comercial/herramientas/config.mjs (que a su vez sale de apps/mobile/src/tema.ts).
import { loadFont as cargarFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as cargarInter } from '@remotion/google-fonts/Inter';

export const MARCA = {
  nombre: 'Calibra',
  eslogan: 'Cada shot, en su punto.',
  cta: 'Disponible pronto en iOS y Android',
};

export const COLOR = {
  cafe: '#5B3A29',
  cafeOscuro: '#2B1D14',
  crema: '#F7F3EE',
  cremaSuave: '#EFE4DA',
  blanco: '#FFFFFF',
  verde: '#2E7D4F',
  verdeSuave: '#E3F2E8',
  verdeIsotipo: '#5FBF84',
  ambar: '#9A5B00',
  ambarSuave: '#FFF1DC',
  rojo: '#B3261E',
  rojoSuave: '#FBE4E2',
  textoSuave: '#7A6A5E',
  textoTenue: '#A3958A',
  borde: '#E4DAD0',
  bordeFuerte: '#CDBFB2',
} as const;

export const { fontFamily: FRAUNCES } = cargarFraunces('normal', { weights: ['600', '700', '800'], subsets: ['latin'] });
export const { fontFamily: INTER } = cargarInter('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] });

// Diagnóstico de extracción, igual que DIAGNOSTICO en apps/mobile/src/tema.ts.
export const DIAGNOSTICO = {
  EQUILIBRADA: { etiqueta: 'Equilibrada', fg: COLOR.verde, bg: COLOR.verdeSuave },
  SUBEXTRAIDA: { etiqueta: 'Subextraída', fg: COLOR.ambar, bg: COLOR.ambarSuave },
  SOBREEXTRAIDA: { etiqueta: 'Sobreextraída', fg: COLOR.rojo, bg: COLOR.rojoSuave },
} as const;

// Consejos, idénticos a CONSEJO en apps/mobile/src/utilidades.ts.
export const CONSEJO = {
  EQUILIBRADA: 'Extracción dentro del rango ideal (18–22 %).',
  SUBEXTRAIDA: 'Prueba moler más fino, subir la temperatura o alargar el tiempo.',
};
