import {
  CostCodeItem,
  CostCodesData,
  Divisions,
  BudgetFormState,
  SubDivisions,
  BudgetTotals,
} from '@/lib/models/budgetCostCodeModel';
import { SelectMenuOptions } from '../models/formDataModel';
import { FormState } from '../models/formStateModels';

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

export function addSubDivision(
  costCodes: CostCodesData,
  divisionNumber: number,
  subdivision: SubDivisions,
  isAddToProject?: boolean
) {
  const division = costCodes.divisions.find((d) => d.number === divisionNumber);
  if (!division) {
    console.error('Division not found.');
    return;
  }
  if (isAddToProject) {
    const divInd = costCodes.divisions.findIndex(
      (d) => d.number === divisionNumber
    );
    return {
      divInd,
      newSubdivisions: [...division.subdivisions, ...[subdivision]].sort(
        (a, b) => a.number - b.number
      ),
    };
  } else {
    insertSorted(division.subdivisions, subdivision, 'number', false);
  }
}

export function deleteSubDivision(
  costCodes: CostCodesData,
  divisionNumber: number,
  subDivisionNumber: number,
  isDelFromProject?: boolean
) {
  const divIndex = costCodes.divisions.findIndex(
    (d) => d.number === divisionNumber
  );
  const subDivIndex = costCodes.divisions[divIndex].subdivisions.findIndex(
    (subDivision) => subDivision.number === subDivisionNumber
  );
  if (isDelFromProject) {
    return { divIndex, subDivIndex };
  } else {
    costCodes.divisions[divIndex].subdivisions.splice(subDivIndex, 1);
  }
}

export function addCostCode(
  costCodes: CostCodesData,
  divisionNumber: number,
  subdivisionNumber: number,
  item: CostCodeItem,
  isAddToProject?: boolean
) {
  const division = costCodes.divisions.find((d) => d.number === divisionNumber);
  if (!division) {
    console.error('Division not found.');
    return;
  }
  const subdivision = division.subdivisions.find(
    (s) => s.number === subdivisionNumber
  );
  if (!subdivision) {
    console.error('Subdivision not found.');
    return;
  }

  if (isAddToProject) {
    const divInd = costCodes.divisions.findIndex(
      (d) => d.number === divisionNumber
    );
    const subDivInd = division.subdivisions.findIndex(
      (s) => s.number === subdivisionNumber
    );
    return {
      divInd,
      subDivInd,
      newItems: [...subdivision.items, ...[item]].sort(
        (a, b) => a.number - b.number
      ),
    };
  } else {
    insertSorted(subdivision.items, item, 'number', false);
  }
}

export function deleteCostCode(
  costCodes: CostCodesData,
  divisionNumber: number,
  subDivNumber: number,
  costCodeNumber: number,
  isDelFromProject?: boolean
) {
  const divIndex = costCodes.divisions.findIndex(
    (d) => d.number === divisionNumber
  );
  const subDivIndex = costCodes.divisions[divIndex].subdivisions.findIndex(
    (subDiv) => subDiv.number === subDivNumber
  );
  const costCodeIndex = costCodes.divisions[divIndex].subdivisions[
    subDivIndex
  ].items.findIndex((item) => item.number === costCodeNumber);

  if (isDelFromProject) {
    return { divIndex, subDivIndex, costCodeIndex };
  } else {
    costCodes.divisions[divIndex].subdivisions[subDivIndex].items.splice(
      costCodeIndex,
      1
    );
  }
}

export function createCostCodeList(costCodes: CostCodesData) {
  const costCodeList: SelectMenuOptions[] = [];
  const costCodeNameList: SelectMenuOptions[] = [];
  let count = 1;
  costCodes.divisions?.forEach((division) => {
    division.subdivisions?.forEach((subDivision) => {
      subDivision.items?.forEach((item) => {
        costCodeList.push({ id: count, label: item.number.toFixed(4) });
        costCodeNameList.push({
          id: count,
          label: item.label,
          costCode: item.number.toFixed(4),
        });
        count++;
      });
    });
  });
  return {
    costCodeList: [{ id: 0, label: 'None' }, ...costCodeList],
    costCodeNameList: [{ id: 0, label: 'None' }, ...costCodeNameList],
  };
}

export function getCostCodeDescriptionFromNumber(
  costCodeNumber: string,
  costCodeNameList: SelectMenuOptions[]
) {
  const matchedItem = costCodeNameList.filter(
    (item) => item.costCode === costCodeNumber
  )[0];
  return matchedItem.label;
}

export const createInitBudgetState = ({
  costCodeFormData,
  isCollapsed,
}: {
  costCodeFormData: CostCodesData | null | undefined;
  isCollapsed: boolean;
}) => {
  const initState: BudgetTotals = {};
  if (!costCodeFormData) return;
  // Some conditional here that looks into the current project state for a budget
  costCodeFormData.divisions.forEach((div) => {
    div.subdivisions.forEach((subdiv) => {
      subdiv.items.forEach((item) => {
        const isAdded = item.value === '' ? false : true;
        const isShowing = isCollapsed && item.value === '' ? false : true;
        initState[item.id] = {
          value: item.value,
          type: 'BudgetTotal',
          isTouched: false,
          isValid: false,
          isAdded,
          isShowing,
          division: div.number,
          divisionName: div.name,
          subDivision: subdiv.number,
          subDivisionName: subdiv.name,
          costCodeName: item.label,
        };
      });
    });
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
