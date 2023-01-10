import { Box, Input, Text } from 'native-base';
import { useCallback, useState } from 'react';

import { BigButton } from '../../components/Button';
import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { validateAddress } from '../../scripts/helpers/wallet';

export function Send() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const onChangeText = useCallback(
    (text) => {
      setErrors({});
      setFormData({ ...formData, address: text });
    },
    [formData]
  );
  const { wallet, selectedAddressIndex } = useAppContext();

  const walletAddress = wallet.addresses[selectedAddressIndex];

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
  }, [errors, formData.address, walletAddress]);

  const onSubmit = useCallback(() => {
    console.log('onSubmit', validate());
  }, [validate]);

  return (
    <Layout withHeader p={0} withBackButton backRoute='Transactions'>
      <Box pt='72px' px='12px'>
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
      </Box>
    </Layout>
  );
}
