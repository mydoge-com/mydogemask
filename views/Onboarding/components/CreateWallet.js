import * as bip39 from 'bip39';
import { Icon, IconButton, Input, Text, VStack } from 'native-base';
import React, { useCallback, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import { BigButton } from '../../../components/Button';
import { useAppContext } from '../../../hooks/useAppContext';
import { useEncryptedStorage } from '../../../hooks/useEncryptedStorage';
import { generateWallet } from '../../../utils/wallet';
import { BackButton } from './BackButton';
import { Footer } from './Footer';

export const CreateWallet = ({ setScreen }) => {
  const { authenticate } = useAppContext();
  const { setPassword, setWallet } = useEncryptedStorage();
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((current) => !current);
  }, []);

  const onBack = useCallback(() => {
    setScreen('intro');
  }, [setScreen]);

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const validate = useCallback(() => {
    if (!formData.password) {
      setErrors({ ...errors, password: true });
      return false;
    } else if (!formData.confirm || formData.confirm !== formData.password) {
      setErrors({ ...errors, confirm: "Password fields don't match" });
      return false;
    } else if (formData.password.length < 10) {
      setErrors({
        ...errors,
        confirm: 'Password must be at least 10 characters',
      });
      return false;
    }
    setErrors({});
    return true;
  }, [errors, formData.confirm, formData.password]);

  const onSubmit = useCallback(() => {
    if (validate()) {
      const phrase = bip39.generateMnemonic(128);
      const { addr, priv, pub } = generateWallet(phrase);
      setPassword(formData.password);
      setWallet({
        password: formData.password,
        phrase,
        addr,
        priv,
        pub,
      });
      authenticate(formData.password);
    }
  }, [authenticate, formData.password, setPassword, setWallet, validate]);

  return (
    <VStack px='15%' justifyContent='center' h='100%'>
      <BackButton onPress={onBack} />
      <VStack bg='white' py='40px' rounded='sm' px='40px'>
        <Text fontSize='2xl'>
          Create a <Text fontWeight='bold'>Wallet</Text>
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
            _invalid={{
              borderColor: 'red.500',
              focusOutlineColor: 'red.500',
              _hover: {
                borderColor: 'red.500',
              },
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
            isInvalid={'password' in errors}
            onChangeText={(value) =>
              setFormData({ ...formData, password: value })
            }
            onSubmitEditing={onSubmit}
          />
          <Input
            variant='filled'
            placeholder='Enter Password'
            py='14px'
            type={showPassword ? 'text' : 'password'}
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
            InputRightElement={
              <IconButton
                icon={
                  showPassword ? <Icon as={FaEye} /> : <Icon as={FaEyeSlash} />
                }
                onPress={toggleShowPassword}
                color='gray.500'
              />
            }
            mt='12px'
            isInvalid={'confirm' in errors}
            onChangeText={(value) =>
              setFormData({ ...formData, confirm: value })
            }
            onSubmitEditing={onSubmit}
          />
          {'confirm' in errors ? (
            <Text fontSize='10px' color='red.500' pt='6px'>
              {errors.confirm}
            </Text>
          ) : null}
        </VStack>
        <BigButton
          mt='10px'
          onPress={onSubmit}
          w='80%'
          type='submit'
          role='button'
        >
          Create Wallet
        </BigButton>
      </VStack>
      <Footer mt='40px' />
    </VStack>
  );
};
