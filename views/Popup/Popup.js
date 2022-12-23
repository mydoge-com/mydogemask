import { Box } from 'native-base';

import { useAppContext } from '../../hooks/useAppContext';
import { PasswordScreen } from './PasswordScreen';
import { WalletScreen } from './WalletScreen';

export const Popup = () => {
  const { authenticated } = useAppContext();

  return (
    <Box w='357px' h='600px' overflowX='hidden'>
      {authenticated ? <WalletScreen /> : <PasswordScreen />}
    </Box>
  );
};
