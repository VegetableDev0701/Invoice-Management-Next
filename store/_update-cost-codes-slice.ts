// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import {
//   addDivision,
//   addSubDivision,
//   deleteCostCode,
//   deleteDivision,
//   deleteSubDivision,
// } from '@/lib/utility/costCodeHelpers';
// import { CostCodesData } from '@/lib/models/budgetCostCodeModel';

// interface NewItem {
//   number: string;
//   name: string;
//   divisionNumber?: number;
//   subDivNumber?: number;
// }

// interface DeleteItem {
//   divisionNumber: number;
//   subDivNumber?: number;
//   costCodeNumber?: number;
// }

// interface StateData {
//   costCodes: CostCodesData;
// }

// const initialCostCodeState: StateData = {
//   costCodes: {
//     status: '',
//     format: '',
//     updated: true,
//     divisions: [],
//     currency: '',
//   },
// };

// export const costCodeSlice = createSlice({
//   name: 'costCodes',
//   initialState: initialCostCodeState,
//   reducers: {
//     setNewDivision(state, action: PayloadAction<NewItem>) {
//       const { number: divisionNum, name: divisionName } = action.payload;
//       addDivision(
//         { ...state.costCodes },
//         {
//           subdivisions: [],
//           number: +divisionNum,
//           name: divisionName,
//         }
//       );
//       state.costCodes = {
//         ...state.costCodes,
//         updated: true,
//       };
//     },
//     deleteDivision(state, action: PayloadAction<DeleteItem>) {
//       const { divisionNumber } = action.payload;
//       deleteDivision({ ...state.costCodes }, divisionNumber);

//       state.costCodes = { ...state.costCodes, updated: true };
//     },
//     setNewSubDivision(state, action: PayloadAction<NewItem>) {
//       const {
//         number: subDivNumber,
//         name: subDivName,
//         divisionNumber,
//       } = action.payload;
//       addSubDivision({ ...state.costCodes }, divisionNumber as number, {
//         number: +subDivNumber,
//         items: [],
//         name: subDivName,
//       });

//       state.costCodes = {
//         ...state.costCodes,
//         updated: true,
//       };
//     },
//     deleteSubDivision(state, action: PayloadAction<DeleteItem>) {
//       const { divisionNumber, subDivNumber } = action.payload;
//       deleteSubDivision(
//         { ...state.costCodes },
//         divisionNumber,
//         subDivNumber as number
//       );

//       state.costCodes = { ...state.costCodes, updated: true };
//     },
//     // setNewCostCode(state, action: PayloadAction<NewItem>) {
//     //   const {
//     //     number: costCodeNumber,
//     //     name: costCodeName,
//     //     divisionNumber,
//     //     subDivNumber,
//     //   } = action.payload;
//     //   addCostCode(
//     //     { ...state.costCodes },
//     //     divisionNumber as number,
//     //     subDivNumber as number,
//     //     {
//     //       number: +costCodeNumber,
//     //       value: '',
//     //       name: costCodeName,
//     //     }
//     //   );

//     //   state.costCodes = { ...state.costCodes, updated: true };
//     // },
//     deleteCostCode(state, action: PayloadAction<DeleteItem>) {
//       const { divisionNumber, subDivNumber, costCodeNumber } = action.payload;
//       deleteCostCode(
//         { ...state.costCodes },
//         divisionNumber,
//         subDivNumber as number,
//         costCodeNumber as number
//       );

//       state.costCodes = { ...state.costCodes, updated: true };
//     },
//     changeUpdateStatus(state, action: PayloadAction<boolean>) {
//       state.costCodes.updated = action.payload;
//     },
//   },
// });

// export default costCodeSlice;
// export const costCodeActions = costCodeSlice.actions;
