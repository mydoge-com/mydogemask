import {
  Box,
  Icon,
  IconButton,
  Input,
  Text,
  TextArea,
  VStack,
} from 'native-base';
import { useCallback, useState } from 'react';
import { CgDanger } from 'react-icons/cg';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import { BackButton } from '../../components/BackButton';
import { BigButton } from '../../components/Button';
import { useAppContext } from '../../hooks/useAppContext';
import { sendMessage } from '../../scripts/helpers/message';
import { PopupLayout } from './PopupLayout';

export const ResetWallet = () => {
  const { navigate } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = useCallback(() => {
    setShowPassword((current) => !current);
  }, []);

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const { setAuthenticated } = useAppContext();

  const validate = useCallback(() => {
    if (!formData.recoveryPhrase) {
      setErrors({
        ...errors,
        recoveryPhrase: true,
      });
      return false;
    } else if (!formData.password) {
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
  }, [errors, formData.confirm, formData.password, formData.recoveryPhrase]);

  const onSubmit = useCallback(() => {
    if (validate()) {
      sendMessage(
        { message: 'resetWallet', data: { password: formData.password } },
        (response) => {
          if (response) {
            setAuthenticated(true);
            navigate('Success');
          }
        }
      );
    }
  }, [formData.password, navigate, setAuthenticated, validate]);

  return (
    <PopupLayout>
      <VStack>
        <BackButton pb='10px' onPress={() => navigate('Password')} />
        <VStack>
          <Text fontSize='3xl'>
            Reset <Text fontWeight='bold'>Wallet</Text>
          </Text>
          <VStack
            rounded='xl'
            bg='rose.100'
            alignItems='flex-start'
            p='14px'
            borderWidth='1'
            borderColor='rose.500'
            mt='8px'
          >
            <Box bg='rose.500' p='6px' rounded='xl' mb='10px'>
              <Icon as={CgDanger} bg='white' />
            </Box>
            <Text color='gray.500' fontSize='11px'>
              Mydogemask does not keep a copy of your password. If you’re having
              trouble unlocking your account, you will need to reset your
              wallet. You can do this by providing the 12-word Secret Recovery
              Phrase.{' '}
              <Text fontWeight='bold'>
                This action will delete your current wallet and Secret Phrase
                from this device. You will not be able to undo this.
              </Text>
            </Text>
          </VStack>
          <TextArea
            variant='filled'
            focusOutlineColor='brandYellow.500'
            _hover={{
              borderColor: 'brandYellow.500',
            }}
            _focus={{
              borderColor: 'brandYellow.500',
            }}
            width='100%'
            mt='16px'
            numberOfLines={2}
            placeholder='Enter Secret Recovery Phrase'
            onChangeText={(value) => {
              setFormData({ ...formData, recoveryPhrase: value });
              setErrors({ ...errors, recoveryPhrase: false });
            }}
            onSubmitEditing={onSubmit}
            _invalid={{
              borderColor: 'red.500',
              focusOutlineColor: 'red.500',
              _hover: {
                borderColor: 'red.500',
              },
            }}
            isInvalid={errors.recoveryPhrase}
          />
          <VStack pt='16px'>
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
              isInvalid={errors.password}
              onChangeText={(value) => {
                setFormData({ ...formData, password: value });
                setErrors({ ...errors, password: false });
              }}
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
              isInvalid={errors.confirm}
              onChangeText={(value) => {
                setFormData({ ...formData, confirm: value });
                setErrors({ ...errors, confirm: false });
              }}
              onSubmitEditing={onSubmit}
            />
            {errors.confirm ? (
              <Text fontSize='10px' color='red.500' pt='6px'>
                {errors.confirm}
              </Text>
            ) : null}
          </VStack>
          <BigButton
            mt='16px'
            w='80%'
            onPress={onSubmit}
            isDisabled={
              !formData.recoveryPhrase ||
              !formData.password ||
              !formData.confirm
            }
          >
            Restore
          </BigButton>
        </VStack>
      </VStack>
    </PopupLayout>
  );
};
