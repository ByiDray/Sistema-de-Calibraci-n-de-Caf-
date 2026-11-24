import { Audio } from '@remotion/media';
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLOR, FRAUNCES, INTER } from '../marca';
import { entrada, prog, salida, TIEMPO } from '../anim';
import { Encabezado, Etiqueta, Tarjeta } from '../componentes/Comunes';

// P07 · Gráfica del lote (4 compases). Las cinco calibraciones reales de LT-2026-001 (GraficaCalibraciones en la app):
// la escala llega a 30 %; lo que la pasa se corta y se marca con ▲.
const BARRAS = [19.8, 46, 37.05, 37.69, 20.7];
const T_BARRA = 2 * TIEMPO;       // 36, luego una por tiempo
const T_NOTA = 8 * TIEMPO;        // 144
const T_DATOS = 9 * TIEMPO;       // 162
const colorDe = (ey: number) => (ey < 18 ? COLOR.ambar : ey > 22 ? COLOR.rojo : COLOR.verde);

const ANCHO = 860, ALTO = 520, IZQ = 70;
const y = (v: number) => ALTO - (Math.min(v, 30) / 30) * ALTO;

export const P07Grafica: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const paso = (ANCHO - IZQ) / BARRAS.length;
  const pulso = interpolate(frame, [T_NOTA, T_NOTA + 10, T_NOTA + 40], [0, 1, 0.35], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <AbsoluteFill style={{ ...salida(frame, durationInFrames) }}>
        <div style={{ position: 'absolute', left: 120, top: 170, width: 760 }}>
          <Encabezado etiqueta="GRÁFICA DEL LOTE" titulo={<>Mira cómo mejora<br />cada lote.</>} desde={4} tamano={80} />
          <div style={{ fontFamily: INTER, fontSize: 36, lineHeight: 1.4, color: COLOR.textoSuave, marginTop: 30, ...entrada(frame, 14, 18, 24) }}>
            Shot por shot, hasta caer en la zona ideal.
          </div>
          <div style={{ display: 'flex', gap: 54, marginTop: 64 }}>
            {[['ÚLTIMO EY', '20.7 %'], ['MEJOR SABOR', '8/10'], ['MEJOR RECETA', '16→36 g']].map(([e, v], i) => (
              <div key={e} style={{ ...entrada(frame, T_DATOS + i * 6, 16, 24) }}>
                <Etiqueta style={{ fontSize: 22 }}>{e}</Etiqueta>
                <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: 54, color: i === 0 ? COLOR.verde : COLOR.cafeOscuro, marginTop: 6 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <Tarjeta style={{ position: 'absolute', left: 900, top: 160, width: ANCHO + 80, padding: 40, ...entrada(frame, 0, 20, 40) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Etiqueta>EY POR CALIBRACIÓN</Etiqueta>
              <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 30, color: COLOR.cafeOscuro, marginTop: 6 }}>LT-2026-001 · Chiapas Altura Selecta</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: INTER, fontSize: 26, color: COLOR.textoSuave }}>
              <div style={{ width: 34, height: 22, borderRadius: 6, background: COLOR.verdeSuave, border: `2px solid ${COLOR.verde}66` }} />
              zona ideal 18–22 %
            </div>
          </div>
          <svg width={ANCHO} height={ALTO + 60} viewBox={`0 -50 ${ANCHO} ${ALTO + 60}`} style={{ marginTop: 30, overflow: 'visible' }}>
            {[0, 10, 20, 30].map((v) => (
              <g key={v}>
                <line x1={IZQ} x2={ANCHO} y1={y(v)} y2={y(v)} stroke={COLOR.borde} strokeWidth={2} />
                <text x={IZQ - 18} y={y(v) + 9} textAnchor="end" fontFamily={INTER} fontSize={26} fill={COLOR.textoTenue}>{v}</text>
              </g>
            ))}
            <rect x={IZQ} width={ANCHO - IZQ} y={y(22)} height={y(18) - y(22)} fill={COLOR.verde} opacity={0.14 + 0.2 * pulso} />
            <line x1={IZQ} x2={ANCHO} y1={y(18)} y2={y(18)} stroke={COLOR.verde} strokeOpacity={0.4} strokeWidth={2} />
            <line x1={IZQ} x2={ANCHO} y1={y(22)} y2={y(22)} stroke={COLOR.verde} strokeOpacity={0.4} strokeWidth={2} />
            {BARRAS.map((v, i) => {
              const p = interpolate(frame, [T_BARRA + i * TIEMPO, T_BARRA + i * TIEMPO + 16], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.spring({ damping: 13, stiffness: 150 }),
              });
              const x = IZQ + paso * i + paso * 0.22, w = paso * 0.56;
              const alto = (ALTO - y(v)) * p;
              const etiqueta = v > 30 ? `▲${v}` : String(v);
              return (
                <g key={i}>
                  <rect x={x} width={w} y={ALTO - alto} height={alto} rx={12} fill={colorDe(v)} />
                  <rect x={x} width={w} y={ALTO - Math.min(alto, 12)} height={Math.min(alto, 12)} fill={colorDe(v)} />
                  <text x={x + w / 2} y={ALTO - alto - 16} textAnchor="middle" fontFamily={INTER} fontWeight={700} fontSize={30}
                    fill={colorDe(v)} opacity={prog(frame, T_BARRA + i * TIEMPO + 8, 8)}>{etiqueta}</text>
                </g>
              );
            })}
          </svg>
        </Tarjeta>

        <div style={{
          position: 'absolute', left: 120, top: 700, fontFamily: INTER, fontWeight: 700, fontSize: 30, color: COLOR.verde,
          background: COLOR.verdeSuave, padding: '10px 24px', borderRadius: 999, ...entrada(frame, T_NOTA, 14, 20),
        }}>✓ De vuelta en la zona ideal</div>
      </AbsoluteFill>
      {BARRAS.map((_, i) => <Audio key={i} name={`Barra ${i + 1}`} src={staticFile(`audio/sfx_madera_${i + 1}.wav`)} from={T_BARRA + i * TIEMPO} volume={0.45} />)}
      <Audio name="Pop zona ideal" src={staticFile('audio/sfx_pop_verde.wav')} from={T_NOTA} volume={0.4} />
    </AbsoluteFill>
  );
};
