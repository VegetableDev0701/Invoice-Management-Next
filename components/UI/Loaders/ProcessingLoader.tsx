import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { FadeLoader } from 'react-spinners';
import Button from '../Buttons/Button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { User } from '@/lib/models/formStateModels';
import { processingActions } from '@/store/processing-slice';
import { useEffect } from 'react';

interface Props {
  color?: string;
  size?: number | string;
  width?: number | string;
  height?: number | string;
  notFullScreen?: boolean;
}

const ProcessingLoader = (props: Props) => {
  const { user } = useUser();

  const processNotification = useSelector(
    (state) => state.ui.processingNotification
  );

  // I may implement a cancel and retry feature in the future so keep this code for now
  // const cancelHandler = async () => {
  //   // dispatch(processingActions.setCancel(true));
  //   const response = await fetch(
  //     `/api/${(user as User).user_metadata.companyId}/invoices/cancel-upload`,
  //     {
  //       method: 'POST',
  //       headers: {
  //         task_id: currentTaskId,
  //       },
  //     }
  //   );
  // };
  // const retryHandler = async () => {
  //   // dispatch(processingActions.setCancel(false));

  //   const response = await fetch(
  //     `/api/${(user as User).user_metadata.companyId}/invoices/retry-upload`,
  //     {
  //       method: 'POST',
  //       headers: {
  //         task_id: currentTaskId,
  //       },
  //     }
  //   );
  // };

  return (
    <div
      className={`flex items-center justify-center ml-4 pl-2 h-4/6 rounded-md bg-white overflow-hidden`}
    >
      {/* {cancelButton && (
        <div className="font-sans text-lg text-black mr-2">
          Task Cancelled:{' '}
        </div>
      )} */}
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

        {/* <Button
          buttonText="Cancel"
          onClick={cancelHandler}
          className="text-base px-3 mr-2"
          disabled={cancelButton}
        />
        <Button
          buttonText="Retry"
          onClick={retryHandler}
          className="text-base px-3 mr-2"
        /> */}
      </div>
    </div>
  );
};

export default ProcessingLoader;
