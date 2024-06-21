import { Icon, IconButton, Input, Text, VStack } from 'native-base';
import { useCallback, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import { BackButton } from '../../components/BackButton';
import { BigButton } from '../../components/Button';
import { Footer } from '../../components/Footer';
import { DISPATCH_TYPES } from '../../Context';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { OnboardingLayout } from './OnboardingLayout';

export const CreateWallet = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { dispatch, navigate } = useAppContext();

  const toggleShowPassword = useCallback(() => {
    setShowPassword((current) => !current);
  }, []);

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const validatePassword = useCallback(
    (value) => {
      const toValidate = value !== undefined ? value : formData.password;
      let noErrors = true;

      if (value === undefined) {
        if (!formData.password) {
          setErrors({ ...errors, password: true });
          noErrors = false;
        }
      }

      if (toValidate) {
        if (toValidate.length < 10) {
          setErrors({
            ...errors,
            confirm1: 'Password must be at least 10 characters',
          });
          noErrors = false;
        }
      }

      if (noErrors) {
        setErrors({ ...errors, password: false, confirm1: false });
      }

      return noErrors;
    },
    [errors, formData.password]
  );

  const validateConfirm = useCallback(
    (value) => {
      const toValidate = value !== undefined ? value : formData.confirm;
      let noErrors = true;

      if (toValidate && toValidate !== formData.password) {
        setErrors({ ...errors, confirm2: "Password fields don't match" });
        noErrors = false;
      }

      if (noErrors) {
        setErrors({ ...errors, confirm2: false });
      }

      return noErrors;
    },
    [errors, formData.confirm, formData.password]
  );

  const onSubmit = useCallback(() => {
    if (validatePassword() && validateConfirm()) {
      sendMessage(
        {
          message: MESSAGE_TYPES.CREATE_WALLET,
          data: { password: formData.password },
        },
        ({ authenticated, wallet }) => {
          if (authenticated && wallet) {
            dispatch({
              type: DISPATCH_TYPES.SIGN_IN,
              payload: {
                authenticated,
                wallet,
                navigate: '/Success',
              },
            });
            dispatch({
              type: DISPATCH_TYPES.SET_ONBOARDING_COMPLETE,
              payload: true,
            });
          }
        }
      );
    }
  }, [dispatch, formData.password, validatePassword, validateConfirm]);

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
          <VStack mt='40px'>
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
              isInvalid={errors.password || errors.confirm1}
              onChangeText={(value) => {
                setFormData({ ...formData, password: value });
                validatePassword(value);
              }}
              onSubmitEditing={onSubmit}
              autoFocus
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
              mt='12px'
              isInvalid={errors.confirm2}
              onChangeText={(value) => {
                setFormData({ ...formData, confirm: value });
                validateConfirm(value);
              }}
              onSubmitEditing={onSubmit}
            />
            <IconButton
              icon={
                showPassword ? <Icon as={FaEye} /> : <Icon as={FaEyeSlash} />
              }
              onPress={toggleShowPassword}
              color='gray.500'
              position='absolute'
              right={0}
              top='6px'
            />
            {errors.confirm1 ? (
              <Text fontSize='10px' color='red.500' pt='6px'>
                {errors.confirm1}
              </Text>
            ) : null}
            {errors.confirm2 ? (
              <Text fontSize='10px' color='red.500' pt='6px'>
                {errors.confirm2}
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
