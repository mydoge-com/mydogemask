import { Box } from 'native-base';

import { AppProvider } from '../../components/AppProvider';
import { useStorage } from '../../hooks/useStorage';
import Onboarding from '../Onboarding/App';
import { PasswordScreen } from './PasswordScreen';
import { WalletScreen } from './WalletScreen';

function App() {
  const { storage } = useStorage();

  return (
    <AppProvider>
      {storage.onboardingComplete ? (
        <Box width='360px' height='540px'>
          {storage.isAuthenticated ? <WalletScreen /> : <PasswordScreen />}
        </Box>
      ) : (
        <Onboarding />
      )}
    </AppProvider>
  );
}

export default App;
