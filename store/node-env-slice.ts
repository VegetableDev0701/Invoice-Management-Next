import { PayloadAction, createSlice, current } from '@reduxjs/toolkit';

interface NodeEnv {
  node_env: string;
  dev_api_url: string;
  staging_api_url: string;
  production_api_url: string;
}

const nodeEnvInitialState = {
  node_env: '',
  dev_api_url: '',
  staging_api_url: '',
  production_api_url: '',
};

const nodeEnvSlice = createSlice({
  name: 'nodeEnv',
  initialState: nodeEnvInitialState,
  reducers: {
    setNodeEnvVariables(state, action: PayloadAction<NodeEnv>) {
      Object.assign(state, action.payload);
    },
  },
});

export default nodeEnvSlice;
export const nodeEnvActions = nodeEnvSlice.actions;
