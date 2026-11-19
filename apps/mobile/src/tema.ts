// Sistema de diseño: colores, espaciado y tipografía compartidos por toda la app.
export const color = {
  fondo: '#F7F3EE',
  superficie: '#FFFFFF',
  superficieAlt: '#FBF8F4',
  primario: '#5B3A29',
  primarioPresionado: '#472C1F',
  primarioSuave: '#EFE4DA',
  sobrePrimario: '#FFFFFF',
  texto: '#2B1D14',
  textoSuave: '#7A6A5E',
  textoTenue: '#A3958A',
  borde: '#E4DAD0',
  bordeFuerte: '#CDBFB2',
  exito: '#2E7D4F',
  exitoSuave: '#E3F2E8',
  alerta: '#9A5B00',
  alertaSuave: '#FFF1DC',
  peligro: '#B3261E',
  peligroSuave: '#FBE4E2',
} as const;

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const radio = { s: 8, m: 12, l: 16, pill: 999 } as const;

export const texto = {
  titulo: { fontSize: 22, fontWeight: '700' as const, color: color.texto },
  subtitulo: { fontSize: 17, fontWeight: '600' as const, color: color.texto },
  cuerpo: { fontSize: 15, color: color.texto },
  pequeno: { fontSize: 13, color: color.textoSuave },
  etiqueta: { fontSize: 13, fontWeight: '600' as const, color: color.textoSuave, letterSpacing: 0.3 },
} as const;

export const sombra = {
  shadowColor: '#3B2418',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

// Colores y textos de cada diagnóstico de extracción.
export const DIAGNOSTICO = {
  EQUILIBRADA: { etiqueta: 'Equilibrada', fg: color.exito, bg: color.exitoSuave, icono: 'checkmark-circle' as const },
  SUBEXTRAIDA: { etiqueta: 'Subextraída', fg: color.alerta, bg: color.alertaSuave, icono: 'arrow-down-circle' as const },
  SOBREEXTRAIDA: { etiqueta: 'Sobreextraída', fg: color.peligro, bg: color.peligroSuave, icono: 'arrow-up-circle' as const },
} as const;
export type Diagnostico = keyof typeof DIAGNOSTICO;
