import { Box, Button, Heading, Input } from 'native-base';
import React, { useCallback, useState } from 'react';

import { useAppContext } from '../../hooks/useAppContext';

export const PasswordScreen = (props) => {
  const { authenticate } = useAppContext();

  const [password, setPassword] = useState('');

  const onAuthenticate = useCallback(() => {
    authenticate(password);
  }, [authenticate, password]);

  const onChangeText = useCallback((text) => {
    setPassword(text);
  }, []);

  return (
    <Box {...props}>
      <Heading>Enter Password</Heading>
      <Input value={password} onChangeText={onChangeText} />
      <Button onPress={onAuthenticate}>Authenticate</Button>
    </Box>
  );
};
