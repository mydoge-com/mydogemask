import { HStack, Pressable, Text, VStack } from 'native-base';
import { Fragment } from 'react';

import { useAppContext } from '../../../hooks/useAppContext';
import { TRANSACTION_TYPES } from '../../../scripts/helpers/constants';
import { TokenIcon } from './TokenIcon';

export const Token = ({
  token: {
    protocol,
    overallBalance,
    ticker,
    transferableBalance: transferable,
    availableBalance: available,
  },
  token,
  pendingTxs,
}) => {
  const { navigate } = useAppContext();

  // Pending transfer inscriptions
  const pendingTransferTxs = pendingTxs?.filter(
    (tx) => tx.txType === TRANSACTION_TYPES.DRC20_SEND_INSCRIPTION_TX
  );
  const pendingTransferAmount = pendingTransferTxs?.length
    ? pendingTransferTxs.reduce((acc, tx) => acc + Number(tx.tokenAmount), 0)
    : 0;
  const transferableBalance = Number(transferable) - pendingTransferAmount;

  // Pending available inscriptions
  const pendingAvailableTxs = pendingTxs?.filter(
    (tx) => tx.txType === TRANSACTION_TYPES.DRC20_AVAILABLE_TX
  );
  const pendingAvailableAmount = pendingAvailableTxs?.length
    ? pendingAvailableTxs.reduce((acc, tx) => acc + Number(tx.tokenAmount), 0)
    : 0;
  const availableBalance = Number(available) - pendingAvailableAmount;

  const selectToken = () => {
    navigate(
      `/Transactions/tokens?selectedToken=${JSON.stringify({
        ...token,
        transferableBalance,
        pendingTransferAmount,
        pendingAvailableAmount,
        availableBalance,
      })}`
    );
  };
  return (
    <Fragment key={ticker}>
      <Pressable onPress={() => selectToken(token)} paddingTop='10px'>
        <HStack p='2px' alignItems='center'>
          <TokenIcon
            ticker={ticker}
            size='sm'
            bg='brandYellow.500'
            _text={{ color: 'gray.800' }}
            mr='12px'
          />
          <Text fontSize='md' fontWeight='medium' flex={1}>
            {ticker}
          </Text>
          <VStack alignItems='flex-end' ml='8px'>
            <Text fontSize='sm' fontWeight='bold'>
              {Number(overallBalance).toLocaleString()}
            </Text>

            {protocol === 'drc20' ? ( // Potentially add more protocols
              <HStack>
                <Text
                  fontSize='12px'
                  _light={{ color: 'gray.400' }}
                  _dark={{ color: 'gray.500' }}
                >
                  Transferable:
                </Text>
                <Text
                  fontSize='12px'
                  fontWeight='semibold'
                  _light={{ color: 'gray.400' }}
                  _dark={{ color: 'gray.500' }}
                >
                  {Number(transferableBalance).toLocaleString()}
                </Text>
              </HStack>
            ) : (
              // Assume Dunes for now
              <HStack>
                <Text
                  fontSize='12px'
                  _light={{ color: 'gray.400' }}
                  _dark={{ color: 'gray.500' }}
                >
                  Dunes
                </Text>
              </HStack>
            )}
          </VStack>
        </HStack>
      </Pressable>
    </Fragment>
  );
};
