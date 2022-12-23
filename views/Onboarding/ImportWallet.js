import { Box, HStack, Icon, Input, Text, VStack } from 'native-base';
import { useCallback } from 'react';
import { CgDanger } from 'react-icons/cg';

import { BackButton } from '../../components/BackButton';
import { BigButton } from '../../components/Button';
import { Footer } from '../../components/Footer';
import { useAppContext } from '../../hooks/useAppContext';
import { OnboardingLayout } from './OnboardingLayout';

export const ImportWallet = () => {
  const { navigate } = useAppContext();
  const onConfirm = useCallback(() => {
    navigate('success');
  }, [navigate]);

  const onBack = useCallback(() => {
    navigate('intro');
  }, [navigate]);

  return (
    <OnboardingLayout>
      <VStack px='15%' justifyContent='center' h='100%'>
        <BackButton onPress={onBack} pb='15px' />
        <VStack bg='white' py='20px' rounded='sm' px='40px'>
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
          <Box
            py='20px'
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gridTemplateRows: 'auto auto auto',
              gridGap: '15px',
            }}
          >
            {Array(12)
              .fill(0)
              .map((_, i) => (
                <Input
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  variant='filled'
                  type='text'
                  focusOutlineColor='brandYellow.500'
                  _hover={{
                    borderColor: 'brandYellow.500',
                  }}
                  width='100%'
                  size='md'
                />
              ))}
          </Box>
          <BigButton mt='10px' onPress={onConfirm} w='80%'>
            Confirm
          </BigButton>
        </VStack>
        <Footer mt='40px' />
      </VStack>
    </OnboardingLayout>
  );
};
