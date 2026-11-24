import { Audio } from '@remotion/media';
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLOR, FRAUNCES, INTER, MARCA } from '../marca';
import { entrada, prog, salida, TIEMPO } from '../anim';
import { Isotipo } from '../componentes/Isotipo';

// P03 · Revelado del logo (3 compases). La aguja sube y se detiene en la zona verde ("tic" en el 4.º tiempo);
// luego el isotipo se hace a un lado y aparece el nombre con el eslogan.
const T_TIC = 3 * TIEMPO;        // 54: la aguja llega a la zona verde
const T_NOMBRE = 4 * TIEMPO;     // 72
const T_ESLOGAN = 6 * TIEMPO;    // 108

export const P03Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const aguja = interpolate(frame, [8, T_TIC - 10, T_TIC - 4, T_TIC], [-82, 14, -5, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const mover = prog(frame, T_NOMBRE - 6, 26);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 60% at 50% 50%, #FFFFFF 0%, ${COLOR.crema} 70%)` }}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', ...salida(frame, durationInFrames, 14) }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            scale: String(interpolate(frame, [0, 20], [0.55, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.spring({ damping: 12, stiffness: 160 }) }) * interpolate(mover, [0, 1], [1, 0.62])),
            opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' }),
            marginRight: interpolate(mover, [0, 1], [0, -60]),
            filter: 'drop-shadow(0 30px 50px rgba(43,29,20,0.25))',
          }}>
            <Isotipo tamano={420} aguja={aguja} arco={prog(frame, 0, 26)} zona={prog(frame, T_TIC - 6, 8)}
              brillo={frame >= T_TIC ? prog(frame, T_TIC, 24) : 0} sonrisa={prog(frame, 16, 24)} />
          </div>
          <div style={{
            width: interpolate(mover, [0, 1], [0, 820]), overflow: 'hidden', whiteSpace: 'nowrap',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 34, letterSpacing: 6, color: COLOR.textoSuave, ...entrada(frame, T_NOMBRE, 16, 20) }}>
              TE PRESENTAMOS
            </div>
            <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: 210, lineHeight: 1, color: COLOR.cafeOscuro, letterSpacing: -4, ...entrada(frame, T_NOMBRE + 4, 20, 40) }}>
              {MARCA.nombre}
            </div>
            <div style={{ fontFamily: FRAUNCES, fontWeight: 600, fontStyle: 'italic', fontSize: 58, color: COLOR.cafe, marginTop: 10, ...entrada(frame, T_ESLOGAN, 18, 24) }}>
              {MARCA.eslogan}
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <Audio name="Impacto del logo" src={staticFile('audio/sfx_impacto.wav')} volume={0.55} />
      <Audio name="Tic de la aguja" src={staticFile('audio/sfx_tic.wav')} from={T_TIC} volume={0.8} />
    </AbsoluteFill>
  );
};
