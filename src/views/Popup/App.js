import { Box } from 'native-base';

import { AppProvider } from '../../components/AppProvider';
import { useStorage } from '../../hooks/useStorage';
import Onboarding from '../Onboarding/App';
import { PasswordScreen } from './PasswordScreen';
import { WalletScreen } from './WalletScreen';

function App() {
  const {
    storage: { isAuthenticated, onboardingComplete },
  } = useStorage();

  return (
    <AppProvider>
      {onboardingComplete ? (
        <Box width='360px' height='540px'>
          {isAuthenticated ? <WalletScreen /> : <PasswordScreen />}
        </Box>
      ) : (
        <Onboarding />
      )}
    </AppProvider>
  );
}

export default App;
