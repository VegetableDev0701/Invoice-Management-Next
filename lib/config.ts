import { customAlphabet } from 'nanoid';

const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const nanoid = customAlphabet(ALPHABET, 16);

export const LINE_ITEM_WIDTH = 0.8;

// used in the auto logout logic
export const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds
export const PRE_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

export const getAPIUrl = () => {
  if (process.env.NEXT_PUBLIC_STAK_NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_DEV_API_URL;
  } else if (process.env.NEXT_PUBLIC_STAK_NODE_ENV === 'staging') {
    return process.env.NEXT_PUBLIC_STAGING_API_URL;
  } else if (process.env.NEXT_PUBLIC_STAK_NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_PRODUCTION_API_URL;
  } else {
    throw new Error(
      `${process.env.NEXT_PUBLIC_STAK_NODE_ENV} does not exist. Please use 'development', 'staging', or 'production'.`
    );
  }
};
