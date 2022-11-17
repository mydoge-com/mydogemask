import { NativeBaseProvider } from 'native-base';

export function AppProvider({ children }) {
  return <NativeBaseProvider>{children}</NativeBaseProvider>;
}
