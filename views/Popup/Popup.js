import React from 'react';

import { useAppContext } from '../../hooks/useAppContext';
import { PasswordScreen } from './PasswordScreen';
import { WalletScreen } from './WalletScreen';

export const Popup = () => {
  const { isAuthenticated } = useAppContext();

  return isAuthenticated ? <WalletScreen /> : <PasswordScreen />;
};
