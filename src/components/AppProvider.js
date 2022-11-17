import { extendTheme, NativeBaseProvider } from 'native-base';

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

export function AppProvider({ children }) {
  return <NativeBaseProvider theme={theme}>{children}</NativeBaseProvider>;
}
