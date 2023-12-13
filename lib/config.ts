import { customAlphabet } from 'nanoid';

const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const nanoid = customAlphabet(ALPHABET, 16);

export const LINE_ITEM_WIDTH = 0.8;

// used in the auto logout logic
export const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds
export const PRE_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

export const getAPIUrl = ({
  node_env = process.env.NEXT_PUBLIC_STAK_NODE_ENV,
  dev_api_url = process.env.NEXT_PUBLIC_DEV_API_URL,
  staging_api_url = process.env.NEXT_PUBLIC_STAGING_API_URL,
  production_api_url = process.env.NEXT_PUBLIC_PRODUCTION_API_URL,
} = {}) => {
  if (node_env === 'development') {
    return dev_api_url;
  } else if (node_env === 'staging') {
    return staging_api_url;
  } else if (node_env === 'production') {
    return production_api_url;
  } else {
    throw new Error(
      `${node_env} does not exist. Please use 'development', 'staging', or 'production'.`
    );
  }
};
