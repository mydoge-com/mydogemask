import { Box, Image, Text, VStack } from 'native-base';
import React, { useCallback, useState } from 'react';

import { BigButton } from '../../components/Button';
import { Layout } from '../../components/Layout';
import { DISPATCH_TYPES } from '../../Context';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../hooks/useAuth';

export const Password = () => {
  const { dispatch, navigate } = useAppContext();

  const onValidAuth = useCallback(
    ({ authenticated, wallet }) => {
      if (authenticated && wallet) {
        setErrors({});
        dispatch({
          type: DISPATCH_TYPES.SIGN_IN,
          payload: { authenticated, wallet },
        });
      } else {
        setErrors({ ...errors, password: 'Incorrect password' });
      }
    },
    [dispatch, errors]
  );

  const [errors, setErrors] = useState({});

  const { renderPasswordInput, onSubmit, password } = useAuth({ onValidAuth });

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
          <Box pt='40px'>{renderPasswordInput()}</Box>
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
