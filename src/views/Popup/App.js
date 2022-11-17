import { Box } from 'native-base';

import { AppProvider } from '../../components/AppProvider';
import { useStorage } from '../../hooks/useStorage';
import { PasswordScreen } from './PasswordScreen';
import { WalletScreen } from './WalletScreen';

function App() {
  const {
    storage: { isAuthenticated },
  } = useStorage();
  return (
    <AppProvider>
      <Box width='360px' height='540px'>
        {isAuthenticated ? <WalletScreen /> : <PasswordScreen />}
      </Box>
    </AppProvider>
  );
}

export default App;
