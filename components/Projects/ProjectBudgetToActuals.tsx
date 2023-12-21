import { useEffect, useState } from 'react';

import { usePageData } from '@/hooks/use-page-data';

import { CostCodesData } from '@/lib/models/budgetCostCodeModel';
import { formatNameForID } from '@/lib/utility/formatter';

import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import CostCodeSideLinks from '@/components/Budget/CostCodes/CostCodeSideLinks';
import BudgetToActualCharts from '@/components/Charts/BudgetToActualCharts';
import { useAppSelector as useSelector } from '@/store/hooks';
import { useUser } from '@auth0/nextjs-auth0/client';
import { User } from '@/lib/models/formStateModels';
import { isObjectEmpty } from '@/lib/utility/utils';

interface Props {
  projectId: string;
}

export default function ProjectBudgetToActuals(props: Props) {
  const { projectId } = props;
  const { user } = useUser();

  // HACK - This is just dummy state to force this componenet to rerender
  // at EVERY side link click. This fixed a bug where if the same
  // link was clicked twice it would not scroll in the FormCard component.
  const [state, setState] = useState(false);
  const [clickedLinkId, setClickedLinkId] = useState('');

  const [blankFormData, setBlankFormData] = useState<CostCodesData | null>(
    useSelector((state) => state.data.costCodes)
  );

  const b2aChartDataChangeOrder = useSelector(
    (state) => state.projects[projectId]?.b2a?.b2aChartDataChangeOrder
  );

  useEffect(() => {
    const getCostCodes = async () => {
      try {
        const response = await fetch(
          `/api/${(user as User).user_metadata.companyId}/get-cost-codes`,
          {
            method: 'GET',
          }
        );
        if (!response.ok) {
          throw new Error(
            `Something went wrong with fetching cost codes: ${response.status} - ${response.statusText}`
          );
        }
        const data = await response.json();
        setBlankFormData(JSON.parse(data));
      } catch (error) {
        console.error(error);
      }
    };
    if (!blankFormData) getCostCodes();
  }, [blankFormData]);

  const {
    data: currentProjectFormData,
    isLoading: currentBudgetLoading,
  }: { data: CostCodesData; isLoading: boolean } = usePageData(
    'projects',
    projectId,
    'budget'
  );

  let chartData: CostCodesData | null;
  if (currentProjectFormData) {
    chartData = currentProjectFormData;
  } else if (blankFormData && !currentProjectFormData) {
    chartData = blankFormData;
  } else {
    chartData = null;
  }

  // Makes sure that when we scroll we scroll to the top. Have to have this conditional since
  // change orders may not exist for a project.
  let anchorScrollElement = '';
  if (!currentBudgetLoading) {
    if (b2aChartDataChangeOrder && !isObjectEmpty(b2aChartDataChangeOrder)) {
      anchorScrollElement = 'change-orders';
    } else {
      anchorScrollElement = formatNameForID(
        currentProjectFormData.divisions[0].name || ''
      );
    }
  }

  const clickLinkHandler = (linkId: string) => {
    setState((prevState) => !prevState);
    setClickedLinkId(linkId);
  };

  return (
    <>
      {!chartData && <FullScreenLoader />}
      {chartData && (
        <div className="flex gap-5 h-full max-w-full">
          <CostCodeSideLinks
            divisions={chartData.divisions}
            isB2APlots={true}
            isBudgetToActuals={true}
            onclicklink={clickLinkHandler}
            projectId={projectId}
          />
          <BudgetToActualCharts
            formData={chartData}
            anchorScrollElement={anchorScrollElement}
            clickedLink={clickedLinkId}
            dummyForceRender={state}
            projectId={projectId}
            filterZeroElements={true}
          />
        </div>
      )}
    </>
  );
}
