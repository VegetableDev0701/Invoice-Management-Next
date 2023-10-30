import { configureStore, PreloadedState } from '@reduxjs/toolkit';

import currentPathSlice from '@/store/pathname-slice';
import addProjectFormSlice from '@/store/add-project-slice';
import addVendorFormSlice from '@/store/add-vendor-slice';
import userSlice from '@/store/user-slice';
import accountSettingsFormSlice from '@/store/account-settings-slice';
import { companyDataSlice } from '@/store/company-data-slice';
import uiSlice, { initialUIState, InitialUIState } from '@/store/ui-slice';

import { FormState, InitialUserState } from '@/lib/models/formStateModels';
import { CompanyData } from '@/lib/models/companyDataModel';

const initialAcccountSettingsState: FormState = {};
const initialAddProjectFormState: FormState = {
  numRecurringFees: { value: 0 },
};
const initialAddVendorFormState: FormState = {};
const initialUserState: InitialUserState = {
  user: { user_metadata: { accountSettings: {} } },
};
const initialCompanyDataState = {} as CompanyData;

interface RootState {
  path: { currentPath: string };
  accountSettingsForm: typeof initialAcccountSettingsState;
  addProjectForm: typeof initialAddProjectFormState;
  addVendorForm: typeof initialAddVendorFormState;
  user: typeof initialUserState;
  data: typeof initialCompanyDataState;
  ui: typeof initialUIState;
}

export const setupStore = (preloadedState?: PreloadedState<RootState>) => {
  return configureStore({
    reducer: {
      path: currentPathSlice.reducer,
      addProjectForm: addProjectFormSlice.reducer,
      addVendorForm: addVendorFormSlice.reducer,
      user: userSlice.reducer,
      accountSettingsForm: accountSettingsFormSlice.reducer,
      data: companyDataSlice.reducer,
      ui: uiSlice.reducer,
    },
    preloadedState,
  });
};
