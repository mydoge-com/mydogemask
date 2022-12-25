import {
  AlertDialog,
  Box,
  Button,
  Icon,
  IconButton,
  Input,
  Text,
  TextArea,
  VStack,
} from 'native-base';
import { useCallback, useRef, useState } from 'react';
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

  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const openDialog = useCallback(() => setDialogIsOpen(true), []);
  const closeDialog = useCallback(() => setDialogIsOpen(false), []);
  const cancelRef = useRef();

  const { setAuthenticated } = useAppContext();

  const validate = useCallback(() => {
    if (
      formData.seedPhrase.replace(/\s+/g, ' ').trim().split(' ').length !== 12
    ) {
      setErrors({
        ...errors,
        seedPhrase: 'Invalid Seed Phrase',
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
  }, [errors, formData.confirm, formData.password, formData.seedPhrase]);

  const onSubmit = useCallback(() => {
    if (validate()) {
      openDialog();
    }
  }, [openDialog, validate]);

  const onReset = useCallback(() => {
    sendMessage(
      {
        message: 'resetWallet',
        data: { password: formData.password, seedPhrase: formData.seedPhrase },
      },
      (response) => {
        if (response) {
          closeDialog();
          setAuthenticated(true);
          navigate('Success');
        }
      }
    );
  }, [
    closeDialog,
    formData.password,
    formData.seedPhrase,
    navigate,
    setAuthenticated,
  ]);

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
              wallet. You can do this by providing the 12-word Seed Phrase.{' '}
              <Text fontWeight='bold'>
                This action will delete your current wallet and Seed Phrase from
                this device. You will not be able to undo this.
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
            placeholder='Enter Seed Phrase'
            onChangeText={(value) => {
              setFormData({ ...formData, seedPhrase: value });
              setErrors({ ...errors, seedPhrase: false });
            }}
            onSubmitEditing={onSubmit}
            _invalid={{
              borderColor: 'red.500',
              focusOutlineColor: 'red.500',
              _hover: {
                borderColor: 'red.500',
              },
            }}
            isInvalid={errors.seedPhrase}
          />
          {errors.seedPhrase ? (
            <Text fontSize='10px' color='red.500' pt='6px'>
              {errors.seedPhrase}
            </Text>
          ) : null}
          <VStack pt='12px'>
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
              !formData.seedPhrase || !formData.password || !formData.confirm
            }
          >
            Reset
          </BigButton>
          <AlertDialog
            leastDestructiveRef={cancelRef}
            isOpen={dialogIsOpen}
            onClose={closeDialog}
          >
            <AlertDialog.Content>
              <AlertDialog.CloseButton />
              <AlertDialog.Header>Reset Wallet</AlertDialog.Header>
              <AlertDialog.Body>
                This will delete your current wallet and Seed Phrase from this
                device. This action cannot be reversed.
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button.Group space={2}>
                  <Button
                    variant='unstyled'
                    colorScheme='coolGray'
                    onPress={closeDialog}
                    ref={cancelRef}
                  >
                    Cancel
                  </Button>
                  <BigButton variant='danger' onPress={onReset} px='24px'>
                    Reset
                  </BigButton>
                </Button.Group>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog>
        </VStack>
      </VStack>
    </PopupLayout>
  );
};
