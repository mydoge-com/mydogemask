import {
  Box,
  Button,
  Center,
  HStack,
  Input,
  Popover,
  Pressable,
  Text,
  Toast,
  VStack,
} from 'native-base';
import { useCallback, useRef, useState } from 'react';
import { BsInfoCircleFill } from 'react-icons/bs';

import { BigButton } from '../../components/Button';
import { ToastRender } from '../../components/ToastRender';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { sanitizeDogeInput } from '../../utils/formatters';

const MAX_CHARACTERS = 10000;

export const TransferDunesAmount = ({
  setFormPage,
  errors,
  setErrors,
  setFormData,
  formData,
  walletAddress,
  selectedAddressIndex,
  walletNickname,
  selectedToken,
}) => {
  const tokenInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const { overallBalance, pendingTransferAmount } = selectedToken;

  const onChangeTextToken = useCallback(
    (text) => {
      if (Number.isNaN(Number(text))) {
        return;
      }

      setErrors({ ...errors, tokenAmount: '' });
      const cleanText = sanitizeDogeInput(text || '0', selectedToken.decimals);

      if (cleanText.length > MAX_CHARACTERS) {
        return;
      }

      const dogeAmount = (
        parseFloat(cleanText) * selectedToken.dogePrice
      ).toFixed(8);

      setFormData({
        ...formData,
        dogeAmount,
        tokenAmount: cleanText,
      });
    },
    [selectedToken.dogePrice, errors, formData, setErrors, setFormData]
  );

  const onSetMax = useCallback(() => {
    onChangeTextToken(String(selectedToken.overallBalance));
  }, [onChangeTextToken, selectedToken.overallBalance]);

  const validate = useCallback(() => {
    return selectedToken.overallBalance >= Number(formData.tokenAmount);
  }, [selectedToken.overallBalance, formData.tokenAmount]);

  const onSubmit = useCallback(() => {
    if (validate()) {
      setLoading(true);
      sendMessage(
        {
          message: MESSAGE_TYPES.CREATE_DUNES_TRANSACTION,
          data: {
            ...selectedToken,
            selectedAddressIndex,
            walletAddress,
            tokenAmount: formData.tokenAmount,
            recipientAddress: formData.address.trim(),
          },
        },
        ({ rawTx, fee, amount }) => {
          if ((rawTx, fee, amount)) {
            setFormData({
              ...formData,
              rawTx,
              fee,
              dogeAmount: amount,
            });
            setFormPage('confirmationDunes');
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
    } else {
      setErrors({ ...errors, tokenAmount: 'Insufficient balance' });
    }
  }, [
    errors,
    formData,
    setErrors,
    setFormData,
    setFormPage,
    validate,
    walletAddress,
    selectedAddressIndex,
    selectedToken,
  ]);

  return (
    <Center>
      <Text
        fontWeight='semibold'
        px='6px'
        pb='18px'
        rounded='md'
        fontSize='20px'
      >
        Transfer Dunes
      </Text>
      <HStack mb='8px' space='10px'>
        <Text fontWeight='semibold' bg='gray.100' px='6px' rounded='md'>
          {walletNickname ?? `Wallet: ${selectedAddressIndex + 1}`}
        </Text>
        <Text fontSize='sm' color='gray.500'>
          {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-4)}
        </Text>
      </HStack>
      <Box
        justifyContent='center'
        alignItems='center'
        pt='14px'
        pb='8px'
        w='80%'
        h='70px'
      >
        <Text fontSize='24px' fontWeight='semibold' px='4px'>
          {selectedToken.ticker}
        </Text>
        <Input
          keyboardType='numeric'
          variant='filled'
          placeholder='0'
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
          isInvalid={errors.tokenAmount}
          onChangeText={onChangeTextToken}
          onSubmitEditing={onSubmit}
          autoFocus
          type='number'
          fontSize='24px'
          fontWeight='semibold'
          _input={{
            py: '10px',
            pl: '4px',
            type: 'number',
          }}
          textAlign='center'
          ref={tokenInputRef}
          value={formData.tokenAmount}
        />
      </Box>

      <Text fontSize='10px' color='red.500'>
        {errors.tokenAmount || ' '}
      </Text>
      <VStack alignItems='center' pt='12px' space='8px'>
        {overallBalance ? (
          <HStack space='10px'>
            <Text fontSize='14px' color='gray.500'>
              Balance: <Text fontWeight='bold'>{selectedToken.ticker}</Text>{' '}
              {overallBalance}
            </Text>
            {pendingTransferAmount ? (
              <Popover
                trigger={(triggerProps) => {
                  return (
                    <Pressable {...triggerProps}>
                      <BsInfoCircleFill color='#FCD436' />
                    </Pressable>
                  );
                }}
              >
                <Popover.Content>
                  <Popover.Arrow />
                  <Popover.Body>
                    <Text fontSize='13px'>
                      Pending token transfers affect transferable token balance.
                      {'\n\n'}
                      Pending transfers:
                      {'\n'}
                      <Text fontWeight='bold'>
                        {selectedToken.ticker}{' '}
                        {Number(pendingTransferAmount).toLocaleString()}
                      </Text>
                    </Text>
                  </Popover.Body>
                </Popover.Content>
              </Popover>
            ) : null}
          </HStack>
        ) : null}
        <Button
          background='gray.400'
          px='6px'
          h='20px'
          rounded='6px'
          _hover={{ background: 'gray.500' }}
          onPress={onSetMax}
        >
          Max
        </Button>
      </VStack>
      <HStack alignItems='center' mt='60px' space='12px'>
        <BigButton
          onPress={onSubmit}
          type='submit'
          role='button'
          px='28px'
          isDisabled={!validate()}
          loading={loading}
        >
          Next
        </BigButton>
      </HStack>
    </Center>
  );
};
