import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  ChangeOrderFormState,
  IsTouchedPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import { RootState } from '.';
import {
  createInitBudgetState,
  setCollapsed,
} from '@/lib/utility/costCodeHelpers';
import { calculateTotals } from '@/lib/utility/budgetHelpers';
import {
  BudgetTotals,
  CostCodesData,
  UpdateBudget,
} from '@/lib/models/budgetCostCodeModel';
import { createB2AChartData } from '@/lib/utility/chartHelpers';
import { projectDataActions } from './projects-data-slice';
import { ChangeOrderChartData, ChartData } from '@/lib/models/chartDataModels';

type ProjectBudgetTotals = PayloadAction<{
  total: string;
  subDivisionTotals: {
    [key: string]: {
      value: string;
      division: number;
      name: string;
    };
  };
  divisionTotals: {
    [key: string]: {
      value: string;
      name: string;
    };
  };
}>

export const initializeBudgetThunk = createAsyncThunk(
  'budget/initializeBudgetThunk',
  async ({ projectId }: { projectId: string }, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;

    const projectBudget: CostCodesData | null | undefined =
      state.projects[projectId].budget;

    return createInitBudgetState({
      costCodeFormData: projectBudget ?? state.data.costCodes,
      isCollapsed: state.addBudgetForm.isCollapsed,
    });
  }
);

export const initializeBudgetTotalsThunk = createAsyncThunk(
  'budget/initializeBudgetTotalsThunk',
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const { total, subDivisionTotals, divisionTotals } = calculateTotals({
      budget: state.addBudgetForm.budget,
      isChangeOrder: false,
    });
    thunkAPI.dispatch(
      addBudgetFormActions.initializeBudgetTotals({
        total,
        subDivisionTotals,
        divisionTotals,
      })
    );
  }
);

export const initializeB2AChartDataThunk = createAsyncThunk(
  'budget/initializeB2AChartDataThunk',
  async (
    { projectId, companyId }: { projectId: string; companyId: string },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    let b2aChartDataChangeOrder: ChangeOrderChartData | null = {};
    let updatedCurrentActualsChangeOrders: ChangeOrderFormState | null = {};
    let initActualsToZeros: boolean = false;
    let previousData: ChartData | undefined = undefined;
    if (
      state.projects[projectId].b2a?.b2aChartData &&
      Object.keys(state.projects[projectId].b2a.b2aChartData).length > 0
    ) {
      initActualsToZeros = false;
      previousData = state.projects[projectId].b2a.b2aChartData;
    } else {
      initActualsToZeros = true;
    }

    // check for the b2aChangeOrder chart data
    if (
      state.projects[projectId].b2a?.b2aChartDataChangeOrder &&
      Object.keys(state.projects[projectId].b2a.b2aChartDataChangeOrder)
        .length > 0
    ) {
      b2aChartDataChangeOrder = state.projects[projectId].b2a
        .b2aChartDataChangeOrder as unknown as ChangeOrderChartData;
    } else {
      b2aChartDataChangeOrder = null;
    }

    // check for any currentActualsChangeOrder data to initilize into the state
    if (
      state.projects[projectId].b2a?.updatedCurrentActualsChangeOrders &&
      Object.keys(
        state.projects[projectId].b2a.updatedCurrentActualsChangeOrders
      ).length > 0
    ) {
      updatedCurrentActualsChangeOrders = state.projects[projectId].b2a
        .updatedCurrentActualsChangeOrders as unknown as ChangeOrderFormState;
    } else {
      updatedCurrentActualsChangeOrders = null;
    }

    const currentBudgetedTotal =
      state.projects[projectId].b2a.currentBudgetedTotal.value ?? 0;
    const currentGrandTotal =
      state.projects[projectId].b2a.currentGrandTotal.value ?? 0;
    const currentChangeOrderTotal =
      state.projects[projectId].b2a.currentChangeOrderTotal.value ?? 0;

    const { chartData: b2aChartData } = createB2AChartData({
      divisionTotals: state.addBudgetForm.totalDivisions,
      subDivTotals: state.addBudgetForm.totalSubDivisions,
      costCodeTotals: state.addBudgetForm.budget,
      currentBudgetedTotal,
      initActualsToZeros,
      previousData,
    });

    thunkAPI.dispatch(
      projectDataActions.addFullData({
        newData: {
          b2aChartData,
          b2aChartDataChangeOrder,
          updatedCurrentActualsChangeOrders,
          currentBudgetedTotal: { value: currentBudgetedTotal },
          currentGrandTotal: { value: currentGrandTotal },
          currentChangeOrderTotal: { value: currentChangeOrderTotal },
        },
        projectId,
        stateKey: 'b2a',
      })
    );
    try {
      const response = await fetch(
        `/api/${companyId}/projects/${projectId}/add-b2achartdata`,
        {
          method: 'POST',
          body: JSON.stringify({
            b2aChartData,
            b2aChartDataChangeOrder,
            updatedCurrentActualsChangeOrders,
            currentBudgetedTotal: {
              value: Number(currentBudgetedTotal.toFixed(2)),
            },
            currentGrandTotal: { value: Number(currentGrandTotal.toFixed(2)) },
            currentChangeOrderTotal: {
              value: Number(currentChangeOrderTotal.toFixed(2)),
            },
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`Error in pushing B2A Chart Data ${response.status}`);
      }
    } catch (error) {
      console.error(error);
    }
  }
);

const initialBudgetFormState: {
  isCollapsed: boolean;
  totalBudget: string;
  totalSubDivisions: {
    [key: string]: { value: string; division: number; name: string };
  };
  totalDivisions: { [key: string]: { value: string; name: string } };
  budget: BudgetTotals;
  updateBudget: UpdateBudget;
} = {
  isCollapsed: false,
  totalBudget: '',
  totalSubDivisions: {},
  totalDivisions: {},
  budget: {},
  updateBudget: {
    addCostCodes: null,
    addSubDivisions: null,
    addDivisions: null,
    deleteCostCodes: null,
    deleteDivisions: null,
    deleteSubDivisions: null,
  },
};

const addBudgetFormSlice = createSlice({
  name: 'addBudgetForm',
  initialState: initialBudgetFormState,
  reducers: {
    setFormElement(state, action: ProjectBudgetTotals) {
      const { total, subDivisionTotals, divisionTotals } = action.payload;
      state.totalBudget = total;
      state.totalSubDivisions = subDivisionTotals;
      state.totalDivisions = divisionTotals;
    },
    clearFormState(state) {
      return initialBudgetFormState;
    },
    initializeBudgetTotals(
      state,
      action: ProjectBudgetTotals
    ) {
      const { total, subDivisionTotals, divisionTotals } = action.payload;
      state.totalBudget = total;
      state.totalSubDivisions = subDivisionTotals;
      state.totalDivisions = divisionTotals;
    },
    setIsTouchedState(state, action: PayloadAction<IsTouchedPayload>) {
      const { inputKey, isTouched, isValid } = action.payload;
      state.budget[inputKey] = {
        ...state.budget[inputKey],
        value: state.budget[inputKey]?.value
          ? state.budget[inputKey].value
          : '',
        isValid: isValid,
        isTouched: isTouched,
      };
    },
    resetFormValidation(state) {
      state.budget = resetAllFormValidation(state.budget) as BudgetTotals;
    },
    setIsAddedState(
      state,
      action: PayloadAction<{ inputKey: string; isAdded: boolean }>
    ) {
      const { inputKey, isAdded } = action.payload;
      state.budget[inputKey].isAdded = isAdded;
    },
    setCollapse(state, action: PayloadAction<boolean>) {
      state.isCollapsed = action.payload;
      const budget = { ...state.budget };
      state.budget = {
        ...setCollapsed({ budget, isCollapsed: action.payload }),
      };
    },
    resetUpdateBudget(state) {
      state.updateBudget = {
        addCostCodes: null,
        addSubDivisions: null,
        addDivisions: null,
        deleteCostCodes: null,
        deleteDivisions: null,
        deleteSubDivisions: null,
      };
    },
    addToUpdateBudgetList(
      state,
      action: PayloadAction<{
        name?: string;
        number?: string;
        divisionNumber?: number;
        subDivNumber?: number;
        costCodeNumber?: number;
        isDelete?: boolean;
      }>
    ) {
      const {
        name,
        number,
        divisionNumber,
        subDivNumber,
        costCodeNumber,
        isDelete,
      } = action.payload;

      if (isDelete) {
        if (
          divisionNumber !== undefined &&
          subDivNumber !== undefined &&
          costCodeNumber !== undefined
        ) {
          state.updateBudget.deleteCostCodes
            ? state.updateBudget.deleteCostCodes.push({
                divisionNumber,
                subDivNumber,
                costCodeNumber,
              })
            : (state.updateBudget.deleteCostCodes = [
                { divisionNumber, subDivNumber, costCodeNumber },
              ]);
        } else if (
          divisionNumber !== undefined &&
          subDivNumber !== undefined &&
          costCodeNumber === undefined
        ) {
          state.updateBudget.deleteSubDivisions
            ? state.updateBudget.deleteSubDivisions.push({
                divisionNumber,
                subDivNumber,
              })
            : (state.updateBudget.deleteSubDivisions = [
                { divisionNumber, subDivNumber },
              ]);
        } else if (
          divisionNumber !== undefined &&
          subDivNumber === undefined &&
          costCodeNumber === undefined
        ) {
          state.updateBudget.deleteDivisions
            ? state.updateBudget.deleteDivisions.push({ divisionNumber })
            : (state.updateBudget.deleteDivisions = [{ divisionNumber }]);
        }
      } else {
        if (
          divisionNumber !== undefined &&
          subDivNumber !== undefined &&
          name !== undefined &&
          number !== undefined
        ) {
          state.updateBudget.addCostCodes
            ? state.updateBudget.addCostCodes.push({
                name,
                number,
                divisionNumber,
                subDivNumber,
              })
            : (state.updateBudget.addCostCodes = [
                {
                  name,
                  number,
                  divisionNumber,
                  subDivNumber,
                },
              ]);
        } else if (
          divisionNumber !== undefined &&
          subDivNumber === undefined &&
          name !== undefined &&
          number !== undefined
        ) {
          state.updateBudget.addSubDivisions
            ? state.updateBudget.addSubDivisions.push({
                name,
                number,
                divisionNumber,
              })
            : (state.updateBudget.addSubDivisions = [
                {
                  name,
                  number,
                  divisionNumber,
                },
              ]);
        } else if (
          divisionNumber === undefined &&
          subDivNumber === undefined &&
          name !== undefined &&
          number !== undefined
        ) {
          state.updateBudget.addDivisions
            ? state.updateBudget.addDivisions.push({
                name,
                number,
              })
            : (state.updateBudget.addDivisions = [
                {
                  name,
                  number,
                },
              ]);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeBudgetThunk.fulfilled, (state, action) => {
      state.budget = { ...action.payload } as BudgetTotals;
    });
  },
});

export default addBudgetFormSlice;
export const addBudgetFormActions = addBudgetFormSlice.actions;
