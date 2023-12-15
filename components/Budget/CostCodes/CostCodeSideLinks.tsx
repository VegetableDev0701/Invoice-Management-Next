import { useAppSelector as useSelector } from '@/store/hooks';
import { formatNameForID, formatNumber } from '@/lib/utility/formatter';
import { Divisions } from '@/lib/models/budgetCostCodeModel';

import Card from '@/components/UI/Card';

import classes from '../../Forms/InputFormLayout/FormLayout.module.css';
import { generateTitle } from '@/lib/utility/utils';

interface Props {
  divisions: Divisions[];
  projectId?: string;
  isBudgetForm?: boolean;
  isB2APlots?: boolean;
  isBudgetToActuals?: boolean;
  onclicklink: (link: string) => void;
}

function CostCodeSideLinks(props: Props) {
  const {
    divisions,
    isBudgetForm,
    isB2APlots,
    isBudgetToActuals,
    projectId,
    onclicklink,
  } = props;

  const totalBudget = useSelector((state) => state.addBudgetForm.totalBudget);
  const projects = useSelector((state) => state.projects);

  const currentBudgetedTotal = projectId
    ? projects[projectId].b2a?.currentBudgetedTotal.value
    : 0;

  // TODO the percent complete denominator is not correct. need to change the the
  // budget amount plus any change order and overages
  // in any category to get the true percent project completion status
  const percentComplete =
    (currentBudgetedTotal / Number(totalBudget.replaceAll(',', ''))) * 100;

  const clickLinkHandler = (e: React.MouseEvent<HTMLLIElement>) => {
    onclicklink((e.target as HTMLElement).id.split('_')[0]);
  };

  return (
    <div className={`flex flex-col h-full w-80 gap-4`}>
      {isBudgetForm && (
        <div className="flex justify-center rounded-[50px] bg-stak-dark-green text-white font-sans font-normal text-3xl w-full py-2">
          {`$ ${formatNumber(totalBudget)}`}
        </div>
      )}
      {isB2APlots && (
        <div className="flex justify-center rounded-[50px] bg-stak-dark-green text-white font-sans font-normal text-3xl w-full py-2">
          {`Complete: ${percentComplete.toFixed(2)} %`}
        </div>
      )}
      <div className="flex-grow flex-shrink flex flex-col h-0">
        <Card
          className={`flex-grow flex-shrink items-start py-5 bg-stak-white min-h-0`}
        >
          <div className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch overflow-y-scroll">
            <ul
              className={`flex flex-col gap-4 ${classes['content-frame__links']}`}
            >
              {(isBudgetToActuals
                ? [
                    {
                      name: 'Change Orders',
                      number: -1,
                    },
                    ...divisions,
                  ]
                : divisions
              ).map((division, i) => (
                <div
                  key={i}
                  className={`${classes['link-container']} flex flex-1 justify-between items-center`}
                >
                  <li
                    id={`${formatNameForID(
                      division.name || String(division.number)
                    )}_link`}
                    onClick={clickLinkHandler}
                  >
                    {generateTitle(
                      division.number.toString().padStart(2, '0'),
                      division.name,
                      (number) => number != '00' && number != '-1'
                    )}
                  </li>
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
