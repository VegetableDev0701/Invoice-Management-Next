import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  current,
} from '@reduxjs/toolkit';

import { uiActions } from './ui-slice';
import { RootState } from '.';
import { processingActions } from './processing-slice';
import { sseActions } from './sse-slice';

import { getAllProjectIds } from '@/lib/utility/projectHelpers';
import {
  ChangeOrderData,
  Labor,
  LaborData,
  ProjectFormData,
} from '@/lib/models/formDataModel';
import {
  ChangeOrderSummary,
  ClientBillSummary,
  ContractData,
  ContractEntry,
  ContractSummary,
  LaborSummary,
  ProjectSummary,
  SummaryTableRowType,
  getSummary,
} from '@/lib/models/summaryDataModel';
import { FormState, FormStateItem } from '@/lib/models/formStateModels';
import { getChangeOrderIdFromName } from '@/lib/utility/processInvoiceHelpers';
import { ProjectData, ProjectDataItems } from '@/lib/models/projectDataModel';
import {
  ChangeOrderContent,
  ChangeOrderContentItem,
} from '@/lib/models/changeOrderModel';
import { Invoices, ProcessedInvoiceData } from '@/lib/models/invoiceDataModels';
import { costCodeData2NLevel, createCostCodeList } from '@/lib/utility/costCodeHelpers';
import { fetchWithRetry } from '@/lib/utility/ioUtils';
import { snapshotCopy } from '@/lib/utility/utils';
import { setTargetValue } from '@/lib/utility/createSummaryDataHelpers';
import { addUpdatedChangeOrderContent } from './add-change-order';
import {
  CostCodeItem,
  CostCodesData,
  Divisions,
} from '@/lib/models/budgetCostCodeModel';

export const fetchProjectData = createAsyncThunk(
  'companyProjects/fetch',
  async ({ companyId }: { companyId: string }, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const allProjects: ProjectSummary = {
        ...state.data.projectsSummary.allProjects,
      };
      const activeProjectIds = getAllProjectIds(allProjects);
      const urls = activeProjectIds
        .map((projectId) => {
          return {
            [projectId as string]: `/api/${companyId}/projects/${projectId}/get-all-project-data`,
          };
        })
        .reduce((obj, item) => {
          let key = Object.keys(item)[0];
          obj[key] = item[key];
          return obj;
        }, {});

      const promises = Object.values(urls).map((url) =>
        fetchWithRetry(url, { method: 'GET' })
      );
      const results = await Promise.allSettled(promises);
      const data = Object.keys(urls).reduce<{
        [projectId: string]: any;
      }>((acc, projectId, index) => {
        if (results[index].status == 'fulfilled') {
          const fulfilledResult = results[index] as PromiseFulfilledResult<any>;
          acc[projectId] = fulfilledResult;
        } else if (results[index].status === 'rejected') {
          const rejectedResult = results[index] as PromiseRejectedResult;
          console.error(
            `Error fetching project data for ${projectId} after all retries:`,
            rejectedResult.reason
          );
          // handle error or set error in your `acc` object
        }
        return acc;
      }, {});
      thunkAPI.dispatch(processingActions.setFetchedProjectsStatus(true));
      return data;
    } catch (error: any) {
      console.error(error);
      return {
        status: error.status,
        code: error.code,
        error: error.message,
      };
    }
  }
);

export const deleteProjectData = createAsyncThunk(
  'companyProjects/deleteProjectItem',
  async (
    {
      companyId,
      sendData,
      projectId,
      dataType,
    }: {
      companyId: string;
      sendData:
        | string[]
        | {
            removeChangeOrderIds: string[];
            updateProcessedData: {
              [invoiceId: string]: { processedData: ProcessedInvoiceData };
            };
            laborToUpdate: LaborSummary;
          };
      projectId: string;
      dataType: string;
    },
    thunkAPI
  ) => {
    try {
      let url = '';
      let sendToBackend: any;
      if (dataType === 'labor') {
        url = `/api/${companyId}/projects/${projectId}/delete-labor`;
        sendToBackend = JSON.stringify(sendData);
      } else if (dataType === 'changeOrder') {
        url = `/api/${companyId}/projects/${projectId}/delete-change-order`;
        sendToBackend = JSON.stringify(sendData);
      } else if (dataType === 'contracts') {
        url = `/api/${companyId}/projects/${projectId}/delete-contract`;
        sendToBackend = JSON.stringify(sendData);
      } else if (dataType === 'client-bill') {
        thunkAPI.dispatch(
          sseActions.setWhatToListenFor({
            sseContentType: 'delete-client-bill',
          })
        );
        url = `/api/${companyId}/projects/${projectId}/delete-client-bill`;
        sendToBackend = JSON.stringify(sendData);
      }

      const response = await fetch(url, {
        method: 'DELETE',
        body: sendToBackend,
      });
      if (!response.ok) {
        console.error(response);
        throw new Error(`Something went wrong: ${response.status}`);
      }
      const data = await response.json();
      thunkAPI.dispatch(
        uiActions.setNotificationContent({
          content: data.message,
          icon: 'trash',
          openNotification: true,
        })
      );
    } catch (error: any) {
      console.error(error);
    }
  }
);

export const deleteProjects = createAsyncThunk(
  'companyProjects/deleteProjects',
  async (
    {
      companyId,
      projectsToDelete,
    }: { companyId: string; projectsToDelete: string[] },
    thunkAPI
  ) => {
    try {
      const response = await fetch(
        `/api/${companyId}/projects/delete-projects`,
        {
          method: 'DELETE',
          body: JSON.stringify(projectsToDelete),
        }
      );
      if (!response.ok) {
        throw new Error(`Something went wrong: ${response.status}`);
      }
      const data = await response.json();
      thunkAPI.dispatch(
        uiActions.setNotificationContent({
          content: data.message,
          icon: 'trash',
          openNotification: true,
        })
      );
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const changeProjectStatus = createAsyncThunk(
  'companyProjects/changeProjectStatus',
  async (
    {
      companyId,
      projectIds,
      changeStatusTo,
    }: { companyId: string; projectIds: string[]; changeStatusTo: boolean },
    thunkAPI
  ) => {
    try {
      const response = await fetch(
        `/api/${companyId}/projects/change-project-status`,
        {
          method: 'PATCH',
          headers: {
            changeStatusTo: changeStatusTo.toString(),
          },
          body: JSON.stringify(projectIds),
        }
      );
      if (!response.ok) {
        throw new Error(`Something went wrong: ${response.status}`);
      }
      const data = await response.json();
      thunkAPI.dispatch(
        uiActions.setNotificationContent({
          content: data.message,
          icon: 'success',
          openNotification: true,
        })
      );
    } catch (error: any) {
      thunkAPI.dispatch(
        uiActions.setNotificationContent({
          content: 'Something went wrong with updating the project status.',
          icon: 'error',
          openNotification: true,
        })
      );
      console.error(error);
    }
  }
);

export const removeLaborFromChangeOrderThunk = createAsyncThunk(
  'laborUpdates/removeLaborFromChangeOrder',
  async (
    {
      projectId,
      laborIds,
      companyId,
    }: {
      projectId: string;
      laborIds: string[];
      companyId: string;
    },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    const updatedChangeOrderSummary: ChangeOrderSummary = snapshotCopy(
      state.projects[projectId]['change-orders-summary']
    );
    let updatedChangeOrderContent: {
      [changeOrderId: string]: { content: ChangeOrderContent };
    } = {};

    if (Object.keys(updatedChangeOrderSummary).length > 0) {
      Object.entries(updatedChangeOrderSummary).forEach(
        ([changeOrderId, changeOrderObj]) => {
          Object.keys(changeOrderObj.content).forEach((contentKey) => {
            const uuid = contentKey.split('::').pop() as string;
            if (laborIds.includes(uuid)) {
              delete (changeOrderObj.content as ChangeOrderContent)[contentKey];
            }
          });
          updatedChangeOrderContent[changeOrderId] = {
            content: changeOrderObj.content as ChangeOrderContent,
          };
        }
      );
    }
    // remove from redux state (front end)
    thunkAPI.dispatch(
      projectDataActions.removeLaborFromChangeOrder({
        projectId,
        updatedChangeOrderContent,
      })
    );

    thunkAPI.dispatch(
      addUpdatedChangeOrderContent({
        companyId,
        projectId,
        updatedContent: updatedChangeOrderContent,
      })
    );
    // I think the above thunk takes care of this next section...
    // save updated to backend
    // try {
    //   const requestConfig = {
    //     url: `/api/${companyId}/projects/${projectId}/update-change-order`,
    //     method: `${overlayContent.isSave ? 'POST' : 'PATCH'}`,
    //     body: JSON.stringify({
    //       summaryData: changeOrderSummary,
    //       changeOrderId,
    //     }),
    //     headers: headers,
    //   };
    // } catch (error: any) {}
  }
);

const initialDataState: ProjectData = {};

const projectDataSlice = createSlice({
  name: 'projects',
  initialState: initialDataState,
  reducers: {
    updateCostCodeData(
      state,
      action: PayloadAction<{
        data: CostCodesData;
        projectId: string;
      }>
    ) {
      const { data, projectId } = action.payload;
      state[projectId] = {
        ...state[projectId],
        budget: data,
      };
    },
    addNewProject(
      state,
      action: PayloadAction<{
        data: ProjectFormData;
        projectId: string;
      }>
    ) {
      const { data, projectId } = action.payload;
      state[projectId] = {
        ...state[projectId],
        ...{ 'project-details': data },
      };
    },
    addSummaryTableRow(
      state,
      action: PayloadAction<
        {
          projectId: string;
        } & SummaryTableRowType
      >
    ) {
      const { newData, projectId, stateKey } = action.payload;
      state[projectId][stateKey] = {
        ...state[projectId][stateKey],
        ...{ [newData.uuid as string]: newData },
      };
    },
    addChangeOrderContent(
      state,
      action: PayloadAction<{
        content: { [changeOrderID: string]: ChangeOrderContent };
        projectId: string;
        formState: FormState;
        snapShotFormState: FormState | null;
        lineItems: Record<string, FormStateItem>;
        itemId: string;
      }>
    ) {
      // The logic here is that a user can select an individual line item, or the
      // whole invoice as a change order. In the change orders summary, this data
      // is kept in an object called content with all the data needed to create
      // the change order tables. When a user changes an item from one change order
      // to another, this code removes it from the old change order content data and
      // moves to the new change order.
      const {
        content,
        projectId,
        formState,
        snapShotFormState,
        itemId,
        lineItems,
      } = action.payload;

      const changeOrdersSummary = {
        ...state[projectId]['change-orders-summary'],
      };

      Object.entries(content).forEach(([newChangeOrderId, value]) => {
        if (
          typeof newChangeOrderId !== 'undefined' &&
          !Object.keys(changeOrdersSummary).every((changeOrderId) => {
            return changeOrderId !== newChangeOrderId;
          })
        ) {
          changeOrdersSummary[newChangeOrderId] =
            changeOrdersSummary[newChangeOrderId] || {};
          changeOrdersSummary[newChangeOrderId].content = {
            ...(changeOrdersSummary[newChangeOrderId]
              .content as ChangeOrderContent),
            ...value,
          } as any;
        }
      });
      // run a check to see if the current value is different than the previous value
      // if different, remove item from previous value and dispatch an update
      // pull out all the change order line items
      let ids = Object.entries(lineItems)
        .map(([key, _]) => {
          if (key.includes('change-order')) {
            return key;
          }
        })
        .filter((item) => item !== undefined) as string[];
      ids.push('change-order');

      const itemsChangedToNoneToRemoveFromChangeOrder = Object.entries(
        formState
      )
        .filter(([key, _]) => ids.includes(key))
        .map(([key, value]) => {
          if (value.value === 'None' || value.value === '') {
            return key;
          }
        })
        .filter((item) => item !== undefined)
        .map((item) => {
          if (item === 'change-order') {
            return itemId;
          } else {
            if (item) {
              const [number, ...rest] = item.split('-');
              return `line_item_${number}::${itemId}`;
            }
          }
        });

      let itemsSwitchedToRemoveFromChangeOrder: Record<string, string> = {};
      // todo make sure the missing co on delete bug goes away after removal from invoice
      if (snapShotFormState) {
        ids.forEach((id) => {
          // shows that the user changed to a different change order
          // i.e. change order 1 -> change order 2 but not change order 1 -> None
          // or vice versa
          if (
            snapShotFormState?.[id] &&
            formState?.[id] &&
            snapShotFormState[id].value !== formState[id].value &&
            formState[id].value !== 'None' &&
            formState[id].value !== '' &&
            snapShotFormState[id].value !== 'None' &&
            snapShotFormState[id].value !== ''
          ) {
            const [number, ...rest] = id.split('-');
            const newItemId =
              id === 'change-order' ? itemId : `line_item_${number}::${itemId}`;
            itemsSwitchedToRemoveFromChangeOrder[newItemId] =
              getChangeOrderIdFromName({
                changeOrdersSummary,
                changeOrderName: snapShotFormState[id].value as string,
              });
          }
        });
      }

      // if any change orders were removed (changed to None), this will delete them from the content
      // which is used to display the change orders in the change orders table
      if (itemsChangedToNoneToRemoveFromChangeOrder.length > 0) {
        Object.keys(changeOrdersSummary).forEach((changeOrderId) => {
          itemsChangedToNoneToRemoveFromChangeOrder.forEach((itemId) => {
            if (
              itemId &&
              (
                changeOrdersSummary[changeOrderId].content as ChangeOrderContent
              )?.[itemId]
            ) {
              delete (
                changeOrdersSummary[changeOrderId].content as ChangeOrderContent
              )[itemId];
            }
          });
        });
      }
      // if any change order were switched to new change order this will remove
      // the item from the change order it was switched from
      if (Object.keys(itemsSwitchedToRemoveFromChangeOrder).length > 0) {
        Object.entries(itemsSwitchedToRemoveFromChangeOrder).forEach(
          ([itemId, changeOrderId]) => {
            if (
              itemId &&
              (
                changeOrdersSummary[changeOrderId].content as ChangeOrderContent
              )?.[itemId]
            ) {
              delete (
                changeOrdersSummary[changeOrderId].content as ChangeOrderContent
              )[itemId];
            }
          }
        );
      }
      state[projectId]['change-orders-summary'] = changeOrdersSummary;
    },

    removeSelectedRow(
      state,
      action: PayloadAction<{
        projectId: string;
        ids: string[];
        stateKeyFull?: 'contracts' | 'labor' | 'change-orders';
        stateKeySummary:
          | 'change-orders-summary'
          | 'labor-summary'
          | 'contracts-summary'
          | 'client-bills-summary';
      }>
    ) {
      const { projectId, ids, stateKeyFull, stateKeySummary } = action.payload;

      const projectState = { ...state[projectId] };
      const summary = getSummary(projectState, stateKeySummary, projectId);

      const filteredSummary = Object.keys(summary)
        .filter((key) => !ids.includes(key))
        .reduce(
          (
            result:
              | ChangeOrderSummary
              | ContractSummary
              | LaborSummary
              | ClientBillSummary,
            key
          ) => {
            result[key] = summary[key];
            return result;
          },
          {}
        );
      state[projectId][stateKeySummary] = { ...filteredSummary };

      if (stateKeyFull) {
        const fullData: {
          [id: string]: LaborData | ContractEntry | ChangeOrderData;
        } = {
          ...(state[projectId][stateKeyFull] as {
            [id: string]: LaborData | ContractEntry | ChangeOrderData;
          }),
        };

        const filteredLabor = Object.keys(fullData)
          .filter((key) => !ids.includes(key))
          .reduce(
            (
              result: {
                [id: string]: LaborData | ContractEntry | ChangeOrderData;
              },
              key
            ) => {
              result[key] = fullData[key];
              return result;
            },
            {}
          );

        (state[projectId][stateKeyFull] as {
          [id: string]: LaborData | ContractEntry | ChangeOrderData;
        }) = { ...filteredLabor };
      }
    },
    // TODO fix the any typescript workaround
    addFullData(
      state,
      action: PayloadAction<{
        newData: any;
        projectId: string;
        stateKey:
          | 'budget'
          | 'change-orders'
          | 'contracts'
          | 'labor'
          | 'b2a'
          | 'client-bills';
      }>
    ) {
      const { newData, projectId, stateKey } = action.payload;
      if (newData?.uuid) {
        state[projectId][stateKey] = {
          ...state[projectId][stateKey],
          ...{ [newData.uuid]: newData },
        } as any;
      } else {
        state[projectId][stateKey] = {
          ...state[projectId][stateKey],
          ...newData,
        };
      }
    },
    addContractFromSSE(
      state,
      action: PayloadAction<{ newContracts: ContractData; projectId: string }>
    ) {
      const { newContracts, projectId } = action.payload;

      state[projectId].contracts = {
        ...newContracts,
        ...state[projectId].contracts,
      };
    },
    removeInvoiceIdFromChangeOrder(
      state,
      action: PayloadAction<{
        changeOrderId: string;
        invoiceId: string | string[];
        projectId: string;
      }>
    ) {
      const { changeOrderId, invoiceId, projectId } = action.payload;

      const changeOrderSummary = {
        ...state[projectId]['change-orders-summary'],
      };
      if (Object.keys(changeOrderSummary).length > 0) {
        const updatedChangeOrderSummary = (
          changeOrderSummary as ChangeOrderSummary
        )[changeOrderId];

        // let invoices: string[] = updatedChangeOrderSummary.invoices;
        const content = { ...updatedChangeOrderSummary.content };

        // Early I only wrote this for a single invoice, this expands it to
        // allow for remove multiple invoices at a time
        const invoiceIdsList =
          typeof invoiceId === 'string' ? [invoiceId] : invoiceId;

        // invoices = invoices.filter(
        //   (invoice) => !invoiceIdsList.includes(invoice)
        // );

        const removeItemIds = Object.keys(content).filter((contentKey) => {
          return invoiceIdsList.some((invoiceId) =>
            contentKey.includes(invoiceId)
          );
        });
        const filteredContent = Object.fromEntries(
          Object.entries(content).filter(
            ([contentKey, _]) => !removeItemIds.includes(contentKey)
          )
        );

        (state[projectId]['change-orders-summary'] as ChangeOrderSummary)[
          changeOrderId
        ] = {
          ...updatedChangeOrderSummary,
          // invoices,
          content: filteredContent,
        };
      }
    },
    removeLaborFromChangeOrder(
      state,
      action: PayloadAction<{
        updatedChangeOrderContent: {
          [changeOrderId: string]: { content: ChangeOrderContent };
        };
        projectId: string;
      }>
    ) {
      const { projectId, updatedChangeOrderContent } = action.payload;
      const updatedChangeOrdersSummary = {
        ...state[projectId]['change-orders-summary'],
      };

      Object.entries(updatedChangeOrderContent).forEach(
        ([changeOrderId, updatedContent]) => {
          updatedChangeOrdersSummary[changeOrderId] = {
            ...updatedChangeOrdersSummary[changeOrderId],
            ...updatedContent,
          };
        }
      );
      state[projectId]['change-orders-summary'] = updatedChangeOrdersSummary;
    },
    removeChangeOrderIdsFromAllLaborData(
      state,
      action: PayloadAction<{ laborToUpdate: LaborSummary; projectId: string }>
    ) {
      const { laborToUpdate, projectId } = action.payload;

      const laborFormDataToUpdate: Labor = snapshotCopy(
        state[projectId]['labor']
      ); // deep copy
      Object.entries(laborToUpdate).forEach(([laborId, laborSummaryObj]) => {
        const inputElements =
          laborFormDataToUpdate[laborId].mainCategories[1].inputElements;
        Object.entries(laborSummaryObj).forEach(([key, value]) => {
          if (key === 'line_items') {
            Object.keys(value).forEach((itemId) => {
              const itemNumber = itemId.split('_').pop(); // itemId is the form 'line_item_1'
              const targetId = `${itemNumber}-change-order`;
              setTargetValue({
                targetId,
                inputElements,
                setValue: null,
              });
            });
          }
        });
      });
      state[projectId]['labor'] = {
        ...laborFormDataToUpdate,
      };
      state[projectId]['labor-summary'] = {
        ...state[projectId]['labor-summary'],
        ...laborToUpdate,
      };
    },
    removeFullProjectData(state, action: PayloadAction<string[]>) {
      const allProjects: { [projectId: string]: ProjectDataItems } = {
        ...state,
      };

      const updatedProjects: { [projectId: string]: ProjectDataItems } =
        Object.keys(allProjects)
          .filter((projectId) => !action.payload.includes(projectId))
          .reduce(
            (obj: { [projectId: string]: ProjectDataItems }, key: string) => {
              obj[key] = allProjects[key];
              return obj;
            },
            {}
          );

      return { ...updatedProjects };
    },
    changeProjectStatus(
      state,
      action: PayloadAction<{ changeStatusTo: boolean; projectIds: string[] }>
    ) {
      const { changeStatusTo, projectIds } = action.payload;

      const allProjects = { ...state };

      const updatedProjects: { [projectId: string]: ProjectDataItems } =
        Object.keys(allProjects)
          .filter((projectId) => projectIds.includes(projectId))
          .reduce((obj: ProjectData, projectId: string) => {
            const projectChangeStatus = {
              ...allProjects[projectId]['project-details'],
            };
            projectChangeStatus.isActive = changeStatusTo;
            obj[projectId] = {
              ...allProjects[projectId],
              ...({ 'project-details': projectChangeStatus } as Record<
                string,
                ProjectFormData
              >),
            };
            return obj;
          }, {});

      return {
        ...state,
        ...updatedProjects,
      };
    },

    updateProjectsClientBillData(
      state,
      action: PayloadAction<{
        projectId: string;
        updatedLaborSummary: LaborSummary;
        updatedInvoices: Invoices;
        clientBillId: string;
      }>
    ) {
      const { projectId, updatedLaborSummary, updatedInvoices, clientBillId } =
        action.payload;
      const allLabor = state[projectId].labor;
      const allLaborSummary = state[projectId]['labor-summary'];

      const removedLabor = Object.fromEntries(
        Object.entries(allLabor).filter(
          ([laborId, labor]) =>
            !Object.keys(updatedLaborSummary).includes(labor.uuid as string)
        )
      );

      const removedLaborSummary = Object.fromEntries(
        Object.entries(allLaborSummary).filter(
          ([laborId, labor]) =>
            !Object.keys(updatedLaborSummary).includes(labor.uuid as string)
        )
      );

      const updatedLabor = Object.fromEntries(
        Object.entries(allLabor).filter(([laborId, labor]) =>
          Object.keys(updatedLaborSummary).includes(labor.uuid as string)
        )
      );

      state[projectId].labor = { ...removedLabor };
      state[projectId]['labor-summary'] = { ...removedLaborSummary };

      // Check if client-bills exists and if not create the first bill and
      // create that state object
      if (state[projectId]?.['client-bills']) {
        state[projectId]['client-bills'][clientBillId] = {
          ...state[projectId]['client-bills'][clientBillId],
          ...{ labor: updatedLabor },
          ...{ 'labor-summary': updatedLaborSummary },
          ...{ invoices: updatedInvoices },
        };
      } else {
        state[projectId]['client-bills'] = {
          [clientBillId]: {
            ...{ labor: updatedLabor },
            ...{ 'labor-summary': updatedLaborSummary },
            ...{ invoices: updatedInvoices },
          },
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      fetchProjectData.fulfilled,
      (
        state,
        action: PayloadAction<{
          [projectId: string]: PromiseFulfilledResult<any>;
        }>
      ) => {
        const isValidNumber = (currentNumber: number, parentNumber: number) => {
          return String(currentNumber).startsWith(String(parentNumber));
        };

        Object.entries(action.payload).forEach(([projectId, value]) => {
          const newData = JSON.parse(value.value);
          if (!newData) return;

          newData.budget = costCodeData2NLevel(newData.budget);


          const { costCodeList, costCodeNameList } = createCostCodeList(
            newData.budget
          );

          state[projectId] = {
            status: value.status,
            ...newData,
            costCodeList,
            costCodeNameList,
          };
        });
      }
    );
  },
});

export default projectDataSlice;
export const projectDataActions = projectDataSlice.actions;
