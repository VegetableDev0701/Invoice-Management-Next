import { useState, useEffect } from 'react';

import { formatNameForID } from '@/lib/utility/formatter';

import Card from '@/components/UI/Card';
import Button from '@/components/UI/Buttons/Button';
import AddDivisionForm from './AddDivisionForm';

import classes from '../../Forms/InputFormLayout/FormLayout.module.css';
import { CostCodesData, Divisions } from '@/lib/models/budgetCostCodeModel';

interface Props {
  costCodeDataList: CostCodesData;
  setCostCodeDataList: Function;
  onclicklink: (link: string) => void;
}

function CostCodesDivision(props: Props) {
  const { costCodeDataList, setCostCodeDataList, onclicklink } = props;
  const [showAddDivision, setShowAddDivision] = useState(false);
  const [divisions, setDivisions] =
    useState<{ name: string; number: number }[]>();

  const clickLinkHandler = (e: React.MouseEvent<HTMLLIElement>) => {
    onclicklink((e.target as HTMLElement).id.split('_')[0]);
  };

  useEffect(() => {
    setDivisions(
      costCodeDataList.divisions.map((item) => {
        const { name = '', number } = item as Divisions;
        return { name, number };
      })
    );
  }, [costCodeDataList]);

  return (
    <div className={`flex flex-col h-full w-80 gap-4`}>
      <Button
        className="w-full py-2 text-2xl"
        buttonText="Add Division"
        onClick={() => {
          setShowAddDivision((prevState) => !prevState);
        }}
      />
      {showAddDivision && (
        <AddDivisionForm
          showForm={() => setShowAddDivision((prevState) => !prevState)}
          setCostCodeDataList={setCostCodeDataList}
        />
      )}
      <div className="flex-grow flex-shrink flex flex-col h-0">
        <Card
          className={`flex-grow flex-shrink items-start py-5 bg-stak-white min-h-0`}
        >
          <div className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch overflow-y-scroll">
            <ul
              className={`flex flex-col gap-4 ${classes['content-frame__links']}`}
            >
              {divisions?.map(
                (division: { name: string; number: number }, i: number) => (
                  <div
                    key={i}
                    className={`flex flex-1 justify-between items-center`}
                  >
                    <li
                      id={`${formatNameForID(division.name)}_link`}
                      onClick={clickLinkHandler}
                    >
                      {division.number.toString().padStart(2, '0') != '00'
                        ? `${division.number.toString().padStart(2, '0')} - ${
                            division.name
                          }`
                        : `${division.name}`}
                    </li>
                  </div>
                )
              )}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default CostCodesDivision;
