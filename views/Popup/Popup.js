import { useAppContext } from '../../hooks/useAppContext';
import { PasswordScreen } from './PasswordScreen';
import { WalletScreen } from './WalletScreen';

export const Popup = () => {
  const { authenticated } = useAppContext();

  return authenticated ? <WalletScreen /> : <PasswordScreen />;
};
