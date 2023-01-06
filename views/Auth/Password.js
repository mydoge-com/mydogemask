import { Box, Image, Input, Text, VStack } from 'native-base';
import React, { useCallback, useState } from 'react';

import { BigButton } from '../../components/Button';
import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { sendMessage } from '../../scripts/helpers/message';

export const Password = () => {
  const [password, setPassword] = useState('');
  const onChangeText = useCallback((text) => {
    setErrors({});
    setPassword(text);
  }, []);

  const { dispatch, navigate } = useAppContext();

  const onSubmit = useCallback(() => {
    sendMessage(
      { message: 'authenticate', data: { password } },
      ({ authenticated, wallet }) => {
        if (authenticated && wallet) {
          setErrors({});
          dispatch({ type: 'SIGN_IN', payload: { authenticated, wallet } });
        } else {
          setErrors({ ...errors, password: 'Incorrect password' });
        }
      }
    );
  }, [dispatch, errors, password]);

  const [errors, setErrors] = useState({});

  return (
    <Layout>
      <VStack
        bg='white'
        pt='40px'
        pb='20px'
        rounded='sm'
        px='40px'
        h='100%'
        justifyContent='flex-end'
      >
        <Image
          source={{ uri: '/assets/password.jpg' }}
          h='100%'
          position='absolute'
          zIndex={-1}
          top='-68px'
          left={0}
          right={0}
          alt='background'
        />
        <Box>
          <Text fontSize='3xl' textAlign='center'>
            Unlock your <Text fontWeight='bold'>Doge</Text>
          </Text>
          <Text color='gray.500' fontSize='14px' textAlign='center'>
            Enter password to access your wallet
          </Text>
          <VStack pt='40px' pb='8px'>
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
          <BigButton
            onPress={onSubmit}
            w='80%'
            type='submit'
            role='button'
            isDisabled={!password}
          >
            Unlock
          </BigButton>
          <Text
            color='brandYellow.500'
            underline
            fontWeight='medium'
            textAlign='center'
            pt='10px'
            onPress={() => navigate('ResetWallet')}
          >
            Forgot password?
          </Text>
        </Box>
      </VStack>
    </Layout>
  );
};
