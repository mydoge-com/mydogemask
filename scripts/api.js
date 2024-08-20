import axios from 'axios';
import wretch from 'wretch';
// eslint-disable-next-line import/no-unresolved
import { retry } from 'wretch/middlewares';

import {
  DOGINALS_MARKETPLACE_API_URL,
  MYDOGE_BASE_URL,
} from './helpers/constants';

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

export const doginalsMarketplace = wretch(
  DOGINALS_MARKETPLACE_API_URL
).middlewares([retryOptions]);

export const mydoge = axios.create({
  baseURL: MYDOGE_BASE_URL,
});
