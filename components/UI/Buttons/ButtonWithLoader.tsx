import { useAppSelector as useSelector } from '@/store/hooks';
import { Buttons } from '@/lib/models/uiModels';

import { FadeLoader } from 'react-spinners';
import Button from './Button';
import { classNames } from '@/lib/utility/utils';

interface Props {
  button: Buttons;
  taskId?: string;
  children?: React.ReactNode;
}

export default function ButtonWithLoader(props: Props) {
  const { button, taskId, children } = props;
  const isLoading = useSelector((state) =>
    taskId ? state.ui.tasksInProgress[taskId] : state.ui.isLoading
  );
  const classes =
    'h-9 py-1 px-8 font-normal text-white bg-stak-dark-green rounded-3xl hover:cursor-no-drop';
  return (
    <>
      {isLoading && (
        <div className={classes}>
          <FadeLoader
            color="#fff"
            cssOverride={{
              scale: '0.5',
              width: '60px',
              height: '20px',
              top: '5px',
              left: '15px',
            }}
          />
        </div>
      )}
      {!isLoading && (
        <Button
          type="button"
          buttonText={button.label}
          className={classNames(
            button.className ||
              '2xl:px-6 md:px-3 py-1 md:text-md 2xl:text-xl font-normal bg-stak-dark-green',
            'active:bg-stak-dark-green-hover active:border-none active:cursor-pointer active:shadow-sm'
          )}
          disabled={button.disabled}
          onClick={button.onClick}
        >
          {children}
        </Button>
      )}
    </>
  );
}
