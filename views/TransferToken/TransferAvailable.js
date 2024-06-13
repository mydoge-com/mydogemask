import { Box } from 'native-base';
import { useState } from 'react';

import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { AvailableAmountScreen } from './AvailableAmountScreen';
import { InscribeTransferConfirmationScreen } from './InscribeTransferConfirmationScreen';

export function TransferAvailable() {
  const { wallet, selectedAddressIndex, selectedToken } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];

  const [formPage, setFormPage] = useState('amount');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const RenderScreen =
    {
      amount: AvailableAmountScreen,
      confirmation: InscribeTransferConfirmationScreen,
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
          walletNickname={wallet.nicknames?.[walletAddress]}
        />
      </Box>
    </Layout>
  );
}
