import { FadeLoader } from 'react-spinners';

interface Props {
  color?: string;
  size?: number;
  notFullScreen?: boolean;
  className?: string;
}

const FullScreenLoader = (props: Props) => {
  const { className } = props;
  return (
    <div
      className={`flex items-center justify-center ${
        props.notFullScreen ? '' : 'h-screen'
      } ${className}`}
    >
      <FadeLoader
        color={props.color || 'var(--stak-dark-green)'}
        radius={props.size || 100}
      />
    </div>
  );
};

export default FullScreenLoader;
