import { Box, HStack, Icon, Input, Text, VStack } from 'native-base';
import { useCallback } from 'react';
import { CgDanger } from 'react-icons/cg';

import { BigButton } from '../../../components/Button';
import { BackButton } from './BackButton';
import { Footer } from './Footer';

export const ImportWallet = ({ setScreen }) => {
  const onCreateWallet = useCallback(() => {
    setScreen(2);
  }, [setScreen]);

  const onBack = useCallback(() => {
    setScreen('intro');
  }, [setScreen]);

  return (
    <VStack px='15%' justifyContent='center' h='100%'>
      <BackButton onPress={onBack} />
      <VStack bg='white' py='40px' rounded='sm' px='40px'>
        <Text fontSize='2xl'>
          Secret Recovery <Text fontWeight='bold'>Phrase</Text>
        </Text>
        <HStack
          rounded='xl'
          bg='rose.200'
          alignItems='center'
          p='6px'
          borderWidth='1'
          borderColor='rose.500'
          mt='12px'
        >
          <Box bg='rose.500' p='6px' rounded='xl' mr='6px'>
            <Icon as={CgDanger} bg='white' />
          </Box>
          <Text color='gray.500' fontSize='14px'>
            Anyone with this phrase can take your funds
          </Text>
        </HStack>
        <VStack py='40px'>
          <Input
            variant='filled'
            type='text'
            focusOutlineColor='brandYellow.500'
            _hover={{
              borderColor: 'brandYellow.500',
            }}
          />
        </VStack>
        <BigButton mt='20px' onPress={onCreateWallet}>
          Confirm
        </BigButton>
      </VStack>
      <Footer />
    </VStack>
  );
};
