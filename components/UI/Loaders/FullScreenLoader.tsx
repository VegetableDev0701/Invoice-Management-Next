import { FadeLoader } from 'react-spinners';

interface Props {
  loaderText?: string;
  color?: string;
  size?: number;
  notFullScreen?: boolean;
  className?: string;
}

const FullScreenLoader = (props: Props) => {
  const { className, loaderText } = props;
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        props.notFullScreen ? '' : 'h-screen'
      } ${className}`}
    >
      <p className="pb-4 font-sans text-stak-dark-green text-3xl font-bold">
        {loaderText ?? ''}
      </p>
      <FadeLoader
        color={props.color || 'var(--stak-dark-green)'}
        radius={props.size || 100}
      />
    </div>
  );
};

export default FullScreenLoader;
