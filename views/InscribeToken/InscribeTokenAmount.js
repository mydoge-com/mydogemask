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

export const InscribeTokenAmount = ({
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

  const { availableBalance, pendingAvailableAmount } = selectedToken;

  const onChangeTextToken = useCallback(
    (text) => {
      if (Number.isNaN(Number(text))) {
        return;
      }

      setErrors({ ...errors, tokenAmount: '' });
      const cleanText = parseFloat(sanitizeDogeInput(text || '0')).toFixed(0);

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
    onChangeTextToken(String(selectedToken.availableBalance));
  }, [onChangeTextToken, selectedToken.availableBalance]);

  const validate = useCallback(() => {
    return selectedToken.availableBalance >= Number(formData.tokenAmount);
  }, [selectedToken.availableBalance, formData.tokenAmount]);

  const onSubmit = useCallback(() => {
    if (validate()) {
      setLoading(true);
      sendMessage(
        {
          message: MESSAGE_TYPES.CREATE_TRANSFER_TRANSACTION,
          data: {
            ...selectedToken,
            selectedAddressIndex,
            walletAddress,
            tokenAmount: formData.tokenAmount,
          },
        },
        ({ txs, fee }) => {
          if (txs?.length) {
            setFormData({
              ...formData,
              txs,
              fee,
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
        Inscribe Token
      </Text>
      <HStack mb='8px' space='10px'>
        <Text fontWeight='semibold' bg='gray.100' px='6px' rounded='md'>
          {walletNickname ?? `Wallet: ${selectedAddressIndex + 1}`}
        </Text>
        <Text fontSize='sm' color='gray.500'>
          {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-4)}
        </Text>
      </HStack>
      <Text
        fontSize='13px'
        color='gray.500'
        px='8px'
        textAlign='center'
        pb='16px'
        pt='16px'
      >
        Initiate the first step of transferring your{' '}
        <Text fontWeight='bold'>{selectedToken.ticker}</Text> tokens. This step
        makes the inscribed amount of{' '}
        <Text fontWeight='bold'>{selectedToken.ticker}</Text> available for
        transfer.
      </Text>
      <Box
        justifyContent='center'
        alignItems='center'
        pt='14px'
        pb='8px'
        w='80%'
        h='70px'
      >
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
          InputLeftElement={
            <Text fontSize='24px' fontWeight='semibold' px='4px'>
              {selectedToken.ticker}
            </Text>
          }
          textAlign='center'
          ref={tokenInputRef}
          value={formData.tokenAmount}
        />
      </Box>

      <Text fontSize='10px' color='red.500'>
        {errors.tokenAmount || ' '}
      </Text>
      <VStack alignItems='center' pt='12px' space='8px'>
        {availableBalance ? (
          <HStack space='10px'>
            <Text fontSize='14px' color='gray.500'>
              Balance: <Text fontWeight='bold'>{selectedToken.ticker}</Text>{' '}
              {availableBalance}
            </Text>
            {pendingAvailableAmount ? (
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
                      Pending token inscriptions affect your available token
                      balance.{'\n\n'}
                      Pending inscriptions:
                      {'\n'}
                      <Text fontWeight='bold'>
                        {selectedToken.ticker}{' '}
                        {Number(pendingAvailableAmount).toLocaleString()}
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
