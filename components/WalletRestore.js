import {
  AlertDialog,
  Button,
  Icon,
  IconButton,
  Input,
  Text,
  TextArea,
  VStack,
} from 'native-base';
import { useCallback, useRef, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import { MESSAGE_TYPES } from '../scripts/helpers/constants';
import { sendMessage } from '../scripts/helpers/message';
import { BigButton } from './Button';

const wordList = require('../constants/wordList.json');

export const WalletRestore = ({
  onRestoreComplete = () => {},
  confirmBefore = false,
  submitLabel = 'Reset',
  ...props
}) => {
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

  const validate = useCallback(() => {
    const phraseTokens = formData.seedPhrase
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ');
    if (phraseTokens.length !== 12) {
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

    for (let i = 0; i < phraseTokens.length; ++i) {
      const word = phraseTokens[i];
      if (wordList.indexOf(word) === -1 && word !== '') {
        setErrors({
          ...errors,
          seedPhrase: `'${word}' is not a MyDoge seed phrase word`,
        });
        return false;
      }
    }
    setErrors({});
    return true;
  }, [errors, formData.confirm, formData.password, formData.seedPhrase]);

  const onSubmit = useCallback(() => {
    if (validate()) {
      if (confirmBefore) {
        openDialog();
      } else {
        onReset();
      }
    }
  }, [confirmBefore, onReset, openDialog, validate]);

  const onReset = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.RESET_WALLET,
        data: { password: formData.password, seedPhrase: formData.seedPhrase },
      },
      ({ authenticated, wallet }) => {
        if (authenticated && wallet) {
          closeDialog();
          onRestoreComplete({ authenticated, wallet });
        }
      }
    );
  }, [closeDialog, formData.password, formData.seedPhrase, onRestoreComplete]);

  return (
    <VStack {...props}>
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
                showPassword ? <Icon as={FaEye} /> : <Icon as={FaEyeSlash} />
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
                showPassword ? <Icon as={FaEye} /> : <Icon as={FaEyeSlash} />
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
                {submitLabel}
              </BigButton>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </VStack>
  );
};
