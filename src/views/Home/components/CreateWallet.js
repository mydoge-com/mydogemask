import {
  HStack,
  Icon,
  IconButton,
  Input,
  Link,
  Text,
  VStack,
} from 'native-base';
import { useCallback, useState } from 'react';
import { FaAngleLeft, FaEye, FaEyeSlash } from 'react-icons/fa';

import { BigButton } from './Button';

export const CreateWallet = ({ setScreen }) => {
  const onCreateWallet = useCallback(() => {
    setScreen(2);
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
      <HStack alignItems='center' pb='30px'>
        <IconButton
          icon={<Icon as={FaAngleLeft} />}
          rounded='full'
          alignSelf='flex-start'
          borderWidth='1px'
          borderColor='gray.500'
          color='gray.500'
          size='24px'
          onPress={onBack}
        />
        <Text ml='6px' color='gray.500'>
          Back
        </Text>
      </HStack>
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
