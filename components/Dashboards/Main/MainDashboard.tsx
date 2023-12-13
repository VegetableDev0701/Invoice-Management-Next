import Tile from '../../UI/Tile/Tile';

import InfoSVG from '@/public/icons/InfoSVG';
import InputFiles from '@/components/Forms/FileForm/InputFiles';
import Important from './ImportantTile';

import classes from '../Dashboard.module.css';

function MainDashboard() {
  return (
    <div className={classes['main-dashboard-tiles']}>
      <div className="flex flex-col gap-9">
        <div className="flex flex-row gap-x-5 h-96">
          <div className="flex flex-col justify-between basis-1/3 gap-y-3.5">
            <Tile
              label="Add New Invoices"
              className="h-48"
              icon={<InfoSVG width={null} height={null} />}
            >
              <InputFiles />
            </Tile>
            <Tile label="Important" className="h-48">
              <Important />
            </Tile>
          </div>
          <Tile label="Company Cash Flow" />
        </div>
        <div className="flex flex-row gap-x-5 h-96">
          <Tile label="Client Invoices"></Tile>
        </div>
        <div className="flex flex-row gap-x-5 h-96">
          <Tile label="Client Invoices"></Tile>
        </div>
        <div className="flex flex-row gap-x-5 h-96">
          <Tile label="Client Invoices"></Tile>
        </div>
      </div>
    </div>
  );
}

export default MainDashboard;
