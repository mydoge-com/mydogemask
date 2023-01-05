import { Icon, IconButton, Input, Text, VStack } from 'native-base';
import { useCallback, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import { BackButton } from '../../components/BackButton';
import { BigButton } from '../../components/Button';
import { Footer } from '../../components/Footer';
import { useAppContext } from '../../hooks/useAppContext';
import { sendMessage } from '../../scripts/helpers/message';
import { OnboardingLayout } from './OnboardingLayout';

export const CreateWallet = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { navigate, dispatch } = useAppContext();

  const toggleShowPassword = useCallback(() => {
    setShowPassword((current) => !current);
  }, []);

  const onBack = useCallback(() => {
    navigate('Intro');
  }, [navigate]);

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
      sendMessage(
        { message: 'createWallet', data: { password: formData.password } },
        ({ authenticated, wallet }) => {
          if (authenticated && wallet) {
            dispatch({
              type: 'SIGN_IN',
              payload: { authenticated, wallet, navigate: 'Success' },
            });
            dispatch({
              type: 'SET_ONBOARDING_COMPLETE',
              payload: true,
            });
          }
        }
      );
    }
  }, [dispatch, formData.password, validate]);

  return (
    <OnboardingLayout>
      <VStack px='15%' justifyContent='center' h='100%'>
        <BackButton onPress={onBack} pb='20px' />
        <VStack bg='white' py='40px' rounded='sm' px='40px'>
          <Text fontSize='2xl'>
            Create a <Text fontWeight='bold'>Wallet</Text>
          </Text>
          <Text color='gray.500' fontSize='14px'>
            You will need this password to access your wallet
          </Text>
          <VStack pt='40px'>
            <Input
              variant='filled'
              placeholder='Password (10 characters minimum)'
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
                    showPassword ? (
                      <Icon as={FaEye} />
                    ) : (
                      <Icon as={FaEyeSlash} />
                    )
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
                    showPassword ? (
                      <Icon as={FaEye} />
                    ) : (
                      <Icon as={FaEyeSlash} />
                    )
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
            onPress={onSubmit}
            w='80%'
            type='submit'
            role='button'
            mt='32px'
            isDisabled={!formData.password || !formData.confirm}
          >
            Create Wallet
          </BigButton>
        </VStack>
        <Footer mt='40px' />
      </VStack>
    </OnboardingLayout>
  );
};
