import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { ContractEntry } from '@/lib/models/summaryDataModel';

import { uiActions } from './ui-slice';
import { sseActions } from './sse-slice';

export interface ContractSummaryData {
  vendor: string;
  contractAmt: string;
  date: string;
  workDescription: string;
}

export interface ContractState {
  isLoading: boolean;
  signedUrls: {
    [contractId: string]: { signedUrls: string[]; expiration: number };
  };
  clickedContract: ContractEntry | null;
  isRowClicked: boolean;
  anyContractUpdated: boolean;
}

const initialContractState: ContractState = {
  isLoading: false,
  isRowClicked: false,
  clickedContract: null,
  signedUrls: {},
  anyContractUpdated: false,
};

export const getSignedUrlContract = createAsyncThunk(
  'contractUpdates/getSignedUrl',
  async (
    {
      companyId,
      projectId,
      contract,
    }: {
      companyId: string;
      projectId: string;
      contract: {
        gcs_img_uri: string[];
        gcs_uri: string;
        summaryData: ContractSummaryData;
        uuid: string;
      };
    },
    thunkAPI
  ) => {
    try {
      const response = await fetch(
        `/api/${companyId}/projects/${projectId}/get-signed-url`,
        {
          method: 'GET',
          headers: {
            docId: contract.uuid,
            filenames: JSON.stringify(contract.gcs_img_uri),
          },
        }
      );
      const data = await response.json();
      return {
        contractId: contract.uuid,
        signedUrls: data.signed_urls,
        expiration: data.expiration,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const deleteContracts = createAsyncThunk(
  'contractUpdates/deleteContracts',
  async (
    {
      companyId,
      projectId,
      contractsToDelete,
    }: { companyId: string; projectId: string; contractsToDelete: string[] },
    thunkAPI
  ) => {
    try {
      const response = await fetch(
        `/api/${companyId}/projects/${projectId}/delete-contracts`,
        {
          method: 'DELETE',
          body: JSON.stringify(contractsToDelete),
        }
      );
      if (!response.ok) {
        throw new Error(`Something went wrong: ${response.status}`);
      }
      if (response.status >= 200 && response.status < 300) {
        thunkAPI.dispatch(
          sseActions.setWhatToListenFor({
            sseContentType: 'delete-contracts',
          })
        );
      }
      const data = await response.json();
      thunkAPI.dispatch(
        uiActions.notify({
          content: data.message,
          icon: 'trash',
        })
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const contractSlice = createSlice({
  name: 'contractUpdates',
  initialState: initialContractState,
  reducers: {
    setClickedContract(
      state,
      action: PayloadAction<{
        contract?: ContractEntry | null;
        isRowClicked: boolean;
      }>
    ) {
      const { contract, isRowClicked } = action.payload;
      if (contract !== undefined) {
        state.clickedContract = contract;
      }
      state.isRowClicked = isRowClicked;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getSignedUrlContract.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getSignedUrlContract.fulfilled, (state, action) => {
      const { contractId, signedUrls, expiration } = action.payload;
      state.signedUrls[contractId] = { signedUrls, expiration };
      state.isLoading = false;
    });
    builder.addCase(getSignedUrlContract.rejected, (state, action) => {
      console.error(action.error);
      state.isLoading = false;
    });
  },
});

export default contractSlice;
export const contractActions = contractSlice.actions;
