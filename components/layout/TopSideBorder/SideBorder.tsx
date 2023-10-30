import { useRouter } from 'next/router';

import BackArrow from '@/public/icons/BackArrowSVG';
import Help from '@/public/icons/HelpSVG';

import classes from '../TopSideBorder.module.css';

function SideBorder() {
  const router = useRouter();

  const scaleFactor = 0.8;
  return (
    <div className={classes['side']}>
      <div
        className={classes['back']}
        onClick={() => {
          router.back();
        }}
      >
        <BackArrow width={null} height={null} scaler={scaleFactor} />
      </div>
      <div className={classes['icon']}>
        <Help width={null} height={null} scaler={scaleFactor} />
      </div>
    </div>
  );
}

export default SideBorder;
