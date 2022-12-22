import '../styles/globals.css';

import { extendTheme, NativeBaseProvider } from 'native-base';
import NoSSR from 'react-no-ssr';

import { AppContextProvider } from '../Context';

const theme = extendTheme({
  colors: {
    brandYellow: {
      100: '#fff8e6',
      200: '#feebb3',
      300: '#fede81',
      400: '#fdd14e',
      500: '#fdc41c',
      600: '#e3ab02',
      700: '#b18502',
      800: '##7e5f01',
      900: '##4c3901',
    },
  },
});

function MyApp({ Component, pageProps }) {
  return (
    <NoSSR>
      <AppContextProvider>
        <NativeBaseProvider isSSR={false} theme={theme}>
          <Component {...pageProps} />
        </NativeBaseProvider>
      </AppContextProvider>
    </NoSSR>
  );
}

export default MyApp;
