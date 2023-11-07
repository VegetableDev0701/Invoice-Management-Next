import { CostCodeItem, CostCodesData, Divisions, TreeData } from "../models/budgetCostCodeModel";
import { TreeItemIndex } from "react-complex-tree";

export class ConvertTreeData {
  private itemIndex;
  private result: TreeData;

  constructor() {
    this.itemIndex = 0;
    this.result = {
      root: {
        index: 'root',
        data: {
          format: '',
          currency: '',
          updated: false,
        },
      },
    };
  }

  getMaxItemIndex(): number {
    return this.itemIndex;
  }

  setMaxItemIndex(_index: number) {
    this.itemIndex = _index;
  }

  getTreeData(): TreeData {
    return this.result;
  }

  iterateAllItems = (
    divId: string,
    subItems: CostCodeItem[]
    //   cnt: number
  ) => {
    //   const subDivision = `item${cnt - 1}`;

    subItems?.forEach((subItem: CostCodeItem) => {
      const item = `item${this.itemIndex++}`;
      this.result[divId].children?.push(item);
      this.result[item] = {
        index: '',
        data: {
          name: '',
          number: 0,
          value: '',
          id: '',
          type: '',
          required: false,
          isCurrency: false,
          inputType: '',
        },
      };
      this.result[item].index = item;
      const { name, number, value, id, type, required, isCurrency, inputType } =
        subItem;
      this.result[item].data = {
        name,
        number,
        value,
        id,
        type,
        required,
        isCurrency,
        inputType,
        isOpened: subItem?.isOpened ?? false,
      };
      this.result[item].children = [];
      if (!subItem.subItems?.length) {
        return;
      } else {
        this.result[item].isFolder = true;
        this.iterateAllItems(item, subItem.subItems);
      }
    });
  };

  convertCostCode2TreeData = (costCodeData: CostCodesData): TreeData => {
    this.itemIndex = 0;
    this.result.root.children = [];
    this.result.root.data = {
      format: costCodeData.format,
      currency: costCodeData.currency,
      updated: costCodeData.updated,
      status: costCodeData?.status ?? undefined,
    };
    costCodeData.divisions?.forEach((division) => {
      const divisionItem = `item${this.itemIndex++}`;

      this.result.root.children?.push(divisionItem);
      this.result[divisionItem] = {
        index: '',
        data: {
          name: '',
          number: 0,
        },
      };
      this.result[divisionItem].index = divisionItem;
      this.result[divisionItem].data = {
        name: division.name,
        number: division.number,
        isOpened: division?.isOpened ?? false,
      };
      // `${division.number
      //   .toString()
      //   .padStart(2, "0")} - ${division.name}`;
      this.result[divisionItem].children = [];
      this.result[divisionItem].isFolder = division.subItems?.length > 0;
      this.iterateAllItems(divisionItem, division?.subItems);
    });

    return this.result;
  };

  iterateTreeItems = (
    costCodeData: CostCodeItem[],
    treeData: TreeData,
    itemsArray: TreeItemIndex[]
  ) => {
    if (!itemsArray?.length) return;

    itemsArray?.forEach((item, itemIndex) => {
      const {
        name = '',
        number = 0,
        value = '',
        id = '',
        type = '',
        required = false,
        isCurrency = false,
        inputType = '',
        isOpened,
      } = treeData[item]?.data as CostCodeItem;
      if (isOpened !== undefined) {
        costCodeData.push({
          name,
          number,
          value,
          id,
          type,
          required,
          isCurrency,
          inputType,
          isOpened,
          subItems: [],
        });
      } else {
        costCodeData.push({
          name,
          number,
          value,
          id,
          type,
          required,
          isCurrency,
          inputType,
          subItems: [],
        });
      }
      if (treeData[item].children?.length) {
        costCodeData[itemIndex].subItems = [];

        this.iterateTreeItems(
          costCodeData[itemIndex]?.subItems,
          treeData,
          treeData[item].children ?? []
        );
      }
    });
  };

  convertTreeData2CostCode = (treeData: TreeData): CostCodesData => {
    const {
      format = '',
      currency = '',
      updated = false,
      status = '',
    } = treeData.root?.data as CostCodesData;

    const costCodeData: CostCodesData = {
      format,
      currency,
      updated,
      status,
      divisions: [],
    };

    treeData.root?.children?.forEach((division, divIndex) => {
      const {
        name = '',
        number = 0,
        isOpened,
      } = treeData[division]?.data as Divisions;
      if (isOpened !== undefined) {
        costCodeData.divisions.push({
          name,
          number,
          isOpened,
          subItems: [],
        });
      } else {
        costCodeData.divisions.push({
          name,
          number,
          subItems: [],
        });
      }
      this.iterateTreeItems(
        costCodeData.divisions[divIndex].subItems,
        treeData,
        treeData[division].children ?? []
      );
    });

    return costCodeData;
  };

  calculateAllSubCost = (
    treeData: TreeData,
    parentItem: string,
    children: string[]
  ) => {
    const cost = {
      sum: 0,
      total: 0,
    };
    for (const child of children) {
      if (treeData[child].children.length > 0) {
        cost.total += this.calculateAllSubCost(
          treeData,
          child,
          treeData[child].children as string[]
        );
        cost.sum = cost.total;
      } else {
        cost.sum = parseFloat(
          (treeData[child].data as CostCodeItem)?.value ?? '0.0'
        );
        cost.total += cost.sum;
        (treeData[child].data as CostCodeItem).value = Number.isNaN(cost.sum)
          ? '0.00'
          : cost.sum.toFixed(2);
      }
    }
    (treeData[parentItem].data as CostCodeItem).value = Number.isNaN(cost.total)
      ? '0.00'
      : cost.total.toFixed(2);
    return Number.isNaN(cost.total) ? 0.0 : cost.total;
  };

  calculateCostCode = (treeData: TreeData, divIndex: string = '') => {
    if (!divIndex) {
      for (const child of treeData.root.children as string[]) {
        (treeData[child].data as Divisions).value = this.calculateAllSubCost(
          treeData,
          child,
          treeData[child]?.children as string[]
        ).toFixed(2);
      }
    } else {
      (treeData[divIndex].data as Divisions).value = this.calculateAllSubCost(
        treeData,
        divIndex,
        treeData[divIndex]?.children as string[]
      ).toFixed(2);
    }
  };

  getTotalBudget = (treeData: TreeData) => {
    let res = 0;
    treeData.root.children.forEach((child) => {
      res += parseFloat((treeData[child].data as Divisions).value);
    });
    return res;
  };

  getTotalDivision = (treeData: TreeData) => {
    let res = {};
    treeData.root.children.forEach((child) => {
      res = {
        ...res,
        [(treeData[child].data as Divisions).number]: {
          name: (treeData[child].data as Divisions).name,
          value: parseFloat((treeData[child].data as Divisions).value),
        },
      };
    });
    return res;
  };

  getTotalSubDivision = (treeData: TreeData) => {
    let res = {};
    treeData.root.children.forEach((division) => {
      treeData[division].children.forEach((subDivision) => {
        res = {
          ...res,
          [(treeData[subDivision].data as CostCodeItem).number]: {
            division: (treeData[division].data as CostCodeItem).number,
            value: parseFloat(
              (treeData[subDivision].data as CostCodeItem).value
            ),
            name: (treeData[subDivision].data as CostCodeItem).name,
          },
        };
      });
    });
    return res;
  };

  removeCostCodeItem = (itemIndex: string) => {
    this.result[itemIndex]?.children?.forEach((item: TreeItemIndex) => {
      this.removeCostCodeItem(item.toString());
    });
    delete this.result[itemIndex];
  };

  sortTreeDataByIndex = (treeData: TreeData) => {
    Object.keys(treeData)?.forEach((key: string) => {
      treeData[key].children?.sort((a, b) => {
        if (
          ((treeData[a]?.data as Omit<CostCodeItem, 'subItems'>)?.number ?? 0) >
          ((treeData[b]?.data as Omit<CostCodeItem, 'subItems'>)?.number ?? 0)
        ) {
          return 1;
        }
        return -1;
      });
    });
  };
}
