import { Audio } from '@remotion/media';
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLOR, FRAUNCES, INTER } from '../marca';
import { entrada, prog, salida, TIEMPO } from '../anim';
import { Telefono } from '../componentes/Telefono';
import { Encabezado, Icono } from '../componentes/Comunes';

// P04 · Cafés y lotes (4 compases). La grabación real va de "Mis cafés" al lote LT-2026-001.
const FUNCIONES = [
  { icono: 'ubicacion' as const, titulo: 'Cada café con su historia', detalle: 'Origen, finca, proceso y puntaje SCA' },
  { icono: 'calendario' as const, titulo: 'Cada lote, con fecha', detalle: 'Tostaduría y días desde el tueste' },
  { icono: 'bascula' as const, titulo: 'Cuánto te queda', detalle: 'La existencia de cada bolsa, en gramos' },
];
const T_FUNCION = 4 * TIEMPO; // 72, luego cada 2 tiempos

export const P04Cafes: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const llenado = prog(frame, T_FUNCION + 4 * TIEMPO + 8, 40, Easing.bezier(0.33, 1, 0.68, 1));
  const gramos = interpolate(llenado, [0, 1], [1000, 850.5]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <AbsoluteFill style={{ ...salida(frame, durationInFrames) }}>
        <div style={{ position: 'absolute', left: 120, top: 90, width: 760, height: 900, borderRadius: 400, background: `radial-gradient(circle, ${COLOR.cremaSuave} 0%, rgba(239,228,218,0) 70%)` }} />
        <Telefono video="app/02_de_cafes_a_lote.mp4" escala={0.46} playbackRate={0.72} style={{
          position: 'absolute', left: 270, top: 64,
          translate: `0px ${interpolate(frame, [0, 26], [700, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.spring({ damping: 16, stiffness: 120 }) })}px`,
          rotate: `${interpolate(frame, [0, 26], [6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}deg`,
        }} />

        <div style={{ position: 'absolute', left: 860, top: 150, width: 940 }}>
          <Encabezado etiqueta="CAFÉS Y LOTES" titulo={<>Tus cafés y lotes,<br />siempre al día.</>} desde={10} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40, marginTop: 64 }}>
            {FUNCIONES.map((f, i) => (
              <div key={f.titulo} style={{ display: 'flex', gap: 30, alignItems: 'center', ...entrada(frame, T_FUNCION + i * 2 * TIEMPO, 16, 30) }}>
                <Icono nombre={f.icono} tamano={88} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 44, color: COLOR.cafeOscuro }}>{f.titulo}</div>
                  <div style={{ fontFamily: INTER, fontWeight: 400, fontSize: 34, color: COLOR.textoSuave, marginTop: 4 }}>{f.detalle}</div>
                  {i === 2 && (
                    <div style={{ marginTop: 18, width: 640, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: INTER, fontSize: 28, color: COLOR.textoSuave }}>
                        <span>Lote LT-2026-001</span>
                        <span><b style={{ fontFamily: FRAUNCES, fontSize: 32, color: COLOR.cafeOscuro }}>{gramos.toFixed(1)}</b> / 1000 g</span>
                      </div>
                      <div style={{ height: 16, borderRadius: 8, background: COLOR.cremaSuave, marginTop: 10, overflow: 'hidden' }}>
                        <div style={{ height: 16, borderRadius: 8, background: COLOR.cafe, width: `${(gramos / 1000) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
      {FUNCIONES.map((f, i) => <Audio key={f.titulo} name={`Toque · ${f.titulo}`} src={staticFile('audio/sfx_toque.wav')} from={T_FUNCION + i * 2 * TIEMPO} volume={0.3} />)}
    </AbsoluteFill>
  );
};
