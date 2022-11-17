import { Box, Button, Heading } from 'native-base';
import { useCallback } from 'react';

import { useStorage } from '../../hooks/useStorage';

export function WalletScreen(props) {
  const { updateStorage } = useStorage();
  const onLogOut = useCallback(() => {
    updateStorage({ isAuthenticated: false });
  }, [updateStorage]);

  return (
    <Box {...props}>
      <Heading>Wallet Screen</Heading>
      <Button onPress={onLogOut}>Log out</Button>
    </Box>
  );
}
