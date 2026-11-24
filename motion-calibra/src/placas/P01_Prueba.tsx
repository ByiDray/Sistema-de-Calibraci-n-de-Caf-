import { Audio } from '@remotion/media';
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { COLOR, FRAUNCES, INTER, DIAGNOSTICO } from '../marca';
import { entrada, prog, salida, TIEMPO } from '../anim';
import { Isotipo } from '../componentes/Isotipo';

// P01 · La prueba de cada mañana (4 compases). El problema: moler, pesar, probar… y otra vez.
const FRASE = ['empieza', 'la', 'misma', 'prueba.'];
const VERBOS = ['Moler.', 'Pesar.', 'Probar.', '…y otra vez.'];
const INTENTOS = [
  { aguja: -62, diag: 'SUBEXTRAIDA' as const, ey: '15.4 %' },
  { aguja: 58, diag: 'SOBREEXTRAIDA' as const, ey: '24.1 %' },
  { aguja: -38, diag: 'SUBEXTRAIDA' as const, ey: '16.9 %' },
];
const T_VERBO = 7 * TIEMPO;     // 126
const T_INTENTO = 11 * TIEMPO;  // 198
const T_BASURA = 14 * TIEMPO;   // 252

export const P01Prueba: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const faseA = interpolate(frame, [T_VERBO - 16, T_VERBO - 2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 45%, #4A3123 0%, ${COLOR.cafeOscuro} 75%)` }}>
      <AbsoluteFill style={{ ...salida(frame, durationInFrames) }}>
        {/* Fase A: la frase de apertura */}
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: faseA, translate: `0px ${(1 - faseA) * -30}px` }}>
          <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 46, color: 'rgba(247,243,238,0.7)', letterSpacing: 0.5, ...entrada(frame, 6, 20) }}>
            Cada mañana, antes de abrir,
          </div>
          <div style={{ display: 'flex', gap: 28, marginTop: 18 }}>
            {FRASE.map((p, i) => (
              <span key={p} style={{ fontFamily: FRAUNCES, fontWeight: 700, fontSize: 112, color: COLOR.crema, lineHeight: 1.1, ...entrada(frame, 24 + i * 6, 18, 50) }}>{p}</span>
            ))}
          </div>
        </AbsoluteFill>

        {/* Fase B: los verbos y los intentos fallidos */}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 44 }}>
            {VERBOS.map((v, i) => (
              <span key={v} style={{
                fontFamily: FRAUNCES, fontWeight: 600, fontSize: 76, lineHeight: 1.1,
                color: i === 3 ? COLOR.cremaSuave : COLOR.crema, fontStyle: i === 3 ? 'italic' : 'normal',
                ...entrada(frame, T_VERBO + i * TIEMPO, 14, 36),
              }}>{v}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 120, marginTop: 80 }}>
            {INTENTOS.map((it, i) => <Intento key={i} n={i + 1} desde={T_INTENTO + i * TIEMPO} {...it} />)}
          </div>
          <div style={{ marginTop: 54, fontFamily: INTER, fontWeight: 600, fontSize: 48, color: '#E9A49E', ...entrada(frame, T_BASURA, 16, 24) }}>
            Café a la basura.
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {VERBOS.map((v, i) => <Audio key={v} name={`Toque ${v}`} src={staticFile('audio/sfx_toque.wav')} from={T_VERBO + i * TIEMPO} volume={0.35} />)}
      {INTENTOS.map((_, i) => <Audio key={i} name={`Intento ${i + 1}`} src={staticFile('audio/sfx_pop_ambar.wav')} from={T_INTENTO + i * TIEMPO + 10} volume={0.3} />)}
    </AbsoluteFill>
  );
};

const Intento: React.FC<{ n: number; desde: number; aguja: number; diag: keyof typeof DIAGNOSTICO; ey: string }> = ({ n, desde, aguja, diag, ey }) => {
  const frame = useCurrentFrame();
  const d = DIAGNOSTICO[diag];
  const giro = interpolate(frame, [desde, desde + 14], [0, aguja], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.spring({ damping: 9, stiffness: 140 }),
  });
  const cruz = prog(frame, desde + 10, 10);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, ...entrada(frame, desde - 6, 14, 40) }}>
      <div style={{ position: 'relative', marginBottom: -50 }}>
        <Isotipo tamano={300} soloMedidor aguja={giro} conFondo={false} fondo="transparent" trazo={COLOR.crema} ideal={COLOR.verdeIsotipo} sonrisa={0} />
        <svg width={300} height={255} viewBox="0 0 100 85" style={{ position: 'absolute', inset: 0, opacity: cruz }}>
          <path d="M32 22 L68 58" stroke={COLOR.rojo} strokeWidth={7} strokeLinecap="round" strokeDasharray={57} strokeDashoffset={57 * (1 - cruz)} />
          <path d="M68 22 L32 58" stroke={COLOR.rojo} strokeWidth={7} strokeLinecap="round" strokeDasharray={57} strokeDashoffset={57 * (1 - prog(frame, desde + 14, 10))} />
        </svg>
      </div>
      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 30, color: COLOR.crema, opacity: 0.55, letterSpacing: 2 }}>INTENTO {n}</div>
      <div style={{
        fontFamily: INTER, fontWeight: 600, fontSize: 32, color: d.fg, background: d.bg,
        padding: '8px 22px', borderRadius: 999, opacity: cruz,
      }}>{d.etiqueta} · EY {ey}</div>
    </div>
  );
};
