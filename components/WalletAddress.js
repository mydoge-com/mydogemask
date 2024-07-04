import { Box, Text, Tooltip } from 'native-base';

import { useAppContext } from '../hooks/useAppContext';

export const WalletAddress = ({ address }) => {
  const { wallet, selectedAddressIndex } = useAppContext();

  const walletAddress = address ?? wallet.addresses[selectedAddressIndex];

  const addressIndex = wallet.addresses.indexOf(walletAddress);
  const addressNickname =
    wallet.nicknames?.[walletAddress] ?? `Address ${addressIndex + 1}`;

  return (
    <Box mb='12px'>
      <Tooltip label={walletAddress} _text={{ fontSize: '10px' }}>
        <Box>
          <Text fontSize='sm' color='gray.500' textAlign='center'>
            <Text fontWeight='semibold' bg='gray.100' px='6px' rounded='md'>
              {addressNickname}
            </Text>
            {'  '}
            {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-4)}
          </Text>
        </Box>
      </Tooltip>
    </Box>
  );
};
