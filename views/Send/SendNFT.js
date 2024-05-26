import { Box } from 'native-base';
import { useState } from 'react';

import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { AddressScreen } from './AddressScreen';
import { NFTConfirmationScreen } from './NFTConfirmationScreen';

export function SendNFT() {
  const { wallet, selectedAddressIndex, selectedNFT } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];

  const [formPage, setFormPage] = useState('address');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const RenderScreen =
    {
      address: AddressScreen,
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
          selectedNFT={selectedNFT}
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
