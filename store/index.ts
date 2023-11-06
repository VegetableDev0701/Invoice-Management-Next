import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import thunk, { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import localforage from 'localforage';

import currentPathSlice from '@/store/pathname-slice';
import addProjectFormSlice from '@/store/add-project-slice';
import addVendorFormSlice from '@/store/add-vendor-slice';
import userSlice from '@/store/user-slice';
import { companyDataSlice } from '@/store/company-data-slice';
import accountSettingsFormSlice from '@/store/account-settings-slice';
import uiSlice from '@/store/ui-slice';

import invoiceSlice from './invoice-slice';
import processingSlice from './processing-slice';
import sseSlice from './sse-slice';
import overlaySlice from './overlay-control-slice';
import addLaborFormSlice from './add-labor-slice';
import projectDataSlice from './projects-data-slice';
import addChangeOrderFormSlice from './add-change-order';
import addContractFormSlice from './add-contract';
import contractSlice from './contract-slice';
import addBudgetFormSlice from './add-budget-slice';
import addProcessInvoiceFormSlice from './add-process-invoice';
import addClientBillSlice from './add-client-bill';
import nodeEnvSlice from './node-env-slice';
import onboardUserFormSlice from './onboard-user-slice';

const rootReducer = combineReducers({
  path: currentPathSlice.reducer,
  addProjectForm: addProjectFormSlice.reducer,
  addVendorForm: addVendorFormSlice.reducer,
  addLaborForm: addLaborFormSlice.reducer,
  addChangeOrderForm: addChangeOrderFormSlice.reducer,
  addContractForm: addContractFormSlice.reducer,
  addBudgetForm: addBudgetFormSlice.reducer,
  addProcessInvoiceForm: addProcessInvoiceFormSlice.reducer,
  addClientBill: addClientBillSlice.reducer,
  addNewUserForm: onboardUserFormSlice.reducer,
  accountSettingsForm: accountSettingsFormSlice.reducer,
  user: userSlice.reducer,
  data: companyDataSlice.reducer,
  projects: projectDataSlice.reducer,
  ui: uiSlice.reducer,
  invoice: invoiceSlice.reducer,
  contract: contractSlice.reducer,
  processing: processingSlice.reducer,
  sse: sseSlice.reducer,
  overlay: overlaySlice.reducer,
  nodeEnv: nodeEnvSlice.reducer,
});

const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: string) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

let persistConfig;

if (typeof window !== 'undefined') {
  localforage.config({
    driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
    name: 'stak',
    version: 1.0,
    storeName: 'keyvaluepairs',
    description: 'Stak Technologies Browser Storage',
  });

  persistConfig = {
    key: 'root',
    storage: localforage,
  };
} else {
  const noopStorage = createNoopStorage();
  persistConfig = {
    key: 'root',
    storage: noopStorage,
  };
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => {
    return [
      ...getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          warnAfter: 64, // TODO reduce size on my store
        },
      }),
      thunk,
    ];
  },
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = ThunkDispatch<RootState, void, AnyAction>;
