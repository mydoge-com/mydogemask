import { Input, Text } from 'native-base';
import { useCallback, useState } from 'react';

import { BigButton } from '../../components/Button';
import { validateAddress } from '../../scripts/helpers/wallet';

export const TransferTokenAddress = ({
  walletAddress,
  selectedToken,
  setFormPage,
  errors,
  setErrors,
  setFormData,
  formData,
}) => {
  const [loading, setLoading] = useState(false);
  const onChangeText = useCallback(
    (text) => {
      setErrors({});
      setFormData({ ...formData, address: text });
    },
    [formData, setErrors, setFormData]
  );

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
      setLoading(true);
      setFormPage('amount');
    }
  }, [setFormPage, validate]);

  return (
    <>
      <Text fontSize='xl' pb='16px' textAlign='center'>
        Send <Text fontWeight='bold'>{selectedToken.ticker}</Text> to
      </Text>
      <Input
        variant='filled'
        placeholder='Recipient wallet address'
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
        loading={loading}
      >
        Next
      </BigButton>
    </>
  );
};
