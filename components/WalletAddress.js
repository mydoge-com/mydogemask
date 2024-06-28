import { Text, Tooltip } from 'native-base';

import { useAppContext } from '../hooks/useAppContext';

export const WalletAddress = () => {
  const { wallet, selectedAddressIndex } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];
  const addressNickname =
    wallet.nicknames?.[selectedAddressIndex] ??
    `Address ${selectedAddressIndex + 1}`;
  return (
    <Tooltip label={walletAddress} _text={{ fontSize: '10px' }}>
      <Text fontSize='sm' color='gray.500' textAlign='center' mb='12px'>
        <Text fontWeight='semibold' bg='gray.100' px='6px' rounded='md'>
          {addressNickname}
        </Text>
        {'  '}
        {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-4)}
      </Text>
    </Tooltip>
  );
};
