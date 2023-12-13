import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { uiActions } from './ui-slice';
import { RootState } from '.';

import {
  FormState,
  IsTouchedPayload,
  SetFormElementPayload,
} from '@/lib/models/formStateModels';
import { resetAllFormValidation } from '@/lib/utility/formHelpers';
import { VendorData } from '@/lib/models/formDataModel';
import {
  createVendorFormData,
  createVendorFormStateData,
} from '@/lib/utility/vendorHelpers';
import { createSingleVendorSummary } from '@/lib/utility/createSummaryDataHelpers';
import { nanoid } from '@/lib/config';
import {
  VendorSummary,
  VendorSummaryItem,
} from '@/lib/models/summaryDataModel';
import { companyDataActions } from './company-data-slice';
import { RESET_STATE } from '@/lib/globals';

export const getVendorsAgave = createAsyncThunk(
  'vendorUpdates/getVendorsAgave',
  async (
    { companyId, taskId }: { companyId: string; taskId: string },
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    const addVendorFormData: Omit<VendorData, 'name' | 'vendorId' | 'uuid'> =
      state.data.forms['add-vendor'];

    thunkAPI.dispatch(
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
          thunkAPI.dispatch(
            uiActions.setModalContent({
              openModal: true,
              message:
                'It looks as though your Quickbooks Web Connector is not running, or you are not logged into your Quickbooks Desktop account. Please make sure to log in and open the Quickbooks Web Connector by navigating File -> App Management -> Update Web Services inside QuickBooks Desktop.',
              title: 'Not Logged in Error',
            })
          );
        } else if (data.error.includes('Account-Token')) {
          thunkAPI.dispatch(
            uiActions.setModalContent({
              openModal: true,
              message:
                'Your Account-Token is invalid. Make sure you have integrated Stak with your Quickbooks Desktop Account.',
              title: 'Invalid Account',
            })
          );
        } else {
          thunkAPI.dispatch(
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
      const data = await response.json();

      const allVendorData:
        | {
            allVendorsSummary: VendorSummary;
            allVendorsFormData: {
              [vendorId: string]: Omit<VendorData, 'vendorId' | 'name'>;
            };
          }
        | undefined =
        data.agave_response_data &&
        data.agave_response_data.data.reduce(
          (
            acc: {
              allVendorsSummary: VendorSummary;
              allVendorsFormData: {
                [vendorId: string]: Omit<VendorData, 'vendorId' | 'name'>;
              };
            },
            vendor: any
          ) => {
            const uuid = nanoid();
            const formState = createVendorFormStateData({
              agaveVendorData: vendor,
            });
            const formData = createVendorFormData({
              formData: addVendorFormData,
              formStateData: formState,
            });
            formData.uuid = uuid;
            const summaryVendorData = createSingleVendorSummary(
              formData,
              uuid,
              vendor.id as string | null
            );

            acc.allVendorsFormData[uuid] = formData;
            acc.allVendorsSummary[uuid] = summaryVendorData;
            return acc;
          },
          { allVendorsFormData: {}, allVendorsSummary: {} }
        );

      if (allVendorData) {
        thunkAPI.dispatch(
          companyDataActions.addToVendorsSummaryData(
            allVendorData.allVendorsSummary
          )
        );
        thunkAPI.dispatch(
          companyDataActions.addNewVendorsBulk(allVendorData.allVendorsFormData)
        );

        const requestConfig = {
          url: `/api/${companyId}/vendors/add-vendors-bulk`,
          method: 'POST',
          body: JSON.stringify({
            fullData: allVendorData.allVendorsFormData,
            summaryData: allVendorData.allVendorsSummary,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        };

        const add_vendor_response = await fetch(requestConfig.url, {
          method: requestConfig.method,
          body: requestConfig.body,
          headers: requestConfig.headers,
        });
        if (!add_vendor_response.ok) {
          throw new Error(
            `Something went wrong with posting new vendors: ${response.status}`
          );
        }
        const add_vendor_response_data = await add_vendor_response.json();
        thunkAPI.dispatch(
          uiActions.notify({
            content: add_vendor_response_data.message,
            icon: 'success',
          })
        );
      }
    } catch (error: any) {
      console.error(error);
      thunkAPI.dispatch(
        uiActions.notify({
          content: error.message,
          icon: 'error',
        })
      );
    } finally {
      thunkAPI.dispatch(
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
    thunkAPI
  ) => {
    const state = thunkAPI.getState() as RootState;
    const vendorsSummary = state.data.vendorsSummary.allVendors;

    const vendorIds: string[] = [];
    vendors.forEach((vendorSummaryItem) => {
      vendorIds.push(vendorSummaryItem.uuid);
      thunkAPI.dispatch(
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
            thunkAPI.dispatch(
              companyDataActions.addAgaveUUIDToVendorSummary({
                agave_uuid: jsonResponse.agave_uuid,
                vendorId: jsonResponse.uuid,
              })
            );
            thunkAPI.dispatch(
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
    } catch (error: any) {
      console.error(error);
      thunkAPI.dispatch(
        uiActions.notify({ content: error.message, icon: 'error' })
      );
    } finally {
      vendorIds.forEach((uuid) => {
        thunkAPI.dispatch(
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
          content: data.message,
          icon: 'trash',
        })
      );
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error);
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
