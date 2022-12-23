import { Box, Button, Heading, Input } from 'native-base';
import React, { useCallback, useState } from 'react';

import { useAppContext } from '../../hooks/useAppContext';
import { sendMessage } from '../../scripts/helpers/message';

export const PasswordScreen = (props) => {
  const [password, setPassword] = useState('');
  const { setAuthenticated } = useAppContext();

  const onAuthenticate = useCallback(() => {
    sendMessage({ message: 'authenticate', data: { password } }, (response) => {
      if (response) {
        setAuthenticated(true);
      }
    });
  }, [password, setAuthenticated]);

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
