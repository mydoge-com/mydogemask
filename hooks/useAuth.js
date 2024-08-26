import { Input, Text, VStack } from 'native-base';
import React, { useCallback, useState } from 'react';

import { MESSAGE_TYPES } from '../scripts/helpers/constants';
import { sendMessage } from '../scripts/helpers/message';

export const useAuth = ({
  onValidAuth,
  _dangerouslyReturnSecretPhrase = false,
}) => {
  const [password, setPassword] = useState('');
  const onChangeText = useCallback((text) => {
    setErrors({});
    setPassword(text);
  }, []);

  const onSubmit = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.AUTHENTICATE,
        data: { password, _dangerouslyReturnSecretPhrase },
      },
      ({ authenticated, wallet }) => {
        if (authenticated && wallet) {
          setErrors({});
          onValidAuth?.({ authenticated, wallet });
        } else {
          setErrors({ ...errors, password: 'Incorrect password' });
        }
      }
    );
  }, [_dangerouslyReturnSecretPhrase, errors, onValidAuth, password]);

  const [errors, setErrors] = useState({});

  const renderPasswordInput = useCallback(
    ({ ...props }) => (
      <VStack {...props}>
        <Input
          variant='filled'
          placeholder='Password'
          py='14px'
          type='password'
          focusOutlineColor='brandYellow.500'
          _hover={{
            borderColor: 'brandYellow.500',
          }}
          _invalid={{
            borderColor: 'red.500',
            focusOutlineColor: 'red.500',
            _hover: {
              borderColor: 'red.500',
            },
          }}
          isInvalid={'password' in errors}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          autoFocus
        />
        <Text fontSize='10px' color='red.500' pt='6px'>
          {errors.password || ' '}
        </Text>
      </VStack>
    ),
    [errors, onChangeText, onSubmit]
  );

  return { renderPasswordInput, onSubmit, password };
};
