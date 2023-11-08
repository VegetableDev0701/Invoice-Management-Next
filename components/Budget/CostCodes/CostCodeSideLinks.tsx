import { useState } from 'react';

import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import { companyDataActions } from '@/store/company-data-slice';
import { addBudgetFormActions } from '@/store/add-budget-slice';

import { formatNameForID } from '@/lib/utility/formatter';
import { Divisions } from '@/lib/models/budgetCostCodeModel';

import Card from '@/components/UI/Card';
import Button from '@/components/UI/Buttons/Button';
import { TrashIcon } from '@heroicons/react/20/solid';

import classes from '../../Forms/InputFormLayout/FormLayout.module.css';

interface Props {
  divisions: Divisions[];
  projectId?: string;
  // isEditForm?: boolean;
  isBudgetForm?: boolean;
  isB2APlots?: boolean;
  onclicklink: (link: string) => void;
}

function CostCodeSideLinks(props: Props) {
  const {
    divisions,
    // isEditForm,
    isBudgetForm,
    isB2APlots,
    projectId,
    onclicklink,
  } = props;
  const [showAddDivision, setShowAddDivision] = useState(false);

  const totalBudget = useSelector((state) => state.addBudgetForm.totalBudget);
  const projects = useSelector((state) => state.projects);

  const currentBudgetedTotal = projectId
    ? projects[projectId].b2a?.currentBudgetedTotal.value
    : 0;

  const percentComplete =
    (currentBudgetedTotal / Number(totalBudget.replaceAll(',', ''))) * 100;

  const dispatch = useDispatch();

  const clickLinkHandler = (e: React.MouseEvent<HTMLLIElement>) => {
    onclicklink((e.target as HTMLElement).id.split('_')[0]);
  };

  // const deleteDivisionHandler = (
  //   e: React.MouseEvent,
  //   divisionNumber: number
  // ) => {
  //   e.preventDefault();
  //   dispatch(companyDataActions.deleteDivision({ divisionNumber }));
  //   dispatch(
  //     addBudgetFormActions.addToUpdateBudgetList({
  //       divisionNumber,
  //       isDelete: true,
  //     })
  //   );
  // };

  return (
    <div className={`flex flex-col h-full w-80 gap-4`}>
      {/* {isEditForm && (
        <Button
          className="w-full py-2 text-2xl"
          buttonText="Add Division"
          onClick={() => {
            setShowAddDivision((prevState) => !prevState);
          }}
        />
      )} */}
      {isBudgetForm && (
        <div className="flex justify-center rounded-[50px] bg-stak-dark-green text-white font-sans font-normal text-3xl w-full py-2">
          {`$ ${totalBudget}`}
        </div>
      )}
      {isB2APlots && (
        <div className="flex justify-center rounded-[50px] bg-stak-dark-green text-white font-sans font-normal text-3xl w-full py-2">
          {`Complete: ${percentComplete.toFixed(2)} %`}
        </div>
      )}
      {/* {showAddDivision && isEditForm && (
        <AddDivisionForm
          showForm={() => setShowAddDivision((prevState) => !prevState)}
        />
      )} */}
      <div className="flex-grow flex-shrink flex flex-col h-0">
        <Card
          className={`flex-grow flex-shrink items-start py-5 bg-stak-white min-h-0`}
        >
          <div className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch overflow-y-scroll">
            <ul
              className={`flex flex-col gap-4 ${classes['content-frame__links']}`}
            >
              {divisions.map((division, i) => (
                <div
                  key={i}
                  className={`${classes['link-container']} flex flex-1 justify-between items-center`}
                >
                  <li
                    id={`${formatNameForID(division.name || String(division.number))}_link`}
                    onClick={clickLinkHandler}
                  >
                    {division.number.toString().padStart(2, '0') != '00'
                      ? `${division.number.toString().padStart(2, '0')} - ${
                          division.name
                        }`
                      : `${division.name}`}
                  </li>
                  {/* {isEditForm && (
                    <button
                      type="button"
                      className={classes['trash-icon']}
                      onClick={(e) => deleteDivisionHandler(e, division.number)}
                    >
                      <TrashIcon className="h-8 w-8 text-gray-500" />
                    </button>
                  )} */}
                </div>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default CostCodeSideLinks;
