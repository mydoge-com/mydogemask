import { Box } from 'native-base';

import { AppProvider } from '../../components/AppProvider';

function App() {
  return (
    <AppProvider>
      <Box>Home page (onboarding) - Create/import wallet</Box>
    </AppProvider>
  );
}

export default App;
