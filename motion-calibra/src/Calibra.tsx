import { Audio } from '@remotion/media';
import { AbsoluteFill, Sequence, staticFile, Track } from 'remotion';
import { COLOR } from './marca';
import { placa } from './anim';
import { P01Prueba } from './placas/P01_Prueba';
import { P02Pregunta } from './placas/P02_Pregunta';
import { P03Logo } from './placas/P03_Logo';
import { P04Cafes } from './placas/P04_Cafes';
import { P05Calculo } from './placas/P05_Calculo';
import { P06Diagnostico } from './placas/P06_Diagnostico';
import { P07Grafica } from './placas/P07_Grafica';
import { P08Inicio } from './placas/P08_Inicio';
import { P09Beneficio } from './placas/P09_Beneficio';
import { P10Cierre } from './placas/P10_Cierre';

// Video completo: 10 placas sobre una sola pista de música (100 BPM).
// Los tiempos de cada placa están en src/tiempos.json, compartidos con audio/musica.mjs.
const PLACAS = [
  { ...placa('P01'), Componente: P01Prueba },
  { ...placa('P02'), Componente: P02Pregunta },
  { ...placa('P03'), Componente: P03Logo },
  { ...placa('P04'), Componente: P04Cafes },
  { ...placa('P05'), Componente: P05Calculo },
  { ...placa('P06'), Componente: P06Diagnostico },
  { ...placa('P07'), Componente: P07Grafica },
  { ...placa('P08'), Componente: P08Inicio },
  { ...placa('P09'), Componente: P09Beneficio },
  { ...placa('P10'), Componente: P10Cierre },
];

// Barrido de aire en los cortes entre placas (arranca 10 cuadros antes para que el pico caiga en el corte).
const CORTES_CON_BARRIDO = ['P02', 'P04', 'P05', 'P07', 'P08', 'P09', 'P10'];

export const Calibra: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLOR.crema }}>
    <Track name="Placas">
      {PLACAS.map(({ from, durationInFrames, nombre, Componente }) => (
        <Sequence key={nombre} name={nombre} from={from} durationInFrames={durationInFrames}>
          <Componente />
        </Sequence>
      ))}
    </Track>
    <Track name="Barridos">
      {CORTES_CON_BARRIDO.map((id) => (
        <Audio key={id} name={`Barrido → ${id}`} src={staticFile('audio/sfx_whoosh.wav')} from={placa(id).from - 10} volume={0.32} />
      ))}
    </Track>
    <Audio name="Música (sintetizada)" src={staticFile('audio/musica.wav')} volume={0.85} />
  </AbsoluteFill>
);
