import { Audio } from '@remotion/media';
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLOR, DIAGNOSTICO, FRAUNCES, INTER } from '../marca';
import { entrada, prog, salida, TIEMPO } from '../anim';
import { Telefono } from '../componentes/Telefono';
import { Encabezado, Etiqueta, Icono, Tarjeta } from '../componentes/Comunes';

// P08 · Inicio y ranking (5 compases). Datos de la pantalla Inicio (GET /resumen) que aparecen en 02_capturas.
const KPIS = [
  { icono: 'cubo' as const, valor: 8, formato: (v: number) => String(Math.round(v)), etiqueta: 'Lotes activos' },
  { icono: 'bascula' as const, valor: 5.4, formato: (v: number) => `${v.toFixed(1)} kg`, etiqueta: 'Café disponible' },
  { icono: 'check' as const, valor: 64, formato: (v: number) => `${Math.round(v)} %`, etiqueta: 'Shots equilibrados' },
];
const EXTRACCIONES = [['EQUILIBRADA', 9], ['SUBEXTRAIDA', 2], ['SOBREEXTRAIDA', 3]] as const;
const BARISTAS = [['Carlos Ramírez', 8.3, 3], ['Sofia', 8.0, 2], ['Adriel', 7.5, 2], ['Ana Pérez', 7.0, 4], ['Luis Torres', 5.7, 3]] as const;
const T_KPI = 2 * TIEMPO;          // 36, uno por tiempo
const T_EXTRA = 6 * TIEMPO;        // 108
const T_RANKING = 9 * TIEMPO;      // 162
const suave = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 1, 0.68, 1) } as const;

export const P08Inicio: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const total = EXTRACCIONES.reduce((s, [, n]) => s + n, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <AbsoluteFill style={{ ...salida(frame, durationInFrames) }}>
        <Encabezado etiqueta="INICIO" titulo="Tu día, en una pantalla." tamano={80} style={{ position: 'absolute', left: 120, top: 80 }} />

        <div style={{ position: 'absolute', left: 120, top: 290, display: 'flex', gap: 20 }}>
          {KPIS.map((k, i) => {
            const desde = T_KPI + i * TIEMPO;
            return (
              <Tarjeta key={k.etiqueta} style={{ width: 372, padding: '26px 26px', display: 'flex', gap: 20, alignItems: 'center', ...entrada(frame, desde, 16, 30) }}>
                <Icono nombre={k.icono} tamano={70} />
                <div>
                  <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: 60, lineHeight: 1, color: COLOR.cafeOscuro }}>
                    {k.formato(interpolate(frame, [desde, desde + 24], [0, k.valor], suave))}
                  </div>
                  <div style={{ fontFamily: INTER, fontSize: 25, color: COLOR.textoSuave, marginTop: 6, whiteSpace: 'nowrap' }}>{k.etiqueta}</div>
                </div>
              </Tarjeta>
            );
          })}
        </div>

        <Tarjeta style={{ position: 'absolute', left: 120, top: 500, width: 470, height: 430, padding: '30px 34px', ...entrada(frame, T_EXTRA, 16, 30) }}>
          <Etiqueta>EXTRACCIONES</Etiqueta>
          <div style={{ display: 'flex', height: 30, borderRadius: 15, overflow: 'hidden', marginTop: 22, background: COLOR.cremaSuave }}>
            {EXTRACCIONES.map(([d, n], i) => (
              <div key={d} style={{ background: DIAGNOSTICO[d].fg, width: `${(n / total) * 100 * prog(frame, T_EXTRA + 6 + i * 5, 18)}%` }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
            {EXTRACCIONES.map(([d, n]) => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: INTER, fontSize: 30, color: COLOR.textoSuave }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, background: DIAGNOSTICO[d].fg }} />
                {DIAGNOSTICO[d].etiqueta} <b style={{ color: COLOR.cafeOscuro }}>{n}</b>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 30, paddingTop: 22, borderTop: `2px solid ${COLOR.borde}` }}>
            <Etiqueta style={{ fontSize: 20 }}>SE ESTÁN ACABANDO</Etiqueta>
            <div style={{ fontFamily: INTER, fontSize: 23, color: COLOR.verde, marginTop: 8, whiteSpace: 'nowrap' }}>☺ Ningún lote activo baja del 20 %.</div>
          </div>
        </Tarjeta>

        <Tarjeta style={{ position: 'absolute', left: 616, top: 500, width: 620, height: 430, padding: '30px 34px', ...entrada(frame, T_RANKING - 8, 16, 30) }}>
          <Etiqueta>BARISTAS POR SABOR PROMEDIO</Etiqueta>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            {BARISTAS.map(([nombre, sabor, shots], i) => {
              const desde = T_RANKING + i * 6;
              return (
                <div key={nombre} style={{ ...entrada(frame, desde, 14, 16) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: INTER, fontSize: 28 }}>
                    <span style={{ color: COLOR.cafeOscuro, fontWeight: i === 0 ? 700 : 400 }}>{i === 0 ? '★ ' : ''}{nombre}</span>
                    <span style={{ color: COLOR.textoSuave }}><b style={{ color: COLOR.cafeOscuro }}>{sabor.toFixed(1)}</b>/10 · {shots} shots</span>
                  </div>
                  <div style={{ height: 12, borderRadius: 6, background: COLOR.cremaSuave, marginTop: 8 }}>
                    <div style={{ height: 12, borderRadius: 6, background: i === 0 ? COLOR.cafe : COLOR.bordeFuerte, width: `${sabor * 10 * prog(frame, desde + 4, 24)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Tarjeta>

        <Telefono video="app/01_inicio_resumen.mp4" escala={0.44} playbackRate={0.85} style={{
          position: 'absolute', left: 1330, top: 80,
          translate: `${interpolate(frame, [0, 26], [700, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.spring({ damping: 16, stiffness: 120 }) })}px 0px`,
        }} />
      </AbsoluteFill>
      {KPIS.map((k, i) => <Audio key={k.etiqueta} name={`KPI · ${k.etiqueta}`} src={staticFile('audio/sfx_toque.wav')} from={T_KPI + i * TIEMPO} volume={0.3} />)}
      <Audio name="Ranking" src={staticFile('audio/sfx_toque.wav')} from={T_RANKING} volume={0.3} />
    </AbsoluteFill>
  );
};
