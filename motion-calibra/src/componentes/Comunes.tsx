import { useCurrentFrame } from 'remotion';
import { COLOR, FRAUNCES, INTER } from '../marca';
import { entrada } from '../anim';

// Encabezado de placa: etiqueta pequeña + titular en Fraunces.
export const Encabezado: React.FC<{ etiqueta: string; titulo: React.ReactNode; desde?: number; tamano?: number; claro?: boolean; style?: React.CSSProperties }> = ({
  etiqueta, titulo, desde = 0, tamano = 88, claro = false, style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={style}>
      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 28, letterSpacing: 5, color: claro ? 'rgba(247,243,238,0.6)' : COLOR.textoSuave, ...entrada(frame, desde, 16, 20) }}>
        {etiqueta}
      </div>
      <div style={{ fontFamily: FRAUNCES, fontWeight: 700, fontSize: tamano, lineHeight: 1.06, letterSpacing: -1, color: claro ? COLOR.crema : COLOR.cafeOscuro, marginTop: 14, ...entrada(frame, desde + 4, 20, 40) }}>
        {titulo}
      </div>
    </div>
  );
};

// Tarjeta blanca como las de la app (Tarjeta en apps/mobile/src/ui.tsx), a escala de video.
export const Tarjeta: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: COLOR.blanco, borderRadius: 28, border: `2px solid ${COLOR.borde}`,
    boxShadow: '0 18px 40px rgba(59,36,24,0.08)', padding: 36, ...style,
  }}>{children}</div>
);

export const Etiqueta: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 24, letterSpacing: 2, color: COLOR.textoSuave, ...style }}>{children}</div>
);

// Íconos de trazo simple (24 × 24), en el espíritu de Ionicons outline que usa la app.
const ICONOS: Record<string, React.ReactNode> = {
  ubicacion: <><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></>,
  calendario: <><rect x="4" y="5.5" width="16" height="14" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
  bascula: <><path d="M5 20h14l-1.6-9.5a2 2 0 0 0-2-1.7H8.6a2 2 0 0 0-2 1.7z" /><path d="M10 13.5l2 2.2 2.5-3.2" /><circle cx="12" cy="5.5" r="2" /></>,
  cubo: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></>,
  check: <><circle cx="12" cy="12" r="8.5" /><path d="M8.2 12.3l2.5 2.5 5-5.2" /></>,
  estrella: <path d="M12 3.8l2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z" />,
};

export const Icono: React.FC<{ nombre: keyof typeof ICONOS; tamano?: number; color?: string; fondo?: string }> = ({ nombre, tamano = 72, color = COLOR.cafe, fondo = COLOR.cremaSuave }) => (
  <div style={{ width: tamano, height: tamano, borderRadius: tamano / 2, background: fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width={tamano * 0.56} height={tamano * 0.56} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {ICONOS[nombre]}
    </svg>
  </div>
);
