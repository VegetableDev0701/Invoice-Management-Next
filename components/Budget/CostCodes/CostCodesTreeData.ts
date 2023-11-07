import { type TreeItem, type TreeItemIndex } from "react-complex-tree";

export interface CostCodesData {
  format: string;
  currency: string;
  updated: boolean;
  divisions: Divisions[];
  status?: string;
  // uuid?: string;
}

export interface Divisions {
  name: string;
  number: number;
  subItems: CostCodeItem[];
  isOpened?: boolean;
  value?: string;
}

export interface CostCodeItem {
  name: string;
  number: number;
  value?: string;
  id?: string;
  type?: string;
  required?: boolean;
  isCurrency?: boolean;
  inputType?: string;
  isOpened?: boolean;
  subItems: CostCodeItem[];
}

export type TreeData = Record<
  TreeItemIndex,
  TreeItem<Omit<CostCodeItem, "subItems"> | Omit<CostCodesData, "divisions">>
>;

export type CostCodeTreeData = {
  updated: boolean;
  data: TreeData;
};
