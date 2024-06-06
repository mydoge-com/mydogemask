import { Avatar, HStack, Pressable, Text, VStack } from 'native-base';
import { Fragment, useState } from 'react';

import { TICKER_ICON_URL } from '../../../scripts/helpers/constants';
import { TokenModal } from './TokenModal';

export const Token = ({
  token,
  token: { overallBalance, ticker, transferableBalance },
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Fragment key={ticker}>
      <Pressable onPress={() => setIsOpen(true)} paddingTop='10px'>
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
                {transferableBalance}
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </Pressable>
      <TokenModal
        isOpen={isOpen}
        token={token}
        onClose={() => setIsOpen(false)}
      />
    </Fragment>
  );
};
