import { Icon, IconButton, Input, Text, VStack } from 'native-base';
import { useCallback, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import { BigButton } from '../../../components/Button';
import { BackButton } from './BackButton';
import { Footer } from './Footer';

export const CreateWallet = ({ setScreen }) => {
  const onCreatePassword = useCallback(() => {
    setScreen('success');
  }, [setScreen]);

  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((current) => !current);
  }, []);

  const onBack = useCallback(() => {
    setScreen('intro');
  }, [setScreen]);

  return (
    <VStack px='15%' justifyContent='center' h='100%'>
      <BackButton onPress={onBack} />
      <VStack bg='white' py='40px' rounded='sm' px='40px'>
        <Text fontSize='2xl'>
          Create a <Text fontWeight='bold'>Password</Text>
        </Text>
        <Text color='gray.500' fontSize='14px'>
          You will need this password to access your wallet
        </Text>
        <VStack py='40px'>
          <Input
            variant='filled'
            placeholder='Enter Password'
            py='14px'
            type={showPassword ? 'text' : 'password'}
            focusOutlineColor='brandYellow.500'
            _hover={{
              borderColor: 'brandYellow.500',
            }}
            InputRightElement={
              <IconButton
                icon={
                  showPassword ? <Icon as={FaEye} /> : <Icon as={FaEyeSlash} />
                }
                onPress={toggleShowPassword}
                color='gray.500'
              />
            }
          />
          <Input
            variant='filled'
            placeholder='Confirm Password'
            py='14px'
            mt='16px'
            type={showPassword ? 'text' : 'password'}
            focusOutlineColor='brandYellow.500'
            _hover={{
              borderColor: 'brandYellow.500',
            }}
            InputRightElement={
              <IconButton
                icon={
                  showPassword ? <Icon as={FaEye} /> : <Icon as={FaEyeSlash} />
                }
                onPress={toggleShowPassword}
                color='gray.500'
              />
            }
          />
        </VStack>
        <BigButton mt='10px' onPress={onCreatePassword} w='80%'>
          Create Password
        </BigButton>
      </VStack>
      <Footer mt='40px' />
    </VStack>
  );
};
