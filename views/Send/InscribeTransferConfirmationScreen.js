import { Button, Center, HStack, Text, Toast } from 'native-base';
import { useCallback, useState } from 'react';

import { BigButton } from '../../components/Button';
import { ToastRender } from '../../components/ToastRender';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';

export const InscribeTransferConfirmationScreen = ({
  setFormPage,
  errors,
  setErrors,
  formData,
  walletAddress,
  selectedAddressIndex,
  selectedToken,
}) => {
  const { navigate } = useAppContext();
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(() => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_ADDRESS_BALANCE,
        data: { address: walletAddress },
      },
      () => {
        // if (balance) {
        //   addressBalance = balance;
        // } else {
        //   setErrors({ confirmation: 'Error getting address balance' });
        // }

        // Process transaction
        sendMessage(
          {
            message: MESSAGE_TYPES.SEND_INSCRIBE_TRANSFER_TRANSACTION,
            data: { txs: formData.txs },
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
  }, [formData.txs, navigate, setErrors, walletAddress]);

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
        {walletAddress.slice(0, 8)}
      </Text>
      <Text fontSize='lg' pb='4px' textAlign='center' fontWeight='semibold'>
        Sending
      </Text>
      <HStack alignItems='center' space='12px' pb='28px'>
        <Text
          fontSize='md'
          fontWeight='semibold'
          color='gray.500'
          textAlign='center'
        >
          {formData.txs.toString()}
        </Text>
      </HStack>
      <Text fontSize='3xl' fontWeight='semibold' pt='6px'>
        {selectedToken.ticker} {formData.tokenAmount}
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
          Send
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
