import wretch from 'wretch';

import { NODE_BASE_URL, NOWNODES_BASE_URL } from './helpers/constants';

export const apiKey = process.env.NEXT_PUBLIC_NOWNODES_API_KEY;

export const nownodes = wretch(NOWNODES_BASE_URL, {
  headers: {
    'api-key': apiKey,
  },
  redirect: 'follow',
});

export const node = wretch(NODE_BASE_URL);
