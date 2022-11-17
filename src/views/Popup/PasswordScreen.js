import { Box, Button, Heading, Input } from 'native-base';
import { useCallback } from 'react';

import { useStorage } from '../../hooks/useStorage';

export function PasswordScreen(props) {
  const { updateStorage } = useStorage();

  const onAuthenticate = useCallback(() => {
    updateStorage({ isAuthenticated: true });
  }, [updateStorage]);

  return (
    <Box {...props}>
      <Heading>Enter Password</Heading>
      <Input />
      <Button onPress={onAuthenticate}>Authenticate</Button>
    </Box>
  );
}
