import dayjs from 'dayjs';
import { Box, Pressable, Text, Toast, VStack } from 'native-base';
import { Fragment, memo } from 'react';

import { ToastRender } from '../../../components/ToastRender';
import { useAppContext } from '../../../hooks/useAppContext';
import { useCachedInscriptionTxs } from '../../../hooks/useCachedInscriptionTxs';
import { TRANSACTION_TYPES } from '../../../scripts/helpers/constants';
import { NFTView } from './NFTView';

export const NFTComponent = ({ nft, index, onPress, selected }) => {
  const { inscriptionNumber, timestamp, amount, ticker } = nft ?? {};

  const { navigate } = useAppContext();

  const selectToken = () => {
    navigate(`/Transactions/doginals?selectedNFT=${JSON.stringify(nft)}`);
  };

  const pendingDoginalTxs = useCachedInscriptionTxs({
    filterPending: true,
  }).filter(
    (tx) =>
      tx.txType === TRANSACTION_TYPES.DOGINAL_TX ||
      tx.txType === TRANSACTION_TYPES.DRC20_SEND_INSCRIPTION_TX
  );

  const isNFTPending = pendingDoginalTxs?.find(
    (tx) => tx.output === nft?.output
  );

  return (
    <Fragment key={inscriptionNumber}>
      <Pressable
        onPress={() => {
          if (isNFTPending) {
            Toast.show({
              duration: 3000,
              render: () => {
                return (
                  <ToastRender
                    title='Unable to select NFT'
                    description="There's a pending transfer of this NFT. Check your transaction history for more details."
                    status='info'
                  />
                );
              },
            });
            return;
          }
          if (onPress) {
            onPress();
          } else {
            selectToken();
          }
        }}
        paddingTop='20px'
        flex={1 / 2}
        paddingLeft={index % 2 === 0 ? 0 : '6px'}
        paddingRight={index % 2 === 0 ? '6px' : 0}
      >
        <VStack
          p='10px'
          borderRadius='12px'
          bg='gray.100'
          {...(selected ? { bg: 'amber.100' } : {})}
        >
          <Box
            width='100%'
            borderRadius='6px'
            overflow='hidden'
            alignItems='center'
            justifyContent='center'
            maxH='130px'
          >
            <NFTView nft={nft} />
          </Box>

          <Text fontSize='16px' fontWeight='bold' color='yellow.600' pt='10px'>
            {ticker ? `${ticker} ${amount}` : `# ${inscriptionNumber}`}
          </Text>

          {timestamp && (
            <Text fontSize='12px' fontWeight='medium' color='gray.500'>
              {dayjs(timestamp * 1000).format('YYYY-MM-DD')}
            </Text>
          )}
        </VStack>
      </Pressable>
    </Fragment>
  );
};

export const NFT = memo(NFTComponent, (prev, next) => {
  return prev.nft?.output === next.nft?.output;
});
