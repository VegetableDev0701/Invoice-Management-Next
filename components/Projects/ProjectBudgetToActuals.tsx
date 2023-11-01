import { useState } from "react";

import { usePageData } from "@/hooks/use-page-data";

import { CostCodesData } from "@/lib/models/budgetCostCodeModel";
import { formatNameForID } from "@/lib/utility/formatter";

import FullScreenLoader from "@/components/UI/Loaders/FullScreenLoader";
import CostCodeSideLinks from "@/components/Budget/CostCodes/CostCodeSideLinks";
import BudgetToActualCharts from "@/components/Charts/BudgetToActualCharts";

interface Props {
  projectId: string;
}

export default function ProjectBudgetToActuals(props: Props) {
  const { projectId } = props;

  // HACK - This is just dummy state to force this componenet to rerender
  // at EVERY side link click. This fixed a bug where if the same
  // link was clicked twice it would not scroll in the FormCard component.
  const [state, setState] = useState(false);
  const [clickedLinkId, setClickedLinkId] = useState("");

  const {
    data: currentProjectFormData,
    isLoading: currentBudgetLoading,
  }: { data: CostCodesData; isLoading: boolean } = usePageData(
    "projects",
    projectId,
    "budget"
  );

  const anchorScrollElement = !currentBudgetLoading
    ? formatNameForID(currentProjectFormData.divisions[0].name)
    : "";

  const clickLinkHandler = (linkId: string) => {
    setState((prevState) => !prevState);
    setClickedLinkId(linkId);
  };

  return (
    <>
      {currentBudgetLoading && <FullScreenLoader />}
      {!currentBudgetLoading && (
        <div className="flex gap-5 h-full max-w-full">
          <CostCodeSideLinks
            divisions={currentProjectFormData.divisions}
            isB2APlots={true}
            onclicklink={clickLinkHandler}
            projectId={projectId}
          />
          <BudgetToActualCharts
            formData={currentProjectFormData}
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
