import { useAppSelector as useSelector } from '@/store/hooks';
import { Buttons } from '@/lib/models/uiModels';

import { FadeLoader } from 'react-spinners';
import Button from './Button';

interface Props {
  button: Buttons;
}

export default function ButtonWithLoader(props: Props) {
  const { button } = props;
  const isLoading = false;
  // const isLoading = useSelector((state) => state.ui.isLoading);
  const classes =
    'h-12 py-3 px-10 font-normal text-white bg-stak-dark-green rounded-3xl hover:cursor-no-drop';
  return (
    <>
      {isLoading && (
        <div className={classes}>
          <FadeLoader
            color="#fff"
            cssOverride={{
              scale: '0.7',
              width: '60px',
              height: '20px',
              top: '2px',
              left: '21px',
            }}
          />
        </div>
      )}
      {!isLoading && (
        <Button
          type="button"
          buttonText={button.label}
          className={
            button.className ||
            '2xl:px-6 md:px-3 py-1 md:text-md 2xl:text-xl font-normal bg-stak-dark-green'
          }
          disabled={button.disabled}
          onClick={button.onClick}
        />
      )}
    </>
  );
}
