import axios from 'axios';

export const nownodes = axios.create({
  baseURL: 'https://dogebook.nownodes.io/api/v2',
  headers: {
    'api-key': process.env.NEXT_PUBLIC_NOWNODES_API_KEY,
  },
  redirect: 'follow',
});
