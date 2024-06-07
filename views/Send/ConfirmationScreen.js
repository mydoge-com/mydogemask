import { Avatar, Button, Center, HStack, Text, Toast } from 'native-base';
import { useCallback, useEffect, useState } from 'react';

import { BigButton } from '../../components/Button';
import { ToastRender } from '../../components/ToastRender';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { validateTransaction } from '../../scripts/helpers/wallet';

export const ConfirmationScreen = ({
  setFormPage,
  errors,
  setErrors,
  formData,
  walletAddress,
  selectedAddressIndex,
}) => {
  const { navigate } = useAppContext();
  const [loading, setLoading] = useState(false);
  const onSubmit = useCallback(() => {
    let addressBalance;

    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_ADDRESS_BALANCE,
        data: { address: walletAddress },
      },
      (balance) => {
        if (balance) {
          addressBalance = balance;
        } else {
          setErrors({ confirmation: 'Error getting address balance' });
        }

        const error = validateTransaction({
          senderAddress: walletAddress,
          recipientAddress: formData.address.trim(),
          dogeAmount: formData.dogeAmount,
          addressBalance,
        });
        if (error) {
          setErrors({ confirmation: error });
          setLoading(false);

          return;
        }
        // Process transaction
        sendMessage(
          {
            message: 'sendTransaction',
            data: { rawTx: formData.rawTx, selectedAddressIndex },
          },
          (txId) => {
            if (txId) {
              setLoading(false);
              Toast.show({
                duration: 3000,
                render: () => {
                  return (
                    <ToastRender
                      description='Trasaction Sent'
                      status='success'
                    />
                  );
                },
              });

              navigate('Transactions');
            } else {
              setLoading(false);
              Toast.show({
                title: 'Error',
                description: 'Transaction Failed',
                duration: 3000,
                render: () => {
                  return (
                    <ToastRender
                      title='Error'
                      description='Failed to send transaction.'
                      status='error'
                    />
                  );
                },
              });
            }
          }
        );
      }
    );
  }, [
    formData.address,
    formData.dogeAmount,
    formData.rawTx,
    navigate,
    selectedAddressIndex,
    setErrors,
    walletAddress,
  ]);

  useEffect(() => {
    if (walletAddress !== formData.address) {
      setErrors({});
    }
  }, [walletAddress, formData.address, setErrors]);

  return (
    <Center>
      <Text fontSize='2xl' pb='24px' textAlign='center' fontWeight='semibold'>
        Confirm Transaction
      </Text>
      <Text fontSize='sm' color='gray.500' textAlign='center' mb='12px'>
        <Text fontWeight='semibold' bg='gray.100' px='6px' rounded='md'>
          Wallet {selectedAddressIndex + 1}
        </Text>
        {'  '}
        {walletAddress.slice(0, 8)}...{walletAddress.slice(-4)}
      </Text>
      <Text fontSize='lg' pb='4px' textAlign='center' fontWeight='semibold'>
        Paying
      </Text>
      <HStack alignItems='center' space='12px' pb='28px'>
        <Avatar size='sm' bg='brandYellow.500' _text={{ color: 'gray.800' }}>
          {formData.address.substring(0, 2)}
        </Avatar>
        <Text
          fontSize='md'
          fontWeight='semibold'
          color='gray.500'
          textAlign='center'
        >
          {formData.address.slice(0, 8)}...{formData.address.slice(-4)}
        </Text>
      </HStack>
      <Text fontSize='3xl' fontWeight='semibold' pt='6px'>
        Ð{formData.dogeAmount}
      </Text>
      <Text fontSize='13px' fontWeight='semibold' pt='6px'>
        Network fee Ð{formData.fee}
      </Text>
      <HStack alignItems='center' mt='60px' space='12px'>
        <Button
          variant='unstyled'
          colorScheme='coolGray'
          onPress={() => setFormPage('amount')}
        >
          Back
        </Button>
        <BigButton
          onPress={onSubmit}
          type='submit'
          role='button'
          px='28px'
          isDisabled={errors.confirmation}
          loading={loading}
        >
          Pay
        </BigButton>
      </HStack>
      {errors.confirmation ? (
        <Text fontSize='10px' color='red.500' mt='20px'>
          {errors.confirmation}
        </Text>
      ) : null}
    </Center>
  );
};
