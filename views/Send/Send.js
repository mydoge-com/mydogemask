import { Avatar, Box, Button, Center, HStack, Input, Text } from 'native-base';
import { useCallback, useRef, useState } from 'react';
import { IoSwapVerticalOutline } from 'react-icons/io5';
import sb from 'satoshi-bitcoin';

import { BigButton } from '../../components/Button';
import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { useInterval } from '../../hooks/useInterval';
import { sendMessage } from '../../scripts/helpers/message';
import { validateAddress } from '../../scripts/helpers/wallet';
import { sanitizeDogeInput, sanitizeFiat } from '../../utils/formatters';

const MAX_CHARACTERS = 16;

export function Send() {
  const { wallet, selectedAddressIndex } = useAppContext();

  const walletAddress = wallet.addresses[selectedAddressIndex];

  const [formPage, setFormPage] = useState('address');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const RenderScreen =
    {
      address: AddressScreen,
      amount: AmountScreen,
    }[formPage] ?? null;

  return (
    <Layout withHeader p={0} withBackButton backRoute='Transactions'>
      <Box pt='72px' px='12px'>
        <RenderScreen
          walletAddress={walletAddress}
          setFormPage={setFormPage}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
        />
      </Box>
    </Layout>
  );
}

const AddressScreen = ({
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
    </>
  );
};

const AmountScreen = ({
  setFormPage,
  errors,
  setFormData,
  formData,
  walletAddress,
}) => {
  const onChangeTextDoge = useCallback(
    (text) => {
      if (Number.isNaN(Number(text))) {
        return;
      }
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
    [dogecoinPrice, formData, setFormData]
  );

  const onChangeTextFiat = useCallback(
    (text) => {
      if (Number.isNaN(Number(text))) {
        return;
      }
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
    [dogecoinPrice, formData, setFormData]
  );

  const [isCurrencySwapped, setIsCurrencySwapped] = useState(false);

  const validate = useCallback(() => {
    return true;
  }, []);

  const [dogecoinPrice, setDogecoinPrice] = useState();
  const [addressBalance, setAddressBalance] = useState();

  const getDogecoinPrice = useCallback(() => {
    sendMessage({ message: 'getDogecoinPrice' }, (rates) => {
      if (rates && rates.usd) {
        setDogecoinPrice(rates.usd);
      }
    });
  }, []);

  const getAddressBalance = useCallback(() => {
    sendMessage(
      { message: 'getAddressBalance', data: { address: walletAddress } },
      (balance) => {
        if (balance) {
          console.log('balance', balance);
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
    10000,
    { immediate: true }
  );

  const onSubmit = useCallback(() => {
    if (validate()) {
      setFormPage('amount');
    }
  }, [setFormPage, validate]);

  const dogeInputRef = useRef(null);
  const fiatInputRef = useRef(null);

  const swapInput = useCallback(() => {
    setIsCurrencySwapped((state) => !state);
  }, []);

  return (
    <Center>
      <Text fontSize='xl' pb='16px' textAlign='center' fontWeight='semibold'>
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
        py='14px'
        w='80%'
        h='70px'
      >
        {!isCurrencySwapped ? (
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
            isInvalid={'dogeAmount' in errors}
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
            isInvalid={'dogeAmount' in errors}
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
      <HStack>
        <Text fontSize='14px' color='gray.400' pt='12px'>
          Balance: Ð{sb.toBitcoin(addressBalance)}
        </Text>
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
          isDisabled={!formData.dogeAmount || errors.dogeAmount}
        >
          Next
        </BigButton>
      </HStack>
    </Center>
  );
};
