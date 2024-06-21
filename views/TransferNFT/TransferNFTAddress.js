import { Box, Input, Text, Toast } from 'native-base';
import { useCallback, useState } from 'react';

import { BigButton } from '../../components/Button';
import { ToastRender } from '../../components/ToastRender';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { validateAddress } from '../../scripts/helpers/wallet';
import { NFTView } from '../Transactions/components/NFT';

export const TransferNFTAddress = ({
  walletAddress,
  setFormPage,
  errors,
  setErrors,
  setFormData,
  formData,
  selectedNFT,
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

      sendMessage(
        {
          message: MESSAGE_TYPES.CREATE_NFT_TRANSACTION,
          data: {
            ...selectedNFT,
            address: walletAddress,
            recipientAddress: formData.address.trim(),
          },
        },
        ({ rawTx, fee, amount }) => {
          if (rawTx && fee !== undefined && amount) {
            setFormData({
              ...formData,
              rawTx,
              fee,
              dogeAmount: amount,
            });
            setFormPage('confirmation');
            setLoading(false);
          } else {
            setLoading(false);
            Toast.show({
              title: 'Error',
              description: 'Error creating transaction',
              duration: 3000,
              render: () => {
                return (
                  <ToastRender
                    title='Error'
                    description='Error creating transaction'
                    status='error'
                  />
                );
              },
            });
          }
        }
      );
    }
  }, [
    formData,
    selectedNFT,
    setFormData,
    setFormPage,
    validate,
    walletAddress,
  ]);

  return (
    <>
      <Text fontSize='xl' pb='16px' textAlign='center' fontWeight='semibold'>
        Transfer Doginal
      </Text>
      <Box borderRadius='12px' overflow='hidden' mb='24px' mx='20px'>
        <NFTView nft={selectedNFT} />
      </Box>
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
