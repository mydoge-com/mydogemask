import { Avatar, Box, Center, HStack, Input, Text } from 'native-base';
import { useCallback, useState } from 'react';

import { BigButton } from '../../components/Button';
import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { validateAddress } from '../../scripts/helpers/wallet';

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
          setFormStage={setFormPage}
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
  setFormStage,
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
      setFormStage('amount');
    }
  }, [setFormStage, validate]);

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
  setFormStage,
  errors,
  setErrors,
  setFormData,
  formData,
}) => {
  const onChangeText = useCallback(
    (text) => {
      setFormData({ ...formData, amount: text });
      if (Number.isNaN(Number(text))) {
        setErrors({ ...errors, amount: 'Invalid amount' });
      } else {
        setErrors({});
      }
    },
    [errors, formData, setErrors, setFormData]
  );

  const validate = useCallback(() => {
    return true;
  }, []);

  const onSubmit = useCallback(() => {
    if (validate()) {
      setFormStage('amount');
    }
  }, [setFormStage, validate]);

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
      <Input
        variant='filled'
        placeholder='Ðoge amount'
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
        w='60%'
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
      />
      <Text fontSize='10px' color='red.500' pt='6px'>
        {errors.amount || ' '}
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
    </Center>
  );
};
