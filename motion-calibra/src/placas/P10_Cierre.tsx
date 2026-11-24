import { Audio } from '@remotion/media';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLOR, FRAUNCES, INTER, MARCA } from '../marca';
import { entrada, prog, TIEMPO } from '../anim';
import { Isotipo } from '../componentes/Isotipo';

// P10 · Cierre (4.5 compases). Los tres teléfonos suben, el logo se arma con su "tic" (4.º tiempo del 1er compás)
// y el acorde final cae en el tercer compás junto con el brillo.
const T_TIC = 4 * TIEMPO;        // 72
const T_ESLOGAN = 5 * TIEMPO;    // 90
const T_CTA = 6 * TIEMPO + 6;    // 114
const T_ACORDE = 8 * TIEMPO;     // 144

export const P10Cierre: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const aguja = interpolate(frame, [T_TIC - 30, T_TIC - 8, T_TIC - 3, T_TIC], [-80, 12, -4, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const brillo = frame >= T_ACORDE ? prog(frame, T_ACORDE, 30) : frame >= T_TIC ? prog(frame, T_TIC, 24) : 0;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 70% at 50% 30%, #FFFFFF 0%, ${COLOR.crema} 65%, ${COLOR.cremaSuave} 100%)` }}>
      <AbsoluteFill style={{ scale: String(interpolate(frame, [0, durationInFrames], [1, 1.035])) }}>
        <Img src={staticFile('app/trio_telefonos_1920x1080.png')} style={{
          position: 'absolute', width: 1920 * 0.64, height: 1080 * 0.64, left: (1920 - 1920 * 0.64) / 2, top: 490,
          opacity: prog(frame, 0, 20),
          translate: `0px ${interpolate(frame, [0, 40], [380, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) })}px`,
        }} />

        <div style={{ position: 'absolute', top: 104, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 34, ...entrada(frame, T_TIC - 34, 18, 30) }}>
            <div style={{ filter: 'drop-shadow(0 18px 30px rgba(43,29,20,0.25))' }}>
              <Isotipo tamano={150} aguja={aguja} zona={prog(frame, T_TIC - 4, 6)} brillo={brillo} />
            </div>
            <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: 150, lineHeight: 1, letterSpacing: -3, color: COLOR.cafeOscuro }}>{MARCA.nombre}</div>
          </div>
          <div style={{ fontFamily: FRAUNCES, fontWeight: 600, fontStyle: 'italic', fontSize: 60, color: COLOR.cafe, marginTop: 22, ...entrada(frame, T_ESLOGAN, 18, 24) }}>
            {MARCA.eslogan}
          </div>
          <div style={{
            marginTop: 26, fontFamily: INTER, fontWeight: 600, fontSize: 30, letterSpacing: 0.5,
            color: COLOR.crema, background: COLOR.cafe, padding: '14px 34px', borderRadius: 999, ...entrada(frame, T_CTA, 16, 20),
          }}>{MARCA.cta}</div>
        </div>
      </AbsoluteFill>
      <Audio name="Tic del logo" src={staticFile('audio/sfx_tic.wav')} from={T_TIC} volume={0.75} />
      <Audio name="Brillo final" src={staticFile('audio/sfx_brillo.wav')} from={T_ACORDE} volume={0.5} />
    </AbsoluteFill>
  );
};
