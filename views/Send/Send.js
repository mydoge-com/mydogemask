import { Box } from 'native-base';
import { useState } from 'react';

import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { AddressScreen } from './AddressScreen';
import { AmountScreen } from './AmountScreen';
import { ConfirmationScreen } from './ConfirmationScreen';

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
      confirmation: ConfirmationScreen,
    }[formPage] ?? null;

  return (
    <Layout withHeader p={0} withCancelButton cancelRoute='Transactions'>
      <Box pt='72px' px='12px'>
        <RenderScreen
          walletAddress={walletAddress}
          setFormPage={setFormPage}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          selectedAddressIndex={selectedAddressIndex}
        />
      </Box>
    </Layout>
  );
}
