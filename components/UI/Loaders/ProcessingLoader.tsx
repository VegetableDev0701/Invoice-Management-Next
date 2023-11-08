import {
  useAppSelector as useSelector,
} from '@/store/hooks';
import { FadeLoader } from 'react-spinners';

interface Props {
  color?: string;
  size?: number | string;
  width?: number | string;
  height?: number | string;
  notFullScreen?: boolean;
}

const ProcessingLoader = (props: Props) => {
  const processNotification = useSelector(
    (state) => state.ui.processingNotification
  );

  return (
    <div
      className={`flex items-center justify-center ml-4 pl-2 h-4/6 rounded-md bg-white overflow-hidden`}
    >
      {processNotification.openNotification && (
        <div
          className={`font-sans text-lg text-black ${
            (processNotification.content === 'Complete' ||
              processNotification.content === 'Error') &&
            'pr-2'
          }`}
        >
          {processNotification.content}{' '}
        </div>
      )}
      <div className="flex items-center">
        {!(
          processNotification.content === 'Complete' ||
          processNotification.content === 'Error'
        ) && (
          <FadeLoader
            width={'7px'}
            color={props.color || 'var(--stak-dark-green'}
            cssOverride={{ scale: '0.5', top: '10px', left: '12px' }}
          />
        )}
      </div>
    </div>
  );
};

export default ProcessingLoader;
