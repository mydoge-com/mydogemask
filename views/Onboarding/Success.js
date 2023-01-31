import { Image, Text, VStack } from 'native-base';
import { useCallback } from 'react';

import { BigButton } from '../../components/Button';
import { Footer } from '../../components/Footer';
import { useAppContext } from '../../hooks/useAppContext';
import { OnboardingLayout } from './OnboardingLayout';

export const Success = () => {
  const { navigate } = useAppContext();
  const onComplete = useCallback(() => {
    navigate('Transactions');
  }, [navigate]);

  return (
    <OnboardingLayout>
      <VStack px='15%' justifyContent='center' h='100%'>
        <VStack bg='white' py='40px' rounded='sm' px='40px' mt='20px'>
          <Text fontSize='2xl'>
            Welcome to <Text fontWeight='bold'>MyDogeMask</Text>
          </Text>
          <Image
            source={{ uri: '/assets/such-doge.png' }}
            size={300}
            resizeMode='contain'
            alt='such doge'
            h='200px'
            mt='30px'
            alignSelf='center'
          />
          <BigButton mt='20px' onPress={onComplete} w='80%'>
            Let's Go!
          </BigButton>
        </VStack>
        <Footer mt='40px' />
      </VStack>
    </OnboardingLayout>
  );
};
