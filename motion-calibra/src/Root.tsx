import { Composition } from 'remotion';
import { Calibra } from './Calibra';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Calibra" component={Calibra} durationInFrames={2700} fps={30} width={1920} height={1080} />
  </>
);
