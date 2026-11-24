import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLOR, FRAUNCES } from '../marca';
import { entrada, prog, salida, TIEMPO } from '../anim';
import { Isotipo } from '../componentes/Isotipo';

// P09 · Beneficio (2 compases). La música baja; dos frases cortas.
export const P09Beneficio: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 50%, #4A3123 0%, ${COLOR.cafeOscuro} 75%)`, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ...salida(frame, durationInFrames, 10) }}>
        <div style={{ ...entrada(frame, 0, 18, 24) }}>
          <Isotipo tamano={170} soloMedidor conFondo={false} trazo={COLOR.crema} sonrisa={0}
            aguja={interpolate(frame, [0, 3 * TIEMPO], [-70, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.spring({ damping: 10, stiffness: 120 }) })}
            brillo={frame > 3 * TIEMPO ? prog(frame, 3 * TIEMPO, 24) : 0} />
        </div>
        <div style={{ position: 'relative', fontFamily: FRAUNCES, fontWeight: 600, fontSize: 92, color: 'rgba(247,243,238,0.75)', marginTop: 40, ...entrada(frame, 4, 18, 30) }}>
          Menos café desperdiciado.
        </div>
        <div style={{ fontFamily: FRAUNCES, fontWeight: 700, fontSize: 112, color: COLOR.crema, marginTop: 10, ...entrada(frame, 2 * TIEMPO, 18, 30) }}>
          Más tazas <span style={{ color: COLOR.verdeIsotipo, fontStyle: 'italic' }}>en su punto.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
