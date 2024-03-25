import wretch from 'wretch';

import {
  DOGINALS_API_URL,
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

export const doginals = wretch(DOGINALS_API_URL, {
  // redirect: 'follow',
});

export const node = wretch(NODE_BASE_URL);
