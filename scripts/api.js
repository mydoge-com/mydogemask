import wretch from 'wretch';

import {
  DOGINALS_MARKETPLACE_API_URL,
  DOGINALS_WALLET_API_URL,
  NODE_BASE_URL,
  NOWNODES_BASE_URL,
} from './helpers/constants';

export const apiKey = process.env.NEXT_PUBLIC_NOWNODES_API_KEY;

export const nownodes = wretch(NOWNODES_BASE_URL, {
  headers: {
    'api-key': apiKey,
  },
  redirect: 'follow',
});

export const doginals = wretch(DOGINALS_WALLET_API_URL);

export const doginalsMarketplace = wretch(DOGINALS_MARKETPLACE_API_URL);

export const node = wretch(NODE_BASE_URL);
