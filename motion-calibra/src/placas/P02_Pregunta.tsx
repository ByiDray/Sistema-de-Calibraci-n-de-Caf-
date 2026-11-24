import { Audio } from '@remotion/media';
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLOR, FRAUNCES } from '../marca';
import { COMPAS, entrada, ENTRADA_SALIDA } from '../anim';

// P02 · La pregunta (2 compases). Aparece palabra por palabra; en el segundo compás sube la tensión hacia el logo.
const LINEAS = [
  [{ t: '¿Y' }, { t: 'si' }, { t: 'cada' }, { t: 'shot' }],
  [{ t: 'te' }, { t: 'dijera' }, { t: 'qué', verde: true }, { t: 'corregir?', verde: true }],
];

export const P02Pregunta: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  let i = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        scale: String(interpolate(frame, [0, durationInFrames], [1, 1.08])),
        opacity: interpolate(frame, [durationInFrames - 14, durationInFrames - 2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ENTRADA_SALIDA }),
        filter: `blur(${interpolate(frame, [durationInFrames - 14, durationInFrames - 2], [0, 14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
      }}>
        {LINEAS.map((linea, l) => (
          <div key={l} style={{ display: 'flex', gap: 34 }}>
            {linea.map((p) => {
              const desde = 4 + i++ * 5;
              return (
                <span key={p.t} style={{
                  fontFamily: FRAUNCES, fontWeight: 700, fontSize: 128, lineHeight: 1.12,
                  color: p.verde ? COLOR.verde : COLOR.cafeOscuro, ...entrada(frame, desde, 16, 60),
                }}>{p.t}</span>
              );
            })}
          </div>
        ))}
      </div>
      <Audio name="Subida al logo" src={staticFile('audio/sfx_subida.wav')} from={COMPAS} volume={0.45} />
    </AbsoluteFill>
  );
};
