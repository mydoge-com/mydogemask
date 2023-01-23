import {
  Avatar,
  Badge,
  Box,
  Divider,
  HStack,
  Pressable,
  Text,
  VStack,
} from 'native-base';
import { Fragment, useCallback, useState } from 'react';
import { FaLink } from 'react-icons/fa';
import { FiCheck } from 'react-icons/fi';
import sb from 'satoshi-bitcoin';

import { BigButton } from '../../components/Button';
import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { useInterval } from '../../hooks/useInterval';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';

const REFRESH_INTERVAL = 10000;

export function Connect() {
  const {
    connect: { tabId, origin },
    wallet,
    dispatch,
    selectedAddressIndex,
  } = useAppContext();

  const [addressBalances, setAddressBalances] = useState([]);
  // console.log('wallet.addresses', wallet.addresses);

  const getBalances = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_ADDRESS_BALANCE,
        data: { addresses: wallet.addresses },
      },
      (balances) => {
        if (balances) {
          setAddressBalances(balances);
          console.log({ balances });
        }
      }
    );
  }, [wallet.addresses]);

  useInterval(getBalances, REFRESH_INTERVAL, true);

  const onSelectAddress = useCallback(
    (index) => {
      dispatch({ type: 'SELECT_WALLET', payload: { index } });
    },
    [dispatch]
  );
  return (
    <Layout pt='32px' alignItems='center'>
      <Badge
        px='20px'
        py='4px'
        colorScheme='gray'
        rounded='full'
        _text={{ fontSize: '14px' }}
      >
        {origin}
      </Badge>
      <Box p='8px' bg='brandYellow.500' rounded='full' my='16px'>
        <FaLink />
      </Box>
      <Text fontSize='2xl' pb='6px'>
        Connect with <Text fontWeight='bold'>MyDogeMask</Text>
      </Text>
      <Text fontSize='sm' color='gray.600'>
        Select the address you want to use with this site
      </Text>
      <VStack
        flexShrink={1}
        overflowY='scroll'
        style={{
          scrollbarWidth: 'none',
        }}
        scrollbarWidth='none'
        pt='20px'
        pb='32px'
      >
        {wallet.addresses.map((address, i) => {
          return (
            <Fragment key={address}>
              <Pressable
                px='12px'
                onPress={() => onSelectAddress(i)}
                _hover={{
                  bg: 'rgba(0,0,0, 0.1)',
                }}
                py='8px'
              >
                <HStack alignItems='center'>
                  <Box w='30px'>
                    {i === selectedAddressIndex ? (
                      <FiCheck color='#54a937' size='26px' />
                    ) : null}
                  </Box>
                  <Avatar
                    source={{
                      uri: '/assets/default-avatar.png',
                    }}
                    size='28px'
                    mr='12px'
                  />
                  <VStack>
                    <HStack alignItems='center'>
                      <Text fontSize='sm' fontWeight='medium'>
                        Address {i + 1}
                      </Text>
                      <Text fontSize='sm' color='gray.500'>
                        {' '}
                        ({address.slice(0, 8)}...{address.slice(-4)})
                      </Text>
                    </HStack>
                    <Text color='gray.400' fontSize='xs'>
                      <Text fontWeight='bold'>Balance: </Text>Ð
                      {sb.toBitcoin(addressBalances[i])}
                    </Text>
                  </VStack>
                </HStack>
              </Pressable>
              <Divider />
            </Fragment>
          );
        })}
      </VStack>
      <BigButton>Connect</BigButton>
    </Layout>
  );
}
