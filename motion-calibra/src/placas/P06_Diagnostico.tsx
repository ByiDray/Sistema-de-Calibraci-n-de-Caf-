import { Audio } from '@remotion/media';
import { AbsoluteFill, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLOR, CONSEJO, DIAGNOSTICO, FRAUNCES, INTER } from '../marca';
import { entrada, prog, salida, TIEMPO } from '../anim';
import { Encabezado, Etiqueta, Tarjeta } from '../componentes/Comunes';

// P06 · Diagnóstico (4 compases). Se reescribe el TDS y el panel cambia de color con cada tecla,
// con la misma regla que la app: EY < 18 subextraída, 18–22 equilibrada, > 22 sobreextraída.
const DOSIS = 16, BEBIDA = 36;
const redondear = (v: number, d: number) => Math.round((v + 1e-9) * 10 ** d) / 10 ** d;
const eyDe = (tds: number) => redondear((tds * BEBIDA) / DOSIS, 2);
const diagDe = (ey: number) => (ey < 18 ? 'SUBEXTRAIDA' : ey > 22 ? 'SOBREEXTRAIDA' : 'EQUILIBRADA');
const num = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))));

// Lo que hay escrito en el campo TDS en cada momento. "sel" = el texto está seleccionado para reemplazarlo.
const TECLEO: { f: number; texto: string; sel?: boolean }[] = [
  { f: 0, texto: '9.2' },
  { f: 5 * TIEMPO, texto: '9.2', sel: true },     // 90
  { f: 6 * TIEMPO, texto: '7' },                  // 108 → ámbar
  { f: 6 * TIEMPO + 5, texto: '7.' },
  { f: 6 * TIEMPO + 10, texto: '7.5' },           // 16.88 %
  { f: 11 * TIEMPO, texto: '7.5', sel: true },    // 198
  { f: 12 * TIEMPO, texto: '9' },                 // 216 → verde
  { f: 12 * TIEMPO + 5, texto: '9.' },
  { f: 12 * TIEMPO + 10, texto: '9.2' },          // 20.7 %
];
const T_VERDE = TIEMPO;          // 18: el panel "se enciende"
const T_AMBAR = 6 * TIEMPO;      // 108
const T_VUELTA = 12 * TIEMPO;    // 216
const AJUSTES = ['Más fino', 'Más temperatura', 'Más tiempo'];

const estado = (frame: number) => {
  let e = TECLEO[0];
  for (const t of TECLEO) if (frame >= t.f) e = t;
  return e;
};
const COLOR_DIAG = (d: string) => DIAGNOSTICO[d as keyof typeof DIAGNOSTICO];

export const P06Diagnostico: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const e = estado(frame);
  const tds = Number(e.texto);
  const ey = eyDe(tds);
  const diag = diagDe(ey);

  // Aguja con resorte: se suma un resorte por cada cambio del EY.
  let angulo = (eyDe(9.2) - 20) * 9;
  for (let i = 1; i < TECLEO.length; i++) {
    const a = (eyDe(Number(TECLEO[i - 1].texto)) - 20) * 9, b = (eyDe(Number(TECLEO[i].texto)) - 20) * 9;
    if (a !== b) angulo += (b - a) * spring({ frame: frame - TECLEO[i].f, fps, config: { damping: 11, stiffness: 170 } });
  }
  // Color: neutro al inicio, verde en T_VERDE, ámbar en T_AMBAR, verde en T_VUELTA.
  const fg = interpolateColors(frame, [T_VERDE - 4, T_VERDE + 4, T_AMBAR, T_AMBAR + 6, T_VUELTA, T_VUELTA + 6],
    [COLOR.textoSuave, COLOR.verde, COLOR.verde, COLOR.ambar, COLOR.ambar, COLOR.verde]);
  const bg = interpolateColors(frame, [T_VERDE - 4, T_VERDE + 4, T_AMBAR, T_AMBAR + 6, T_VUELTA, T_VUELTA + 6],
    ['#F2ECE5', COLOR.verdeSuave, COLOR.verdeSuave, COLOR.ambarSuave, COLOR.ambarSuave, COLOR.verdeSuave]);
  const golpe = (t: number) => interpolate(frame - t, [0, 4, 14], [1, 1.06, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const latido = golpe(T_VERDE) * golpe(T_AMBAR) * golpe(T_VUELTA);
  const ambar = frame >= T_AMBAR && frame < T_VUELTA;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
      <AbsoluteFill style={{ ...salida(frame, durationInFrames) }}>
        <Encabezado etiqueta="DIAGNÓSTICO" titulo="Si se queda corto, te dice qué mover." tamano={80} style={{ position: 'absolute', left: 120, top: 90 }} />

        <div style={{ position: 'absolute', left: 90, top: 300, ...entrada(frame, 0, 18, 30) }}>
          <Medidor angulo={angulo} fg={fg} />
          <div style={{ position: 'absolute', left: 0, width: 820, top: 470, textAlign: 'center' }}>
            <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: 120, lineHeight: 1, color: fg, scale: String(latido) }}>{num(ey)} %</div>
            <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 36, color: fg, marginTop: 10 }}>EY · {COLOR_DIAG(diag).etiqueta}</div>
          </div>
        </div>

        <Tarjeta style={{ position: 'absolute', left: 1000, top: 290, width: 800, padding: 0, overflow: 'hidden', ...entrada(frame, 4, 18, 30) }}>
          <div style={{ padding: '32px 40px 28px' }}>
            <Etiqueta>TDS</Etiqueta>
            <div style={{ marginTop: 10, height: 84, border: `3px solid ${COLOR.cafe}`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ fontFamily: INTER, fontWeight: 500, fontSize: 52, color: COLOR.cafeOscuro, background: e.sel ? '#CFE0F5' : 'transparent', padding: '0 6px', borderRadius: 6 }}>{e.texto}</span>
              <span style={{ width: 3, height: 52, background: COLOR.cafeOscuro, marginLeft: 2, opacity: e.sel ? 0 : Math.floor(frame / 9) % 2 ? 0.15 : 1 }} />
              <span style={{ position: 'absolute', right: 32, fontFamily: INTER, fontSize: 38, color: COLOR.textoSuave }}>%</span>
            </div>
            <div style={{ fontFamily: INTER, fontSize: 26, color: COLOR.textoSuave, marginTop: 10 }}>Dosis 16 g · Bebida 36 g · Tiempo 28 s</div>
          </div>
          <div style={{ background: bg, padding: '30px 40px 36px', scale: String(latido), transformOrigin: 'center' }}>
            <div style={{ display: 'flex', gap: 70 }}>
              <div>
                <Etiqueta>RATIO</Etiqueta>
                <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: 84, color: COLOR.cafeOscuro, lineHeight: 1.1 }}>1:2.3</div>
              </div>
              <div>
                <Etiqueta>EY</Etiqueta>
                <div style={{ fontFamily: FRAUNCES, fontWeight: 800, fontSize: 84, color: fg, lineHeight: 1.1 }}>{num(ey)} %</div>
              </div>
            </div>
            <BarraEY ey={ey} />
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginTop: 22 }}>
              <div style={{ width: 34, height: 34, borderRadius: 17, background: fg, flexShrink: 0, marginTop: 4, color: COLOR.blanco, fontFamily: INTER, fontWeight: 700, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ambar ? '↓' : '✓'}
              </div>
              <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 31, lineHeight: 1.35, color: COLOR.cafeOscuro }}>
                {frame < T_VERDE ? 'Escribe el TDS para calcular el EY.' : ambar ? CONSEJO.SUBEXTRAIDA : CONSEJO.EQUILIBRADA}
              </div>
            </div>
          </div>
        </Tarjeta>

        <div style={{ position: 'absolute', left: 1000, top: 916, display: 'flex', gap: 18 }}>
          {AJUSTES.map((a, i) => {
            const aparece = prog(frame, T_AMBAR + 18 + i * TIEMPO, 12);
            const se_va = prog(frame, T_VUELTA - 8, 10);
            return (
              <div key={a} style={{
                fontFamily: INTER, fontWeight: 700, fontSize: 32, color: COLOR.ambar, background: COLOR.ambarSuave,
                border: `2px solid ${COLOR.ambar}33`, padding: '10px 26px', borderRadius: 999,
                opacity: aparece * (1 - se_va), translate: `0px ${(1 - aparece) * 20}px`,
              }}>{a}</div>
            );
          })}
        </div>
      </AbsoluteFill>

      <Audio name="Pop verde" src={staticFile('audio/sfx_pop_verde.wav')} from={T_VERDE} volume={0.6} />
      <Audio name="Pop ámbar" src={staticFile('audio/sfx_pop_ambar.wav')} from={T_AMBAR} volume={0.6} />
      <Audio name="Pop verde (vuelta)" src={staticFile('audio/sfx_pop_verde.wav')} from={T_VUELTA} volume={0.6} />
      {TECLEO.slice(1).filter((t) => !t.sel).map((t) => <Audio key={t.f} name={`Tecla ${t.texto}`} src={staticFile('audio/sfx_tecla.wav')} from={t.f} volume={0.5} />)}
      {AJUSTES.map((a, i) => <Audio key={a} name={`Ajuste · ${a}`} src={staticFile('audio/sfx_toque.wav')} from={T_AMBAR + 18 + i * TIEMPO} volume={0.25} />)}
    </AbsoluteFill>
  );
};

// Medidor grande en el lenguaje del isotipo: 10 % a la izquierda, 30 % a la derecha, zona ideal 18–22 %.
const CX = 410, CY = 400, R = 330;
const punto = (grados: number, r = R) => [CX + r * Math.sin((grados * Math.PI) / 180), CY - r * Math.cos((grados * Math.PI) / 180)];
const arco = (a: number, b: number) => { const [x1, y1] = punto(a), [x2, y2] = punto(b); return `M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}`; };

const Medidor: React.FC<{ angulo: number; fg: string }> = ({ angulo, fg }) => (
  <svg width={820} height={470} viewBox="0 0 820 470" style={{ overflow: 'visible' }}>
    <path d={arco(-90, -18)} stroke={COLOR.ambar} strokeOpacity={0.22} strokeWidth={56} fill="none" strokeLinecap="round" />
    <path d={arco(18, 90)} stroke={COLOR.rojo} strokeOpacity={0.2} strokeWidth={56} fill="none" strokeLinecap="round" />
    <path d={arco(-18, 18)} stroke={COLOR.verde} strokeWidth={56} fill="none" />
    {[['Sub', -90], ['18 %', -18], ['22 %', 18], ['Sobre', 90]].map(([t, g]) => {
      const [x, y] = punto(g as number, R + 70);
      return <text key={t} x={x} y={(g as number) === 90 || (g as number) === -90 ? y + 70 : y} textAnchor="middle" fontFamily={INTER} fontSize={28} fontWeight={600} fill={COLOR.textoSuave}>{t}</text>;
    })}
    <g style={{ transform: `rotate(${Math.max(-95, Math.min(95, angulo))}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
      <line x1={CX} y1={CY} x2={CX} y2={CY - 285} stroke={COLOR.cafeOscuro} strokeWidth={22} strokeLinecap="round" />
    </g>
    <circle cx={CX} cy={CY} r={36} fill={COLOR.cafeOscuro} />
    <circle cx={CX} cy={CY} r={14} fill={fg} />
  </svg>
);

// Barra "Sub · 18 – 22 % ideal · Sobre" como la del panel de la app.
const BarraEY: React.FC<{ ey: number }> = ({ ey }) => {
  const x = Math.max(0, Math.min(1, (ey - 10) / 20));
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ position: 'relative', height: 18, borderRadius: 9, background: 'rgba(43,29,20,0.08)' }}>
        <div style={{ position: 'absolute', left: '40%', width: '20%', height: 18, borderRadius: 9, background: 'rgba(46,125,79,0.45)' }} />
        <div style={{ position: 'absolute', left: `calc(${x * 100}% - 4px)`, top: -10, width: 8, height: 38, borderRadius: 4, background: COLOR.cafeOscuro }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: INTER, fontSize: 24, color: COLOR.textoSuave, marginTop: 10 }}>
        <span>Sub</span><span>18 – 22 % ideal</span><span>Sobre</span>
      </div>
    </div>
  );
};
