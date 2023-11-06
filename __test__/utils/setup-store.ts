import { configureStore, PreloadedState } from '@reduxjs/toolkit';

import currentPathSlice from '@/store/pathname-slice';
import addProjectFormSlice from '@/store/add-project-slice';
import addVendorFormSlice from '@/store/add-vendor-slice';
import userSlice from '@/store/user-slice';
import accountSettingsFormSlice from '@/store/account-settings-slice';
import { companyDataSlice } from '@/store/company-data-slice';
import uiSlice, { initialUIState } from '@/store/ui-slice';

import { FormState, User } from '@/lib/models/formStateModels';
import { CompanyData } from '@/lib/models/companyDataModel';
import { UserProfile } from '@auth0/nextjs-auth0/client';

const initialAcccountSettingsState: FormState = {};
const initialAddProjectFormState: FormState = {
  numRecurringFees: { value: 0 },
};
const initialAddVendorFormState: FormState = {};
const initialCompanyDataState = {} as CompanyData;

interface RootState {
  path: { currentPath: string };
  accountSettingsForm: typeof initialAcccountSettingsState;
  addProjectForm: typeof initialAddProjectFormState;
  addVendorForm: typeof initialAddVendorFormState;
  user: User;
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
