import { useContext } from 'react';

import { AppContext } from '../Context';

export const useAppContext = () => {
  return useContext(AppContext);
};
