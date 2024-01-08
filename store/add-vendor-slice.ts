import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { companyDataActions } from './company-data-slice';
import { uiActions } from './ui-slice';
import { RootState } from '.';

import {
  FormState,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import {
  VendorSummary,
  VendorSummaryItem,
} from '@/lib/models/summaryDataModel';
import { RESET_STATE } from '@/lib/globals';
import {
  SyncAllVendorResponseData,
  UpdateDocData,
} from '@/lib/models/vendorModel';
import { updateVendorDocs } from '@/lib/utility/vendorHelpers';

export const getVendorsAgave = createAsyncThunk(
  'vendorUpdates/getVendorsAgave',
  async (
    { companyId, taskId }: { companyId: string; taskId: string },
    { dispatch }
  ) => {
    dispatch(
      uiActions.setTaskLoadingState({
        taskId,
        isLoading: true,
      })
    );

    try {
      const response = await fetch(
        `/api/${companyId}/vendors/get-vendors-agave`
      );
      // if error
      if (!response.ok) {
        const data = await response.json();
        if (data.error.includes('offline')) {
          dispatch(
            uiActions.setModalContent({
              openModal: true,
              message:
                'It looks as though your Quickbooks Web Connector is not running, or you are not logged into your Quickbooks Desktop account. Please make sure to log in and open the Quickbooks Web Connector by navigating File -> App Management -> Update Web Services inside QuickBooks Desktop.',
              title: 'Not Logged in Error',
            })
          );
        } else if (data.error.includes('Account-Token')) {
          dispatch(
            uiActions.setModalContent({
              openModal: true,
              message:
                'Your Account-Token is invalid. Make sure you have integrated Stak with your Quickbooks Desktop Account.',
              title: 'Invalid Account',
            })
          );
        } else {
          dispatch(
            uiActions.notify({
              content: data.error,
              icon: 'error',
            })
          );
        }
        throw new Error(
          `Retrieving vendors from accounting software failed: ${response.status}`
        );
      }

      // if succeed
      const data: SyncAllVendorResponseData = await response.json();

      dispatch(
        companyDataActions.addToVendorsSummaryData(data.agave_response_data)
      );

      // updates all documents that have missing or unsynced vendor data
      updateVendorDocs({ dispatch, data: data.update_doc_data });
      dispatch(
        uiActions.notify({
          content: data.message,
          icon: 'success',
        })
      );
    } catch (error: any) {
      console.error(error);
      dispatch(
        uiActions.notify({
          content: error.message,
          icon: 'error',
        })
      );
    } finally {
      dispatch(
        uiActions.setTaskLoadingState({
          taskId,
          isLoading: false,
        })
      );
    }
  }
);

export const syncVendors = createAsyncThunk(
  'vendorUpdates/syncVendors',
  async (
    { companyId, vendors }: { companyId: string; vendors: VendorSummaryItem[] },
    { getState, dispatch }
  ) => {
    const state = getState() as RootState;
    const vendorsSummary = state.data.vendorsSummary.allVendors;

    const vendorIds: string[] = [];
    vendors.forEach((vendorSummaryItem) => {
      vendorIds.push(vendorSummaryItem.uuid);
      dispatch(
        uiActions.setTaskLoadingState({
          taskId: vendorSummaryItem.uuid,
          isLoading: true,
        })
      );
    });

    const vendorObj = vendors.reduce((acc: VendorSummary, vendor) => {
      acc[vendor.uuid] = vendor;
      return acc;
    }, {});

    try {
      const response = await fetch(
        `/api/${companyId}/vendors/sync-vendors-agave`,
        {
          method: 'PATCH',
          body: JSON.stringify(vendorObj),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok) {
        throw new Error('Error when trying to sync vendors.');
      }
      const data: {
        data: {
          [vendorId: string]: {
            message: string;
            agave_uuid?: string;
            uuid?: string;
          };
        };
        update_doc_data: UpdateDocData;
      } = await response.json();
      if (data.data) {
        Object.values(data.data).forEach((jsonResponse) => {
          if (
            jsonResponse?.message &&
            jsonResponse.message.includes('offline')
          ) {
            throw new Error(`Your Quickbooks Web Connector is not currently running, or 
            you are not logged into your Quickbooks Desktop account.`);
          } else if (
            jsonResponse?.message &&
            jsonResponse.message.includes('Account-Token')
          ) {
            throw new Error(`Your Account-Token is invalid. Make sure you have integrated Stak with 
            your Quickbooks Desktop Account.`);
          } else if (jsonResponse?.agave_uuid && jsonResponse?.uuid) {
            dispatch(
              companyDataActions.addAgaveUUIDToVendorSummary({
                agave_uuid: jsonResponse.agave_uuid,
                vendorId: jsonResponse.uuid,
              })
            );
            dispatch(
              uiActions.notify({
                content: `Successfully added ${
                  (vendorsSummary as VendorSummary)[jsonResponse.uuid]
                    .vendorName
                }.`,
                icon: 'success',
              })
            );
          }
        });
      }
      // updates all documents that have missing or unsynced vendor data
      updateVendorDocs({ dispatch, data: data.update_doc_data });
    } catch (error: any) {
      console.error(error);
      dispatch(uiActions.notify({ content: error.message, icon: 'error' }));
    } finally {
      vendorIds.forEach((uuid) => {
        dispatch(
          uiActions.setTaskLoadingState({
            taskId: uuid,
            isLoading: false,
          })
        );
      });
    }
  }
);

export const deleteVendors = createAsyncThunk(
  'vendorUpdates/deleteVendors',
  async (
    {
      companyId,
      vendorsToDelete,
    }: { companyId: string; vendorsToDelete: string[] },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    const vendorSummary = state.data.vendorsSummary.allVendors as VendorSummary;

    thunkAPI.dispatch(
      uiActions.setProcessingNotificationContent({
        openNotification: true,
        content: 'Deleting Vendors',
      })
    );
    try {
      const response = await fetch(`/api/${companyId}/vendors/delete-vendors`, {
        method: 'DELETE',
        body: JSON.stringify(vendorsToDelete),
      });
      if (!response.ok) {
        throw new Error(`Something went wrong: ${response.status}`);
      }
      const data = await response.json();
      thunkAPI.dispatch(
        uiActions.notify({
          content: data.message_stak,
          icon: 'trash',
        })
      );
      Object.entries(data as Record<string, string>).forEach(
        ([key, response]) => {
          if (key.includes('stak')) return;
          if (key.includes('offline')) {
            thunkAPI.dispatch(
              uiActions.setModalContent({
                openModal: true,
                title: 'Not Logged Into Quickbooks',
                message: `No vendors were deleted from Quickbooks. You may need to log in to Quickbooks and open the Web Connector. \n\n
                  The vendors selected were deleted from Stak, so you need to delete those vendors from within Quickbooks. If you sync the data 
                  from Quickbooks, those vendors will reappear.`,
              })
            );
            return;
          }
          if (key.includes('some')) {
            const vendorUUID = JSON.parse(
              response.split(':')[1].trim().replace(/'/g, '"')
            );
            const vendorNames = vendorUUID.reduce(
              (obj: { [vendorId: string]: string }, key: string) => {
                if (key in vendorSummary) {
                  obj[key] = vendorSummary[key].vendorName;
                }
              },
              {}
            );
            thunkAPI.dispatch(
              uiActions.setModalContent({
                openModal: true,
                title: 'Not Logged In',
                message: `The following vendors were not deleted from Quickbooks: ${vendorNames}`,
              })
            );
            return;
          }
          if (key.includes('error')) {
            uiActions.setModalContent({
              openModal: true,
              title: 'Not Logged In',
              message: `The server timed out when trying to delete vendors. You may need to log in to Quickbooks and open the Web Connector. `,
            });

            return;
          } else {
            thunkAPI.dispatch(
              uiActions.notify({
                content: data.message_agave_success,
                icon: 'trash',
              })
            );
          }
        }
      );
    } catch (error: any) {
      thunkAPI.dispatch(
        uiActions.notify({
          content: error.message,
          icon: 'error',
        })
      );
    } finally {
      thunkAPI.dispatch(
        uiActions.setProcessingNotificationContent({
          openNotification: false,
        })
      );
    }
  }
);

const initialAddVendorFormState: FormState = {};

const addVendorFormSlice = createSlice({
  name: 'addVendorForm',
  initialState: initialAddVendorFormState,
  reducers: {
    setFormElement(state, action: PayloadAction<SetFormElementPayload>) {
      const { inputValue, inputKey, isValid } = action.payload;
      state[inputKey] = {
        ...state[inputKey],
        value: inputValue,
        isValid: isValid,
      };
    },
    clearFormState() {
      return initialAddVendorFormState;
    },
    setIsTouchedState(state, action: PayloadAction<IsTouchedPayload>) {
      const { inputKey, isTouched, isValid } = action.payload;

      state[inputKey] = {
        ...state[inputKey],
        isValid: isValid,
        isTouched: isTouched,
      };
    },
    resetFormValidation(state) {
      return resetAllFormValidation(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(RESET_STATE, () => initialAddVendorFormState);
  },
});

export default addVendorFormSlice;
export const addVendorFormActions = addVendorFormSlice.actions;
