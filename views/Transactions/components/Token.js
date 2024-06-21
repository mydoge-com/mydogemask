import { Avatar, HStack, Pressable, Text, VStack } from 'native-base';
import { Fragment } from 'react';

import { useAppContext } from '../../../hooks/useAppContext';
import { TICKER_ICON_URL } from '../../../scripts/helpers/constants';

export const Token = ({
  token: { overallBalance, ticker, transferableBalance },
  token,
}) => {
  const { navigate } = useAppContext();
  const selectToken = () => {
    navigate(`/Transactions/tokens?selectedToken=${JSON.stringify(token)}`);
  };
  return (
    <Fragment key={ticker}>
      <Pressable onPress={() => selectToken(token)} paddingTop='10px'>
        <HStack p='2px' alignItems='center'>
          <Avatar
            size='sm'
            bg='brandYellow.500'
            _text={{ color: 'gray.800' }}
            source={{
              uri: `${TICKER_ICON_URL}/${ticker}.png`,
            }}
            mr='12px'
          >
            {ticker.substring(0, 2).toUpperCase()}
          </Avatar>
          <Text fontSize='md' fontWeight='medium' flex={1}>
            {ticker}
          </Text>
          <VStack alignItems='flex-end' ml='8px'>
            <Text fontSize='sm' fontWeight='bold'>
              {Number(overallBalance).toLocaleString()}
            </Text>
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
          </VStack>
        </HStack>
      </Pressable>
    </Fragment>
  );
};
