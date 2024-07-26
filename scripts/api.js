import wretch from 'wretch';
// eslint-disable-next-line import/no-unresolved
import { retry } from 'wretch/middlewares';

import {
  DOGINALS_MARKETPLACE_API_URL,
  DOGINALS_WALLET_API_URL,
  DOGINALS_WALLET_API_V2_URL,
  MYDOGE_BASE_URL,
  NODE_BASE_URL,
  NOWNODES_BASE_URL,
} from './helpers/constants';

export const apiKey = process.env.NEXT_PUBLIC_NOWNODES_API_KEY;

const retryOptions = retry({
  delayTimer: 500,
  delayRamp: (delay, nbOfAttempts) => delay * nbOfAttempts,
  maxAttempts: 3,
  until: (response) => response && response.ok,
  onRetry: null,
  retryOnNetworkError: false,
  resolveWithLatestResponse: false,
  skip: (_, opts) => opts.method !== 'GET',
});

export const nownodes = wretch(NOWNODES_BASE_URL, {
  headers: {
    'api-key': apiKey,
  },
  redirect: 'follow',
});

export const doginals = wretch(DOGINALS_WALLET_API_URL).middlewares([
  retryOptions,
]);
export const doginalsV2 = wretch(DOGINALS_WALLET_API_V2_URL).middlewares([
  retryOptions,
]);

export const doginalsMarketplace = wretch(
  DOGINALS_MARKETPLACE_API_URL
).middlewares([retryOptions]);

export const node = wretch(NODE_BASE_URL);

export const mydoge = wretch(MYDOGE_BASE_URL);
