import React, { useState, useEffect } from 'react';
import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { companyDataActions } from '@/store/company-data-slice';

import Card from '../Card';
import Button from '../Buttons/Button';

import classes from '../../Forms/InputFormLayout/FormLayout.module.css';
import { CostCodesData } from '@/lib/models/budgetCostCodeModel';

interface Props {
  pageTitle: string;
  subTitle: string;
  isUpdated?: boolean;
  onConfirmSave: (e: React.MouseEvent) => void;
  costCodeDataList?: CostCodesData;
  setCostCodeDataList?: (data: CostCodesData) => void;
}

const TitleCard = (props: Props) => {
  const {
    pageTitle,
    subTitle,
    isUpdated,
    onConfirmSave,
    costCodeDataList,
    setCostCodeDataList,
  } = props;

  const treeData = useSelector((state) => state.data.treeData);
  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    let flag = false;
    if (treeData)
      Object.keys(treeData.data).forEach((treeItemKey) => {
        if (treeData.data[treeItemKey].data?.isOpened === true) {
          flag = true;
        }
      });
    setIsExpanded(flag);
  }, [costCodeDataList, treeData]);

  return (
    <Card className={`${classes['title-card']}`}>
      <div
        className={
          'flex flex-col justify-start items-start text-left text-gray-700 gap-2'
        }
      >
        <h2 className="font-normal text-5xl">{pageTitle}</h2>
        <span className="font-normal text-2xl pl-0.5">{subTitle}</span>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          buttonText="Save"
          type="button"
          className="py-1 px-12 text-2xl"
          disabled={isUpdated !== undefined ? !isUpdated : false} // right now there is no check if the account settings form was updated or not
          onClick={(e) => onConfirmSave(e)}
        />
        {setCostCodeDataList && (
          <Button
            buttonText={
              isExpanded ? 'Collapse Cost Codes' : 'Expand Cost Codes'
            }
            type="submit"
            className="py-1 px-4 text-2xl"
            onClick={() => {
              const newTreeData: CostCodesData = JSON.parse(
                JSON.stringify(costCodeDataList)
              );
              newTreeData.divisions.forEach((div, index) => {
                newTreeData.divisions[index] = { ...div, isOpened: false };
                newTreeData.divisions[index].isOpened = !isExpanded;
              });
              setCostCodeDataList(newTreeData);
              const newTree = JSON.parse(JSON.stringify(treeData.data));
              Object.keys(newTree).forEach((itemKey) => {
                newTree[itemKey].data = {
                  ...newTree[itemKey].data,
                  isOpened: true,
                };
                newTree[itemKey].data.isOpened = !isExpanded;
              });
              dispatch(
                companyDataActions.changeUpdateTreeStatus({
                  ...treeData,
                  data: { ...newTree },
                })
              );
            }}
          />
        )}
      </div>
    </Card>
  );
};

export default TitleCard;
