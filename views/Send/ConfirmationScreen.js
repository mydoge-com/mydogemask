import { Avatar, Button, Center, HStack, Text } from 'native-base';
import { useCallback } from 'react';

import { BigButton } from '../../components/Button';
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
  const onSubmit = useCallback(() => {
    let addressBalance;
    sendMessage(
      { message: 'getAddressBalance', data: { address: walletAddress } },
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
          return;
        }
        // Process transaction
        console.log('sending transaction');
      }
    );
  }, [formData.address, formData.dogeAmount, setErrors, walletAddress]);

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
        {walletAddress.slice(0, 8)}...{formData.address.slice(-4)}
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

      <Text fontSize='52px' fontWeight='semibold' pt='6px'>
        Ð{formData.dogeAmount}
      </Text>
      <Text fontSize='13px' fontWeight='semibold' pt='6px'>
        Network Fee Ð{formData.fee}
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
        >
          Pay
        </BigButton>
      </HStack>
    </Center>
  );
};
