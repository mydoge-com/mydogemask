import { Box } from 'native-base';

import { AppProvider } from '../../components/AppProvider';

function App() {
  return (
    <AppProvider>
      <Box>Notification popup (request transaction, etc)</Box>
    </AppProvider>
  );
}

export default App;
