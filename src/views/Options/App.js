import { Box } from 'native-base';

import { AppProvider } from '../../components/AppProvider';

function App() {
  return (
    <AppProvider>
      <Box>Options page goes here</Box>
    </AppProvider>
  );
}

export default App;
