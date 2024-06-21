import { Box } from 'native-base';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { InscribeTokenAmount } from './InscribeTokenAmount';
import { InscribeTokenConfirmation } from './InscribeTokenConfirmation';

export function InscribeToken() {
  const { wallet, selectedAddressIndex } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];

  const [formPage, setFormPage] = useState('amount');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const RenderScreen =
    {
      amount: InscribeTokenAmount,
      confirmation: InscribeTokenConfirmation,
    }[formPage] ?? null;

  const [searchParams] = useSearchParams();

  let selectedToken = searchParams.get('selectedToken');

  if (selectedToken) {
    selectedToken = JSON.parse(selectedToken);
  }

  return (
    <Layout
      withHeader
      p={0}
      withCancelButton
      cancelRoute='/Transactions/tokens'
      addressColor='black'
    >
      <Box pt='72px' px='12px'>
        <RenderScreen
          walletAddress={walletAddress}
          setFormPage={setFormPage}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          selectedAddressIndex={selectedAddressIndex}
          selectedToken={selectedToken}
        />
      </Box>
    </Layout>
  );
}
