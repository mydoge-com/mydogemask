import { Box } from 'native-base';
import { useState } from 'react';

import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { AvailableAmountScreen } from './AvailableAmountScreen';
import { NFTConfirmationScreen } from './NFTConfirmationScreen';

export function TransferAvailable() {
  const { wallet, selectedAddressIndex, selectedToken } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];

  const [formPage, setFormPage] = useState('amount');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const RenderScreen =
    {
      amount: AvailableAmountScreen,
      confirmation: NFTConfirmationScreen,
    }[formPage] ?? null;

  return (
    <Layout
      withHeader
      p={0}
      withCancelButton
      cancelRoute='Transactions'
      addressColor='black'
    >
      <Box pt='72px' px='12px'>
        <RenderScreen
          walletAddress={walletAddress}
          selectedToken={selectedToken}
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
