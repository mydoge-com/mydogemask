import { Avatar, HStack, Pressable, Text, VStack } from 'native-base';
import { Fragment } from 'react';
import TimeAgo from 'timeago-react';

import { InscriptionIndicator } from '../../../components/InscriptionIndicator';
import { useAppContext } from '../../../hooks/useAppContext';
import { formatSatoshisAsDoge, is69, is420 } from '../../../utils/formatters';

export const Transaction = ({
  transaction: { address, id, blockTime, type, amount, confirmations },
  transaction,
  cachedInscription,
}) => {
  const { navigate } = useAppContext();

  const selectTx = () => {
    navigate(`/Transactions/tokens?selectedTx=${JSON.stringify(transaction)}`);
  };

  return (
    <Fragment key={id}>
      <Pressable onPress={selectTx} paddingTop='10px'>
        <HStack p='2px'>
          <VStack mr='12px'>
            <Avatar
              size='sm'
              bg='brandYellow.500'
              _text={{ color: 'gray.800' }}
            >
              {address?.substring(0, 2)}
            </Avatar>
          </VStack>
          <VStack flex={1}>
            <Text fontSize='xs' fontWeight='medium'>
              {address?.includes('Multiple')
                ? address
                : `${address?.slice(0, 8)}...${address?.slice(-4)}`}
            </Text>

            <HStack space='6px'>
              <Text
                fontSize='12px'
                fontWeight='semibold'
                _light={{ color: 'gray.400' }}
                _dark={{ color: 'gray.500' }}
              >
                {confirmations === 0 ? (
                  'PENDING'
                ) : (
                  <TimeAgo datetime={blockTime * 1000} />
                )}
              </Text>
              <InscriptionIndicator cachedInscription={cachedInscription} />
            </HStack>
          </VStack>
          <VStack flexDirection='row' alignItems='flex-start' ml='8px'>
            <HStack
              _light={{
                bg: type === 'outgoing' ? '#E4F0FF' : '#E0F8E8',
              }}
              _dark={{
                bg: type === 'outgoing' ? '#000643' : '#001109',
              }}
              px='12px'
              py='3px'
              rounded='2xl'
            >
              <Text
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
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </Pressable>
    </Fragment>
  );
};
