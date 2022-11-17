import { Box } from 'native-base';

import { AppProvider } from '../../components/AppProvider';

function App() {
  return (
    <AppProvider>
      <Box width='360px' py='100px'>
        Welcome to MyDoge
      </Box>
    </AppProvider>
  );
}

export default App;
