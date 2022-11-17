import { Image, Text, VStack } from 'native-base';
import { useCallback } from 'react';

import { BigButton } from '../../../components/Button';
import { Footer } from './Footer';

export const Success = ({ setScreen }) => {
  const onCreatePassword = useCallback(() => {
    setScreen('success'); // ToDo -- Navigate to next screen
  }, [setScreen]);

  return (
    <VStack px='15%' justifyContent='center' h='100%'>
      <VStack bg='white' py='40px' rounded='sm' px='40px'>
        <Text fontSize='2xl'>
          Welcome to <Text fontWeight='bold'>MyDoge Web</Text>
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
        <BigButton mt='20px' onPress={onCreatePassword} w='80%'>
          Let's Go!
        </BigButton>
      </VStack>
      <Footer />
    </VStack>
  );
};
