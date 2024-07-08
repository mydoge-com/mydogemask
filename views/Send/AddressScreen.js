import { AlertDialog, Button, Input, Text } from 'native-base';
import { useCallback, useEffect, useState } from 'react';

import { BigButton } from '../../components/Button';
import { useAppContext } from '../../hooks/useAppContext';
import {
  INSCRIPTION_TXS_CACHE,
  TRANSACTION_PENDING_TIME,
} from '../../scripts/helpers/constants';
import { getLocalValue } from '../../scripts/helpers/storage';
import { validateAddress } from '../../scripts/helpers/wallet';

export const AddressScreen = ({
  walletAddress,
  setFormPage,
  errors,
  setErrors,
  setFormData,
  formData,
}) => {
  const onChangeText = useCallback(
    (text) => {
      setErrors({});
      setFormData({ ...formData, address: text });
    },
    [formData, setErrors, setFormData]
  );

  const { navigate } = useAppContext();

  const validate = useCallback(() => {
    if (!validateAddress(formData.address.trim())) {
      setErrors({
        ...errors,
        address: 'Invalid address',
      });
      return false;
    } else if (formData.address.trim() === walletAddress) {
      setErrors({
        ...errors,
        address: 'Cannot send to yourself',
      });
      return false;
    }
    setErrors({});
    return true;
  }, [errors, formData.address, setErrors, walletAddress]);

  const onSubmit = useCallback(() => {
    if (validate()) {
      setFormPage('amount');
    }
  }, [setFormPage, validate]);

  const [pendingTxsDialogOpen, setPendingTxsDialogOpen] = useState(false);

  const fetchCachedTxs = useCallback(async () => {
    const transactionsCache = await getLocalValue(INSCRIPTION_TXS_CACHE);

    if (transactionsCache?.length) {
      const pendingInscriptions = transactionsCache.filter(
        (tx) => tx.timestamp + TRANSACTION_PENDING_TIME > Date.now()
      );
      if (pendingInscriptions.length > 0) {
        setPendingTxsDialogOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    fetchCachedTxs();
  }, [fetchCachedTxs]);

  return (
    <>
      <Text fontSize='xl' pb='16px' textAlign='center' fontWeight='semibold'>
        Send to
      </Text>
      <Input
        variant='filled'
        placeholder='Send to DOGE address'
        py='14px'
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
        isInvalid={'address' in errors}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        autoFocus
        type='number'
        value={formData.address}
        backgroundColor='gray.100'
      />
      <Text fontSize='10px' color='red.500' pt='6px'>
        {errors.address || ' '}
      </Text>

      <BigButton
        onPress={onSubmit}
        w='80%'
        type='submit'
        role='button'
        mt='32px'
        isDisabled={!formData.address || formData.address.length <= 26}
      >
        Next
      </BigButton>
      <AlertDialog
        isOpen={pendingTxsDialogOpen}
        onClose={() => setPendingTxsDialogOpen(false)}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Pending Inscriptions</AlertDialog.Header>
          <AlertDialog.Body>
            You have pending DRC-20 inscriptions that may not yet be indexed.
            Proceeding with this transaction may result in the loss of these
            inscriptions.
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button
                variant='unstyled'
                colorScheme='coolGray'
                onPress={() => navigate(-1)}
              >
                Back
              </Button>
              <BigButton
                variant='danger'
                onPress={() => setPendingTxsDialogOpen(false)}
                px='24px'
              >
                I understand
              </BigButton>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </>
  );
};
