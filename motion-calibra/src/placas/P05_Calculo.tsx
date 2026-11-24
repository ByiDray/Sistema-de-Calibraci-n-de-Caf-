import { Audio } from '@remotion/media';
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLOR, DIAGNOSTICO, FRAUNCES, INTER } from '../marca';
import { entrada, prog, salida, TIEMPO } from '../anim';
import { Telefono } from '../componentes/Telefono';
import { Encabezado, Etiqueta, Tarjeta } from '../componentes/Comunes';

// P05 · Ratio y EY mientras escribes (5 compases). Grabación real: 16 g de dosis, 36 g de bebida, 28 s, TDS 9.2.
// Las cuentas son las de calcularDerivados() en apps/mobile/src/utilidades.ts.
const T_RATIO = 7 * TIEMPO;   // 126
const T_EY = 14 * TIEMPO;     // 252

export const P05Calculo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <AbsoluteFill style={{ ...salida(frame, durationInFrames) }}>
        <Telefono video="app/04_calibracion_en_vivo.mp4" escala={0.46} playbackRate={0.7} style={{
          position: 'absolute', left: 200, top: 64,
          translate: `0px ${interpolate(frame, [0, 26], [700, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.spring({ damping: 16, stiffness: 120 }) })}px`,
        }} />
        <div style={{ position: 'absolute', left: 800, top: 110, width: 1000 }}>
          <Encabezado etiqueta="CALIBRACIÓN EN VIVO" titulo={<>Ratio y EY,<br />mientras escribes.</>} desde={8} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginTop: 50 }}>
            <Formula desde={T_RATIO - TIEMPO * 2} revela={T_RATIO} etiqueta="RATIO" formula="bebida ÷ dosis"
              cuenta="36 g ÷ 16 g" resultado="1:2.3" color={COLOR.cafeOscuro} />
            <Formula desde={T_EY - TIEMPO * 2} revela={T_EY} etiqueta="EY · EXTRACCIÓN" formula="TDS × bebida ÷ dosis"
              cuenta="9.2 % × 36 ÷ 16" resultado="20.7 %" color={COLOR.verde} diagnostico />
          </div>
        </div>
      </AbsoluteFill>
      <Audio name="Toque ratio" src={staticFile('audio/sfx_toque.wav')} from={T_RATIO} volume={0.4} />
      <Audio name="Ding EY" src={staticFile('audio/sfx_ding.wav')} from={T_EY} volume={0.45} />
    </AbsoluteFill>
  );
};

const Formula: React.FC<{
  desde: number; revela: number; etiqueta: string; formula: string; cuenta: string; resultado: string; color: string; diagnostico?: boolean;
}> = ({ desde, revela, etiqueta, formula, cuenta, resultado, color, diagnostico }) => {
  const frame = useCurrentFrame();
  const r = prog(frame, revela, 16);
  const d = DIAGNOSTICO.EQUILIBRADA;
  return (
    <Tarjeta style={{ padding: '30px 40px', ...entrada(frame, desde, 18, 40) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, height: 52 }}>
          <Etiqueta>{etiqueta}</Etiqueta>
          {diagnostico && (
            <div style={{
              whiteSpace: 'nowrap', fontFamily: INTER, fontWeight: 600, fontSize: 26, color: d.fg, background: d.bg,
              padding: '6px 20px', borderRadius: 999, ...entrada(frame, revela + 10, 14, 16),
            }}>✓ {d.etiqueta}</div>
          )}
        </div>
        <div style={{ fontFamily: INTER, fontSize: 28, color: COLOR.textoTenue, fontStyle: 'italic' }}>{formula}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 10, height: 120 }}>
        <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 52, color: COLOR.textoSuave, whiteSpace: 'nowrap' }}>{cuenta}</div>
        <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 52, color: COLOR.textoTenue, opacity: r }}>=</div>
        <div style={{
          fontFamily: FRAUNCES, fontWeight: 800, fontSize: 104, color, whiteSpace: 'nowrap',
          opacity: r, scale: String(interpolate(frame, [revela, revela + 16], [0.6, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.spring({ damping: 10, stiffness: 180 }) })),
          transformOrigin: 'left center',
        }}>{resultado}</div>
      </div>
    </Tarjeta>
  );
};
