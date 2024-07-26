import { Box } from 'native-base';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { TransferNFTAddress } from './TransferNFTAddress';
import { TransferNFTConfirmation } from './TransferNFTConfirmation';

export function TransferNFT() {
  const { wallet, selectedAddressIndex } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];

  const [formPage, setFormPage] = useState('address');
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const RenderScreen =
    {
      address: TransferNFTAddress,
      confirmation: TransferNFTConfirmation,
    }[formPage] ?? null;

  const [searchParams] = useSearchParams();

  let selectedNFT = searchParams.get('selectedNFT');

  if (selectedNFT) {
    selectedNFT = JSON.parse(selectedNFT);
  }

  return (
    <Layout
      withHeader
      p={0}
      withCancelButton
      cancelRoute='/Transactions/doginals'
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
