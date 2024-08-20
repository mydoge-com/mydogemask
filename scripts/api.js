import axios from 'axios';

import { MYDOGE_BASE_URL } from './helpers/constants';

export const mydoge = axios.create({
  baseURL: MYDOGE_BASE_URL,
});
