import { COLOR } from '../marca';

// Isotipo de comercial/01_marca/isotipo.svg, con cada parte animable:
// - aguja: grados respecto a la vertical (0 = centro de la zona verde, negativo = hacia "sub").
// - arco: 0→1 cuánto del arco gris está dibujado.
// - zona: 0→1 opacidad de la zona verde; brillo: halo cuando la aguja llega.
type Props = {
  readonly tamano: number;
  readonly aguja?: number;
  readonly arco?: number;
  readonly zona?: number;
  readonly sonrisa?: number;
  readonly brillo?: number;
  readonly fondo?: string;
  readonly trazo?: string;
  readonly ideal?: string;
  readonly conFondo?: boolean;
  readonly soloMedidor?: boolean;
  readonly style?: React.CSSProperties;
};

const LARGO_ARCO = Math.PI * 280;

export const Isotipo: React.FC<Props> = ({
  tamano, aguja = 0, arco = 1, zona = 1, sonrisa = 1, brillo = 0,
  fondo = COLOR.cafe, trazo = COLOR.crema, ideal = COLOR.verdeIsotipo, conFondo = true, soloMedidor = false, style,
}) => (
  <svg width={tamano} height={soloMedidor ? tamano * 0.85 : tamano} viewBox={soloMedidor ? "200 330 624 530" : "0 0 1024 1024"} style={{ overflow: 'visible', ...style }}>
    {conFondo && <rect width="1024" height="1024" rx="224" fill={fondo} />}
    <path d="M232 640 A280 280 0 0 1 792 640" fill="none" stroke={trazo} strokeOpacity={0.28} strokeWidth={64}
      strokeLinecap="round" strokeDasharray={LARGO_ARCO} strokeDashoffset={LARGO_ARCO * (1 - arco)} />
    {brillo > 0 && (
      <path d="M452.7 366.3 A280 280 0 0 1 571.3 366.3" fill="none" stroke={ideal} strokeWidth={64 + 60 * brillo}
        strokeLinecap="round" opacity={0.35 * (1 - brillo) + 0.05} />
    )}
    <path d="M452.7 366.3 A280 280 0 0 1 571.3 366.3" fill="none" stroke={ideal} strokeWidth={64} strokeLinecap="round" opacity={zona} />
    <g style={{ transform: `rotate(${aguja}deg)`, transformOrigin: '512px 640px' }}>
      <line x1="512" y1="640" x2="512" y2="420" stroke={trazo} strokeWidth={44} strokeLinecap="round" />
    </g>
    <circle cx="512" cy="640" r="52" fill={trazo} />
    <path d="M376 772 Q512 832 648 772" fill="none" stroke={trazo} strokeWidth={36} strokeLinecap="round"
      strokeOpacity={0.9} strokeDasharray={300} strokeDashoffset={300 * (1 - sonrisa)} />
  </svg>
);
