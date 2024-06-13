import {
  Box,
  Button,
  Center,
  HStack,
  Input,
  Text,
  Toast,
  VStack,
} from 'native-base';
import { useCallback, useRef, useState } from 'react';

// import { IoSwapVerticalOutline } from 'react-icons/io5';
import { BigButton } from '../../components/Button';
import { ToastRender } from '../../components/ToastRender';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { sanitizeDogeInput } from '../../utils/formatters';

const MAX_CHARACTERS = 10000;

export const AvailableAmountScreen = ({
  setFormPage,
  errors,
  setErrors,
  setFormData,
  formData,
  walletAddress,
  selectedAddressIndex,
  selectedToken,
}) => {
  // const [isCurrencySwapped, setIsCurrencySwapped] = useState(false);
  const tokenInputRef = useRef(null);
  // const dogeInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

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

  // const onChangeTextDoge = useCallback(
  //   (text) => {
  //     if (Number.isNaN(Number(text))) {
  //       return;
  //     }

  //     setErrors({ ...errors, tokenAmount: '' });
  //     const cleanText = sanitizeDogeInput(text) || '0';

  //     if (cleanText.length > MAX_CHARACTERS) {
  //       return;
  //     }

  //     const tokenAmount = (
  //       parseFloat(cleanText) / selectedToken.dogePrice
  //     ).toFixed(0);

  //     setFormData({
  //       ...formData,
  //       tokenAmount,
  //       dogeAmount: cleanText,
  //     });
  //   },
  //   [selectedToken.dogePrice, errors, formData, setErrors, setFormData]
  // );

  // const swapInput = useCallback(() => {
  //   setIsCurrencySwapped((state) => !state);
  // }, []);

  const onSetMax = useCallback(() => {
    onChangeTextToken(String(selectedToken.availableBalance));
  }, [selectedToken.availableBalance, onChangeTextToken]);

  const validate = useCallback(() => {
    return selectedToken.availableBalance >= Number(formData.tokenAmount);
  }, [selectedToken.availableBalance, formData.tokenAmount]);

  const onSubmit = useCallback(() => {
    if (validate()) {
      setLoading(true);
      sendMessage(
        {
          message: MESSAGE_TYPES.INSCRIBE_TRANSFER_TRANSACTION,
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
        Inscribe Token Transfer
      </Text>
      {/* <Text fontSize='sm' color='gray.500' textAlign='center' mb='8px'>
        <Text fontWeight='semibold' bg='gray.100' px='6px' rounded='md'>
          Wallet: {selectedAddressIndex + 1}
        </Text>
      </Text> */}
      <Text
        fontSize='13px'
        color='gray.500'
        px='8px'
        textAlign='center'
        pb='16px'
        pt='16px'
      >
        Inscribing your <Text fontWeight='bold'>{selectedToken.ticker}</Text>{' '}
        token makes the inscribed amount available for transfer.
      </Text>
      <Box
        justifyContent='center'
        alignItems='center'
        pt='14px'
        pb='8px'
        w='80%'
        h='70px'
      >
        <Text
          fontSize='15px'
          color='gray.900'
          px='8px'
          // textAlign='center'
          pb='6px'
        >
          Inscription amount:
        </Text>
        <Input
          keyboardType='numeric'
          // isDisabled={selectedToken.dogePrice === 0}
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
          // position='absolute'
          // top={0}
        />
        {/* ) : (
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
            allowFontScaling
            adjustsFontSizeToFit
          />
        )} */}
      </Box>

      <Text fontSize='10px' color='red.500'>
        {errors.tokenAmount || ' '}
      </Text>
      {/* <BigButton
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
        {!isCurrencySwapped ? 'Ð' : `${selectedToken.ticker} `}
        {isCurrencySwapped
          ? formData.tokenAmount || 0
          : formData.dogeAmount || 0}
      </Text> */}
      <VStack alignItems='center' pt='12px' space='8px'>
        {selectedToken.availableBalance ? (
          <Text fontSize='14px' color='gray.500'>
            Balance: <Text fontWeight='bold'>{selectedToken.ticker}</Text>{' '}
            {selectedToken.availableBalance}
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
      </VStack>
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
          isDisabled={!validate()}
          loading={loading}
        >
          Next
        </BigButton>
      </HStack>
    </Center>
  );
};
