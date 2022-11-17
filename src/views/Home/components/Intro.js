import { Box, HStack, Image, Link, Text, VStack } from 'native-base';
import { useCallback } from 'react';

import { BigButton } from './Button';

export const Intro = ({ setScreen }) => {
  const onCreateWallet = useCallback(() => {
    setScreen('createWallet');
  }, [setScreen]);

  // const onImportWallet = useCallback(() => {
  //   setScreen(3);
  // }, [setScreen]);

  return (
    <VStack px='15%' justifyContent='center' h='100%'>
      <HStack bg='white' py='40px' rounded='sm' px='40px'>
        <Box
          p='18px'
          rounded='3xl'
          style={{
            boxShadow: '0px 8px 28px 0px rgba(52, 52, 52, 0.08)',
          }}
          mr='20px'
        >
          <Image
            source={{ uri: '/assets/wallet-create.png' }}
            size='48px'
            resizeMode='contain'
          />
        </Box>
        <VStack alignItems='center' flex={1}>
          <Text color='gray.600' fontWeight='medium' textAlign='center'>
            Create a new wallet
          </Text>
          <BigButton mt='20px' onPress={onCreateWallet}>
            Create Wallet
          </BigButton>
        </VStack>
      </HStack>
      <HStack bg='white' py='40px' rounded='sm' px='40px' mt='42px'>
        <Box
          p='18px'
          rounded='3xl'
          style={{
            boxShadow: '0px 8px 28px 0px rgba(52, 52, 52, 0.08)',
          }}
          mr='20px'
        >
          <Image
            source={{ uri: '/assets/wallet-import.png' }}
            size='48px'
            resizeMode='contain'
          />
        </Box>
        <VStack alignItems='center' flex={1}>
          <Text color='gray.600' fontWeight='medium' textAlign='center'>
            Already have a wallet? Restore
          </Text>
          <BigButton variant='secondary' mt='20px'>
            Import Wallet
          </BigButton>
        </VStack>
      </HStack>
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
