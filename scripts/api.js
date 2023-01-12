import wretch from 'wretch';

import { NOWNODES_BASE_URL } from './helpers/constants';

export const nownodes = wretch(NOWNODES_BASE_URL, {
  headers: {
    'api-key': process.env.NEXT_PUBLIC_NOWNODES_API_KEY,
  },
  redirect: 'follow',
});
