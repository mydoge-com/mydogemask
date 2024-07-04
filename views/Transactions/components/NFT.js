import dayjs from 'dayjs';
import { Box, Pressable, Text, VStack } from 'native-base';
import { Fragment } from 'react';

import { useAppContext } from '../../../hooks/useAppContext';
import { NFTView } from './NFTView';

export const NFT = ({ nft, index, onPress, selected }) => {
  const { inscriptionNumber, timestamp, amount, ticker } = nft ?? {};

  const { navigate } = useAppContext();

  const selectToken = () => {
    navigate(`/Transactions/doginals?selectedNFT=${JSON.stringify(nft)}`);
  };

  return (
    <Fragment key={inscriptionNumber}>
      <Pressable
        onPress={() => {
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
