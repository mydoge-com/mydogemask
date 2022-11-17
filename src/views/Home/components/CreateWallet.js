import { Link, Text, VStack } from 'native-base';
import { useCallback } from 'react';

import { BigButton } from './Button';

export const CreateWallet = ({ setScreen }) => {
  const onCreateWallet = useCallback(() => {
    setScreen(2);
  }, [setScreen]);

  return (
    <VStack px='15%' justifyContent='center' h='100%'>
      <VStack bg='white' py='40px' rounded='sm' px='40px'>
        <Text fontSize='2xl'>
          Create a <Text fontWeight='bold'>Password</Text>
        </Text>
        <Text color='gray.500' fontSize='14px'>
          You will need this password to access your wallet
        </Text>
        <BigButton mt='20px' onPress={onCreateWallet}>
          Create Password
        </BigButton>
      </VStack>
      <Text textAlign='center' mt='80px' color='gray.400'>
        Need help using MyDoge?{' '}
        <Link href='https://www.mydoge.com/#faq' target='_blank'>
          <Text color='brandYellow.500' underline fontWeight='medium'>
            Frequently Asked Questions
          </Text>
        </Link>
      </Text>
    </VStack>
  );
};
