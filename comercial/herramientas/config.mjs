// Configuración única del comercial. Para cambiar el nombre comercial o el eslogan,
// edita este archivo y vuelve a correr: npm run marca && npm run graficos
export const MARCA = {
  nombre: 'Calibra',
  eslogan: 'Cada shot, en su punto.',
  cta: 'Disponible pronto en iOS y Android',
};

// Paleta tomada de apps/mobile/src/tema.ts, para que el comercial y la app se vean iguales.
export const COLOR = {
  cafe: '#5B3A29',
  cafeOscuro: '#2B1D14',
  crema: '#F7F3EE',
  cremaSuave: '#EFE4DA',
  blanco: '#FFFFFF',
  verde: '#2E7D4F',
  ambar: '#9A5B00',
  rojo: '#B3261E',
  texto: '#2B1D14',
  textoSuave: '#7A6A5E',
};

// Tipografías gratuitas de Google Fonts (licencia OFL).
export const FUENTES = {
  titulos: 'Fraunces',
  texto: 'Inter',
  css: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700&display=swap',
};

export const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const APP_URL = process.env.APP_URL ?? 'http://localhost:8081';
export const SALIDA = new URL('../', import.meta.url); // carpeta comercial/

// Isotipo: un medidor de extracción (como el de la app) con la aguja en la zona ideal.
export function isotipoSVG({ fondo = COLOR.cafe, trazo = COLOR.crema, ideal = '#5FBF84', radio = 224 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="${radio}" fill="${fondo}"/>
  <path d="M232 640 A280 280 0 0 1 792 640" fill="none" stroke="${trazo}" stroke-opacity="0.28" stroke-width="64" stroke-linecap="round"/>
  <path d="M452.7 366.3 A280 280 0 0 1 571.3 366.3" fill="none" stroke="${ideal}" stroke-width="64" stroke-linecap="round"/>
  <line x1="512" y1="640" x2="512" y2="420" stroke="${trazo}" stroke-width="44" stroke-linecap="round"/>
  <circle cx="512" cy="640" r="52" fill="${trazo}"/>
  <path d="M376 772 Q512 832 648 772" fill="none" stroke="${trazo}" stroke-width="36" stroke-linecap="round" stroke-opacity="0.9"/>
</svg>`;
}
