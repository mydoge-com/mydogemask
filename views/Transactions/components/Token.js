import { Avatar, HStack, Pressable, Text, VStack } from 'native-base';
import { Fragment, useState } from 'react';
import TimeAgo from 'timeago-react';

import { formatSatoshisAsDoge } from '../../../utils/formatters';
import { TransactionModal } from './TransactionModal';

const TICKER_ICON_URL = 'https://drc-20-icons.s3.eu-central-1.amazonaws.com';

export const Token = ({
  token: { availableBalance, overallBalance, ticker, transferableBalance },
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Fragment key={ticker}>
      <Pressable onPress={() => setIsOpen(true)} paddingTop='10px'>
        <HStack p='2px'>
          <VStack mr='12px'>
            <Avatar
              size='sm'
              bg='brandYellow.500'
              _text={{ color: 'gray.800' }}
              source={{
                uri: `${TICKER_ICON_URL}/${ticker}.png`,
              }}
            >
              {ticker.substring(0, 2).toUpperCase()}
            </Avatar>
          </VStack>
          <VStack flex={1}>
            <Text fontSize='md' fontWeight='medium'>
              {ticker}
            </Text>
            <HStack>
              <Text
                fontSize='12px'
                fontWeight='semibold'
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
          <VStack flexDirection='row' alignItems='flex-start' ml='8px'>
            <HStack
              // _light={{
              //   bg: type === 'outgoing' ? '#E4F0FF' : '#E0F8E8',
              // }}
              // _dark={{
              //   bg: type === 'outgoing' ? '#000643' : '#001109',
              // }}
              px='12px'
              py='3px'
              rounded='2xl'
            >
              {/* <Text
                fontSize='12px'
                fontWeight='bold'
                _light={{
                  color: is420(formatSatoshisAsDoge(amount, 3))
                    ? 'green.600'
                    : type === 'outgoing'
                    ? 'blue.500'
                    : 'green.500',
                }}
                _dark={{
                  color: is420(formatSatoshisAsDoge(amount, 3))
                    ? 'green.300'
                    : type === 'outgoing'
                    ? 'blue.400'
                    : 'green.500',
                }}
              >
                {type === 'outgoing' ? '-' : '+'}{' '}
                {formatSatoshisAsDoge(amount, 3)}
              </Text>
              <Text fontSize='sm' fontWeight='bold'>
                {is69(formatSatoshisAsDoge(amount, 3)) && ' 😏'}
              </Text> */}
              <Text fontSize='sm' fontWeight='bold'>
                {availableBalance}
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </Pressable>
      {/* <TransactionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        address={address}
        type={type}
        amount={amount}
        blockTime={blockTime}
        id={id}
        confirmations={confirmations}
      /> */}
    </Fragment>
  );
};
