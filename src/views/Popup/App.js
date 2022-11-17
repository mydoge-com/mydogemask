import { Box } from 'native-base';
import { Route } from 'wouter';

import { AppProvider } from '../../components/AppProvider';
import { useStorage } from '../../hooks/useStorage';
import Home from '../Home/App';
import { PasswordScreen } from './PasswordScreen';
import { WalletScreen } from './WalletScreen';

function App() {
  const {
    storage: { isAuthenticated },
  } = useStorage();

  return (
    <AppProvider>
      <Route path='/'>
        <Box width='360px' height='540px'>
          {isAuthenticated ? <WalletScreen /> : <PasswordScreen />}
        </Box>
      </Route>
      <Route path='/home'>
        <Home />
      </Route>
    </AppProvider>
  );
}

export default App;
