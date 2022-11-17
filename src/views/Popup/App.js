import { Box } from 'native-base';
import { Route } from 'wouter';

import { AppProvider } from '../../components/AppProvider';
import Home from '../Home/App';

function App() {
  return (
    <AppProvider>
      <Route path='/'>
        <Box width='360px' py='100px'>
          Welcome to MyDoge
        </Box>
      </Route>
      <Route path='/home'>
        <Home />
      </Route>
    </AppProvider>
  );
}

export default App;
