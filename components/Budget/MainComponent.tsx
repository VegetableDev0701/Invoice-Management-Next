import { useState, useEffect } from "react";

import { Actions } from "@/lib/models/types";
import { formatNameForID } from "@/lib/utility/formatter";

import { CostCodesData } from "@/components/Budget/CostCodes/CostCodesTreeData";
import TitleCard from "@/components/UI/FormLayout/TitleCard";

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from "@/store/hooks";
import { companyDataActions } from "@/store/company-data-slice";

import CostCodesForm from "./CostCodes/CostCodesForm";
import CostCodesDivision from "./CostCodes/CostCodesDivision";
import classes from "../../components/Forms/form-layout.module.css";
import { ConvertTreeData } from "../Budget/CostCodes/CostCodesTreeData";

export interface Props {
  costCodes: CostCodesData;
  pageTitle: string;
  subTitle?: string;
  showError: boolean;
  actions?: Actions;
  onOpenModal: (e: React.MouseEvent) => void;
}

export default function MainComponent(props: Props) {
  const { costCodes, pageTitle, subTitle } = props;
  const treeData = useSelector((state) => state.data.treeData);
  const anchorScrollElement = formatNameForID(costCodes.divisions[0].name);
  const [state, setState] = useState<boolean>(false);

  const [costCodeDataList, setCostCodeDataList] = useState<CostCodesData>({
    ...costCodes,
  });
  const [clickedLinkId, setClickedLinkId] = useState<string>("");

  const dispatch = useDispatch();

  const clickLinkHandler = (linkId: string) => {
    setState((prevState) => !prevState);
    setClickedLinkId(linkId);
  };

  useEffect(() => {
    setCostCodeDataList(costCodes);
  }, []);

  useEffect(() => {
    dispatch(
      companyDataActions.changeUpdateTreeStatus({
        updated: true,
        data: {
          ...new ConvertTreeData().convertCostCode2TreeData(costCodeDataList),
        },
      })
    );
  }, [costCodeDataList]);

  return (
    <div className={classes["main-form-tiles"]}>
      <TitleCard
        onConfirmSave={(e) => props.onOpenModal(e)}
        isUpdated={treeData?.updated ?? false}
        pageTitle={pageTitle}
        subTitle={subTitle as string}
        costCodeDataList={costCodeDataList}
        setCostCodeDataList={setCostCodeDataList}
      />
      <div className={classes["content-tiles"]}>
        <CostCodesDivision
          onclicklink={clickLinkHandler}
          costCodeDataList={costCodeDataList}
          setCostCodeDataList={setCostCodeDataList}
        />
        <CostCodesForm
          clickedLink={clickedLinkId}
          dummyForceRender={state}
          anchorScrollElement={anchorScrollElement}
          formData={costCodeDataList}
          setDataList={setCostCodeDataList}
        />
      </div>
    </div>
  );
}
