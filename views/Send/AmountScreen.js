import { Avatar, Box, Button, Center, HStack, Input, Text } from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IoSwapVerticalOutline } from 'react-icons/io5';
import sb from 'satoshi-bitcoin';

import { BigButton } from '../../components/Button';
import { useInterval } from '../../hooks/useInterval';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { validateTransaction } from '../../scripts/helpers/wallet';
import { sanitizeDogeInput, sanitizeFiat } from '../../utils/formatters';

const MAX_CHARACTERS = 10000;
const REFRESH_INTERVAL = 10000;

export const AmountScreen = ({
  setFormPage,
  errors,
  setErrors,
  setFormData,
  formData,
  walletAddress,
  selectedAddressIndex,
}) => {
  const [isCurrencySwapped, setIsCurrencySwapped] = useState(false);
  const [dogecoinPrice, setDogecoinPrice] = useState(0);
  const [addressBalance, setAddressBalance] = useState();
  const dogeInputRef = useRef(null);
  const fiatInputRef = useRef(null);

  const getDogecoinPrice = useCallback(() => {
    sendMessage({ message: MESSAGE_TYPES.GET_DOGECOIN_PRICE }, ({ usd }) => {
      if (usd) {
        setDogecoinPrice(usd);
        onChangeTextDoge(formData.dogeAmount);
      }
    });
  }, [formData.dogeAmount, onChangeTextDoge]);

  useEffect(() => {
    getAddressBalance();
  }, [getAddressBalance, walletAddress]);

  const getAddressBalance = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_ADDRESS_BALANCE,
        data: { address: walletAddress },
      },
      (balance) => {
        if (balance) {
          setAddressBalance(balance);
        }
      }
    );
  }, [walletAddress]);

  useInterval(
    () => {
      getDogecoinPrice();
      getAddressBalance();
    },
    REFRESH_INTERVAL,
    true
  );

  const onChangeTextDoge = useCallback(
    (text) => {
      if (Number.isNaN(Number(text))) {
        return;
      }
      setErrors({ ...errors, dogeAmount: '' });
      const cleanText = sanitizeDogeInput(text) || '0';
      if (cleanText.length > MAX_CHARACTERS) {
        return;
      }

      const newFiatValue = parseFloat(cleanText * dogecoinPrice)
        .toFixed(2)
        .toString();

      setFormData({
        ...formData,
        dogeAmount: cleanText,
        fiatAmount: String(newFiatValue),
      });
    },
    [dogecoinPrice, errors, formData, setErrors, setFormData]
  );

  const onChangeTextFiat = useCallback(
    (text) => {
      if (Number.isNaN(Number(text))) {
        return;
      }
      setErrors({ ...errors, dogeAmount: '' });
      const isDeletion = text.length < formData.fiatAmount.length;
      const cleanText = sanitizeFiat(text, formData.fiatAmount, isDeletion);

      let newDogeValue = parseFloat(cleanText / dogecoinPrice);
      newDogeValue = parseFloat(newDogeValue.toFixed(2));

      if (newDogeValue.toString().length > MAX_CHARACTERS) return;

      setFormData({
        ...formData,
        fiatAmount: cleanText,
        dogeAmount: String(newDogeValue),
      });
    },
    [dogecoinPrice, errors, formData, setErrors, setFormData]
  );

  const swapInput = useCallback(() => {
    setIsCurrencySwapped((state) => !state);
  }, []);

  const onSetMax = useCallback(() => {
    onChangeTextDoge(String(sb.toBitcoin(addressBalance)));
  }, [addressBalance, onChangeTextDoge]);

  const onSubmit = useCallback(() => {
    const txData = {
      senderAddress: walletAddress,
      recipientAddress: formData.address.trim(),
      dogeAmount: formData.dogeAmount,
    };
    const error = validateTransaction({
      ...txData,
      addressBalance,
    });
    if (error) {
      setErrors({ ...errors, dogeAmount: error });
    } else {
      sendMessage(
        {
          message: 'createTransaction',
          data: txData,
        },
        ({ rawTx, fee, amount }) => {
          if (rawTx && fee && amount) {
            setFormData({
              ...formData,
              rawTx,
              fee,
              dogeAmount: amount,
            });
            setFormPage('confirmation');
          }
        }
      );
    }
  }, [
    addressBalance,
    errors,
    formData,
    setErrors,
    setFormData,
    setFormPage,
    walletAddress,
  ]);

  return (
    <Center>
      <Text fontSize='sm' color='gray.500' textAlign='center' mb='8px'>
        <Text fontWeight='semibold' bg='gray.100' px='6px' rounded='md'>
          Wallet {selectedAddressIndex + 1}
        </Text>
        {'  '}
        {walletAddress.slice(0, 8)}...{formData.address.slice(-4)}
      </Text>
      <Text fontSize='xl' pb='4px' textAlign='center' fontWeight='semibold'>
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
      <Box
        justifyContent='center'
        alignItems='center'
        pt='14px'
        pb='8px'
        w='80%'
        h='70px'
      >
        {!isCurrencySwapped ? (
          <Input
            isDisabled={dogecoinPrice === 0}
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
            isInvalid={errors.dogeAmount}
            onChangeText={onChangeTextDoge}
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
                Ð
              </Text>
            }
            textAlign='center'
            ref={dogeInputRef}
            value={formData.dogeAmount}
            position='absolute'
            top={0}
          />
        ) : (
          <Input
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
            isInvalid={errors.dogeAmount}
            onChangeText={onChangeTextFiat}
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
                $
              </Text>
            }
            textAlign='center'
            ref={fiatInputRef}
            value={formData.fiatAmount}
            position='absolute'
            top={0}
            allowFontScaling
            adjustsFontSizeToFit
          />
        )}
      </Box>

      <Text fontSize='10px' color='red.500'>
        {errors.dogeAmount || ' '}
      </Text>
      <BigButton
        variant='secondary'
        px='6px'
        py='4px'
        rounded='10px'
        mt='18px'
        mb='4px'
        onPress={swapInput}
      >
        <IoSwapVerticalOutline size='22px' style={{ paddingTop: 3 }} />
      </BigButton>
      <Text fontSize='20px' fontWeight='semibold' color='gray.500' pt='6px'>
        {!isCurrencySwapped ? '$' : 'Ð'}
        {isCurrencySwapped
          ? formData.dogeAmount || 0
          : formData.fiatAmount || 0}
      </Text>
      <HStack alignItems='center' pt='12px' space='8px'>
        {addressBalance ? (
          <Text fontSize='14px' color='gray.500'>
            Balance: Ð{sb.toBitcoin(addressBalance)}
          </Text>
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
      </HStack>
      <HStack alignItems='center' mt='60px' space='12px'>
        <Button
          variant='unstyled'
          colorScheme='coolGray'
          onPress={() => setFormPage('address')}
        >
          Back
        </Button>
        <BigButton
          onPress={onSubmit}
          type='submit'
          role='button'
          px='28px'
          isDisabled={
            !Number(formData.dogeAmount) || !addressBalance || errors.dogeAmount
          }
        >
          Next
        </BigButton>
      </HStack>
    </Center>
  );
};
