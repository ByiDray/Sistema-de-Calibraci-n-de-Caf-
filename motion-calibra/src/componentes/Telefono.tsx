import { Video } from '@remotion/media';
import { Img, staticFile } from 'remotion';

// Teléfono de comercial/03_mockups/marco_telefono_vacio.png (980 × 2058) con una grabación real de la app.
// Según LEEME_EDITOR.md: el video va a 837 px de ancho, en x = 71.5, y = 175 del marco.
export const MARCO = { ancho: 980, alto: 2058 };

type Props = {
  readonly video?: string;
  readonly imagen?: string;
  readonly escala: number;
  readonly playbackRate?: number;
  readonly trimBefore?: number;
  readonly style?: React.CSSProperties;
};

export const Telefono: React.FC<Props> = ({ video, imagen, escala, playbackRate = 1, trimBefore, style }) => (
  <div style={{ width: MARCO.ancho * escala, height: MARCO.alto * escala, position: 'relative', ...style }}>
    <div style={{ width: MARCO.ancho, height: MARCO.alto, scale: String(escala), transformOrigin: '0 0', position: 'absolute' }}>
      <div style={{
        position: 'absolute', left: 60, top: 60, width: 860, height: 1940, borderRadius: 110,
        boxShadow: '0 60px 120px rgba(43,29,20,0.28), 0 20px 40px rgba(43,29,20,0.18)',
      }} />
      <div style={{ position: 'absolute', left: 71.5, top: 175, width: 837, height: 1811, overflow: 'hidden', borderRadius: '0 0 92px 92px', background: '#F7F3EE' }}>
        {video && <Video src={staticFile(video)} playbackRate={playbackRate} trimBefore={trimBefore} muted style={{ width: 837, height: 1811 }} />}
        {imagen && <Img src={staticFile(imagen)} style={{ width: 837, height: 1811 }} />}
      </div>
      <Img src={staticFile('app/marco_telefono_vacio.png')} style={{ position: 'absolute', inset: 0, width: MARCO.ancho, height: MARCO.alto }} />
    </div>
  </div>
);
