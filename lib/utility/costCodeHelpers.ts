import {
  CostCodeItem,
  CostCodesData,
  Divisions,
  BudgetFormState,
  SubDivisions,
  BudgetTotals,
  BudgetTotalsV2,
} from '@/lib/models/budgetCostCodeModel';
import { SelectMenuOptions } from '../models/formDataModel';
import { FormState } from '../models/formStateModels';
import {
  ChartDataV2,
  CostCodeItemB2AData,
  DivisionDataV2,
} from '../models/chartDataModels';

function insertSorted<
  T extends Divisions | SubDivisions | CostCodeItem,
  K extends keyof T
>(arr: T[], obj: T, key: K, isReturn: boolean) {
  const index = arr.findIndex((item) => item[key] > obj[key]);
  if (index === -1) {
    arr.push(obj);
  } else {
    arr.splice(index, 0, obj);
  }
  if (isReturn) {
    return arr;
  }
}

export const iterateData = ({
  data,
  level,
  cb,
}: {
  data: Divisions | CostCodeItem | DivisionDataV2 | CostCodeItemB2AData;
  level: Array<number>;
  cb: (item: CostCodeItem | CostCodeItemB2AData, level: Array<number>) => void;
}) => {
  if (data?.subItems?.length === 0) return;
  data?.subItems?.forEach((item, index) => {
    if (item.subItems && item.subItems?.length > 0)
      iterateData({ data: item, level: [...level, index], cb });
    else if (
      item?.isCurrency ||
      item?.value ||
      (item as CostCodeItemB2AData)?.actual
    )
      cb(item, [...level, index]);
  });
};

export function addDivision(
  costCodes: CostCodesData,
  newDivision: Divisions,
  isAddToProject?: boolean
) {
  if (isAddToProject) {
    return {
      newDivisions: [...costCodes.divisions, ...[newDivision]].sort(
        (a, b) => a.number - b.number
      ),
    };
  } else {
    insertSorted(costCodes.divisions, newDivision, 'number', false);
  }
}

export function deleteDivision(
  costCodes: CostCodesData,
  divisionNumber: number,
  isDelFromProject?: boolean
) {
  const divIndex = costCodes.divisions.findIndex(
    (d) => d.number === divisionNumber
  );
  if (isDelFromProject) {
    return { divIndex };
  } else {
    costCodes.divisions.splice(divIndex, 1);
  }
}

export function createCostCodeList(costCodes: CostCodesData) {
  const costCodeList: SelectMenuOptions[] = [{ id: 0, label: 'None' }];
  const costCodeNameList: SelectMenuOptions[] = [{ id: 0, label: 'None' }];

  if (!costCodes) {
    return {
      costCodeList,
      costCodeNameList,
    };
  }

  let count = 1;
  const addState = (
    item: CostCodeItem | CostCodeItemB2AData,
    _: Array<number>
  ) => {
    costCodeList.push({ id: count, label: String(item.number) });
    costCodeNameList.push({
      id: count,
      label: (item as CostCodeItem).label || item.name || '',
      costCode: String(item.number),
    });
    count++;
  };

  costCodes.divisions.forEach((div, index) => {
    iterateData({
      data: div,
      level: [index],
      cb: addState,
    });
  });

  return {
    costCodeList,
    costCodeNameList,
  };
}

export function getCostCodeDescriptionFromNumber(
  costCodeNumber: string,
  costCodeNameList: SelectMenuOptions[]
) {
  const matchedItem = costCodeNameList.filter(
    (item) => item.costCode === costCodeNumber
  )[0];
  return matchedItem?.label;
}

export const createInitBudgetState = ({
  costCodeFormData,
  isCollapsed,
}: {
  costCodeFormData: CostCodesData | null | undefined;
  isCollapsed: boolean;
}) => {
  const initState: BudgetTotalsV2 = {};
  if (!costCodeFormData) return;

  const addState = (
    _item: CostCodeItem | CostCodeItemB2AData,
    level: Array<number>
  ) => {
    const item = _item as CostCodeItem;
    const isAdded = item.value === '' ? false : true;
    const isShowing = isCollapsed && item.value === '' ? false : true;
    ``;
    initState[item.id || String(item.number)] = {
      value: item.value || '',
      costCodeName: item.name || '',
      type: 'BudgetTotalV2',
      isTouched: false,
      isValid: false,
      isAdded,
      isShowing,
      recursiveLevel: [...level],
    };
  };

  costCodeFormData.divisions.forEach((div, index) => {
    iterateData({ data: div, level: [index], cb: addState });
  });

  return initState;
};

export const setCollapsed = ({
  budget,
  isCollapsed,
}: {
  budget: BudgetTotals;
  isCollapsed: boolean;
}) => {
  const updated = Object.entries(budget).reduce(
    (obj: BudgetTotals, [costCode, costCodeObj]) => {
      const isShow =
        (isCollapsed && !costCodeObj.isAdded) ||
        (isCollapsed && costCodeObj.value === '')
          ? false
          : true;
      obj[costCode] = { ...costCodeObj, isShowing: isShow };
      return obj;
    },
    {}
  );
  return updated;
};

export const costCodeData2NLevel = (oldCostCodeData: any) => {
  if (
    (oldCostCodeData && oldCostCodeData.updated) ||
    !oldCostCodeData?.divisions?.filter((div: any) => div.subdivisions)?.length
  )
    return oldCostCodeData as CostCodesData;

  const isValidNumber = (currentNumber: number, parentNumber: number) => {
    return String(currentNumber).startsWith(String(parentNumber));
  };

  const newCostCodeData: CostCodesData = {
    currency: oldCostCodeData.currency,
    divisions: [],
    format: oldCostCodeData.format,
    updated: true,
  };

  oldCostCodeData.divisions.forEach((div: any, index: number) => {
    const newDivision: Divisions = {
      number: div?.number || index + 1,
      name: div?.name,
      subItems: [],
    };

    div.subdivisions.forEach((subdiv: any, subIndex: number) => {
      const newItem: CostCodeItem = {
        number: subdiv?.number || index + (subIndex + 1) / 10,
        name: subdiv?.name,
        subItems: [],
      };

      subdiv.items.forEach((item: any, ssubIndex: number) => {
        let _number = item?.number;
        if (!isValidNumber(_number, newItem.number)) {
          _number = +(String(newItem.number) + (ssubIndex + 1));
        }

        newItem.subItems!.push({
          number: _number,
          name: item?.name || item?.label,
          label: item?.label,
          id: String(_number.toFixed(4)),
          inputType: item?.inputType,
          isCurrency: item?.isCurrency,
          required: item?.required,
          type: item?.type,
          value: item?.value || '0',
        } as CostCodeItem);
      });

      newDivision.subItems!.push(newItem);
    });

    newCostCodeData.divisions.push(newDivision);
  });

  return newCostCodeData;
};

export const getDataByRecursiveLevel = ({
  fullData,
  level,
}: {
  fullData: Divisions[] | DivisionDataV2[];
  level: Array<number>;
}) => {
  if (level?.length === 0) return;

  let levelData:
    | Divisions
    | CostCodeItem
    | DivisionDataV2
    | CostCodeItemB2AData = fullData[level[0]];
  let prefix = '';
  for (let i = 1; i < level.length; i++) {
    let index = level[i];
    if (!levelData.subItems || levelData.subItems?.length <= index) {
      console.warn('[getDataByRecursiveLevel]: No data');
      return null;
    }

    if (levelData.name)
      prefix += `${levelData.number} - ${levelData.name}  /  `;
    levelData = levelData.subItems[index];
  }

  return {
    data: levelData,
    prefix,
  };
};
