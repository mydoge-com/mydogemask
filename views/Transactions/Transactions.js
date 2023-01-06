import { AntDesign } from '@native-base/icons';
import moment from 'moment';
import {
  Box,
  Button,
  Center,
  Heading,
  HStack,
  Icon,
  Image,
  Pressable,
  Spinner,
  Text,
  VStack,
} from 'native-base';
import { useCallback } from 'react';
import { IoArrowDown, IoArrowUp } from 'react-icons/io5';

import { WalletDetailModal } from '../../components/Header/WalletDetailModal';
import { Layout } from '../../components/Layout';
import {
  asFiat,
  formatSatoshisAsDoge,
  is69,
  is420,
} from '../../utils/formatters';
import { ActionButton } from './components/ActionButton';
import { useTransactions } from './Transactions.hooks';

const DogecoinLogo = 'assets/dogecoin-logo-300.png';
const SpaceBg = 'assets/milkyway-vector-bg-rounded.png';

export function Transactions() {
  const {
    balance,
    usdValue,
    transactions,
    hasLoadedTxs,
    listEmpty,
    failedInitialTxLoad,
    updateBalance,
    checkForNewTxs,
  } = useTransactions();

  const renderTransaction = useCallback((tx) => {
    let address = tx.fromAddr;
    if (tx.type === 'outgoing') address = tx.toAddr;

    return (
      <Pressable
        key={tx.id}
        onPress={() => {
          console.log('navigate to tx screen');
        }}
      >
        <HStack p='2px'>
          <VStack mr='12px'>
            <Image src={DogecoinLogo} height='40px' width='40px' />
          </VStack>
          <VStack flex={1}>
            <Text fontSize='xs' fontWeight='medium'>
              {address}
            </Text>

            <Text
              fontSize='xs'
              fontWeight='semibold'
              _light={{ color: 'gray.400' }}
              _dark={{ color: 'gray.500' }}
            >
              {tx.time ? moment(tx.time).fromNow() : null}
            </Text>
          </VStack>
          <VStack flexDirection='row' alignItems='flex-start' ml='8px'>
            <HStack
              _light={{
                bg: tx.type === 'outgoing' ? '#E4F0FF' : '#E0F8E8',
              }}
              _dark={{
                bg: tx.type === 'outgoing' ? '#000643' : '#001109',
              }}
              px='14px'
              py='4px'
              rounded='2xl'
            >
              <Text
                fontSize='sm'
                fontWeight='bold'
                _light={{
                  color: is420(formatSatoshisAsDoge(tx.amount, 3))
                    ? 'green.600'
                    : tx.type === 'outgoing'
                    ? 'blue.500'
                    : 'green.500',
                }}
                _dark={{
                  color: is420(formatSatoshisAsDoge(tx.amount, 3))
                    ? 'green.300'
                    : tx.type === 'outgoing'
                    ? 'blue.400'
                    : 'green.500',
                }}
              >
                {tx.type === 'outgoing' ? '-' : '+'}{' '}
                {formatSatoshisAsDoge(tx.amount, 3)}
              </Text>
              <Text fontSize='sm' fontWeight='bold'>
                {is69(formatSatoshisAsDoge(tx.amount, 3)) && ' 😏'}
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </Pressable>
    );
  }, []);

  const imageRatio = 1601 / 1158;
  const imageWidth = 360;
  const imageHeight = imageWidth / imageRatio;

  return (
    <Layout withHeader p={0}>
      <Box>
        <Image
          width={imageWidth}
          height={imageHeight}
          source={SpaceBg}
          position='absolute'
        />
        <Center mt='52px'>
          <Text
            fontSize='6xl'
            fontWeight='medium'
            color='white'
            lineHeight='xs'
          >
            {typeof balance === 'number'
              ? `Ɖ${formatSatoshisAsDoge(balance, 3)}`
              : ' '}
          </Text>
          <Text color='#b0e4ff' fontSize='xl' fontWeight='semibold' pt={0}>
            {typeof usdValue === 'number' ? `$${asFiat(usdValue, 2)}` : ' '}
          </Text>
          <HStack space='24px' pt='20px'>
            <Pressable onPress={() => console.log('show receive screen')}>
              <ActionButton
                Icon={<IoArrowDown />}
                title='Receive'
                isPressed={false}
              />
            </Pressable>
            <Pressable onPress={() => console.log('show send screen')}>
              <ActionButton
                Icon={<IoArrowUp />}
                title='Send'
                isPressed={false}
              />
            </Pressable>
          </HStack>
        </Center>
        <Box flex={1}>
          {hasLoadedTxs ? (
            listEmpty ? (
              <Center flex={0.9}>
                <Center flex={1} key='ListEmptyComponent-C2'>
                  <Icon
                    as={AntDesign}
                    name='star'
                    color='yellow.400'
                    size={{ base: 'lg', sm: 'xl' }}
                    mb={{ base: '14px', sm: '20px' }}
                    key='ListEmptyComponent-Icon'
                  />
                  <Heading
                    key='ListEmptyComponent-H2'
                    size='md'
                    fontSize={{ base: '17px', sm: '20px' }}
                    textAlign='center'
                    lineHeight='30px'
                    mb={{ base: '18px', sm: '32px' }}
                  >
                    To get started, send DOGE to your wallet
                  </Heading>
                  <HStack width='86%' key='ListEmptyComponent-HS2'>
                    <Button
                      key='ListEmptyComponent-BB4'
                      onPress={() => {
                        console.log('show receive screen');
                      }}
                    >
                      Deposit DOGE
                    </Button>
                  </HStack>
                </Center>
              </Center>
            ) : (
              <>
                <Center alignItems='center' justifyContent='center' mt='50px'>
                  <Heading size='md' pt='6px' mb='20px'>
                    Transactions
                  </Heading>
                </Center>
                <Box px='10px'>
                  <VStack space='10px'>
                    {transactions.map(renderTransaction)}
                  </VStack>
                </Box>
              </>
            )
          ) : failedInitialTxLoad ? (
            <Center flex={1} pb='50px'>
              <Heading size='md'>Error loading transactions...</Heading>
              <HStack>
                <Button
                  ml='auto'
                  mr='auto'
                  onPress={() => {
                    updateBalance();
                    checkForNewTxs();
                  }}
                >
                  Try Again
                </Button>
              </HStack>
            </Center>
          ) : (
            <Center flex={1}>
              <Spinner color='amber.400' />
            </Center>
          )}
        </Box>
      </Box>
      <WalletDetailModal />
    </Layout>
  );
}
