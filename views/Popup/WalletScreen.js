import { AntDesign, Ionicons } from '@native-base/icons';
// import fontsCSS from '@native-base/icons/FontsCSS/index.ts';
import axios from 'axios';
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
import { useCallback, useEffect, useRef, useState } from 'react';
import sb from 'satoshi-bitcoin';

import { MIN_CONFIRMATIONS } from '../../constants/Doge';
import { MINUTES_10, SECONDS_10 } from '../../constants/Time';
import { useInterval } from '../../hooks/useInterval';
// import { useStorage } from '../../hooks/useStorage';
import { callWithRetry } from '../../utils/api';
import { logError } from '../../utils/error';
import {
  asFiat,
  formatSatoshisAsDoge,
  is69,
  is420,
} from '../../utils/formatters';

// TODO: move this to a common layout file
// const style = document.createElement('style');
// style.type = 'text/css';
// style.appendChild(document.createTextNode(fontsCSS));
// document.head.appendChild(style);

const DogecoinLogo = 'assets/dogecoin-logo-300.png';
const SpaceBg = 'assets/milkyway-vector-bg-rounded.png';

const ActionButton = ({ icon, /* isPressed, */ title }) => {
  return (
    <VStack alignItems='center'>
      <Center
        width='40px'
        height='40px'
        rounded='12px'
        bg='rgb(45,47,49)'
        _light={{ bg: 'rgb(55,58,60)' }}
        shadow={1}
      >
        <Icon
          as={Ionicons}
          name={icon}
          color='rgb(243,203,83)'
          // _light={{ color: 'rgb(22, 26, 36)' }}
          size='sm'
          shadow={1}
        />
      </Center>
      <Text
        fontSize='13px'
        fontWeight='semibold'
        color='white'
        mt='2px'
        shadow={1}
      >
        {title}
      </Text>
    </VStack>
  );
};

function getTxSummary(tx, address) {
  // console.log('tx', tx);
  const ret = { type: '', amount: 0, fromAddr: '', toAddr: '' };
  // Assumes one to one sender / receiver per tx, TODO multiple
  tx.inputs.forEach((input) => {
    // console.log('input', input);
    input.addresses.forEach((addr) => {
      if (addr === address) {
        ret.type = 'outgoing';
        ret.fromAddr = address;
      } else if (ret.type === '') {
        ret.type = 'incoming';
        ret.fromAddr = addr;
      }
    });
  });
  ret.amount = 0;
  tx.outputs.forEach((output) => {
    // console.log('output', output);
    output.addresses?.forEach((addr) => {
      if (
        (ret.type === 'incoming' && addr === address) ||
        (ret.type === 'outgoing' && addr !== address)
      ) {
        ret.amount += output.value;
        ret.toAddr = ret.type === 'incoming' ? address : addr;
      }
    });
  });

  return ret;
}

export function WalletScreen() {
  const QUERY_INTERVAL = 30000;
  const [balance, setBalance] = useState(4200); // TODO: change back to null
  const [usdValue, setUSDValue] = useState(null);
  const [usdPrice, setUSDPrice] = useState(0.08479); // TODO: change back to 0
  const [txList, setTxList] = useState([]);
  const [hasLoadedTxs, setHasLoadedTxs] = useState(false);
  const [failedInitialTxLoad, setFailedInitialTxLoad] = useState(false);
  // note: we rely on these initial values for oldestTx and newestTx
  const [oldestTx, setOldestTx] = useState({
    block_height: 0, // important: must be 0, we check === 0 to know if we have one yet or not
    hash: '',
    time: Date.now(),
  });
  const [newestTx, setNewestTx] = useState({
    block_height: 0,
    hash: '',
    time: 0,
  });
  const [isLoadingMoreTxs, setIsLoadingMoreTxs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { addr } = {
    addr: 'DDPNi26RrGrwJoTtwaqntzCDEhYBNbuYLH',
  }; // TODO: read from storage

  const checkLock = useRef(false);

  const updateBalance = useCallback(async () => {
    try {
      //   if (__DEV__) console.log('Querying balance');
      const response = await callWithRetry(
        axios.get,
        `/wallet/${addr}/balance`,
        {
          cache: { maxAge: SECONDS_10 },
        }
      );
      setBalance(response.data.balance);
    } catch (e) {
      logError(e);
    }
  }, [addr]);

  // Update balance on load and at interval
  useInterval(updateBalance, QUERY_INTERVAL, true);

  const updateUSDValue = useCallback(async () => {
    try {
      const response = await callWithRetry(axios.get, `/dogeverse/stats`, {
        cache: { maxAge: SECONDS_10 },
      });
      setUSDPrice(response.data.stats.price);
    } catch (e) {
      logError(e);
    }
  }, []);

  // Update USD value on load and at interval
  useInterval(updateUSDValue, QUERY_INTERVAL, true);

  useEffect(() => {
    if (balance !== null) {
      setUSDValue(usdPrice * sb.toBitcoin(balance));
    }
  }, [usdPrice, balance]);

  // optionally takes oldest block height
  const queryTxs = useCallback(
    async (opts = {}) => {
      opts = opts || {}; // eslint-disable-line no-param-reassign
      const { clearCacheEntry = false, oldestBlockHeight } = opts;
      // console.log('getOlder:', oldestBlockHeight);
      return callWithRetry(
        axios.get,
        `/wallet/${addr}/txs?before=${oldestBlockHeight || ''}`,
        {
          cache: { maxAge: oldestBlockHeight ? MINUTES_10 : SECONDS_10 },
          clearCacheEntry,
        }
      );
    },
    [addr]
  );

  // Note: loadMoreTxs to do our initial load; this function expects to be used only for subsequent updates
  const checkForNewTxs = useCallback(
    async (opts) => {
      if (checkLock.current) {
        return;
      }
      checkLock.current = true;

      opts = opts || {}; // eslint-disable-line no-param-reassign
      const { clearCacheEntry = false, shouldUpdateBalance = false } = opts;
      // console.log('checkForNewTxs');
      if (isLoadingMoreTxs || isRefreshing) {
        // console.log('checkForNewCanceled-isLoading/isRefreshing');
        checkLock.current = false;
        return; // cancel if onScroll is running
      }
      // Get all txs from newest
      let txs;
      try {
        // console.log('checking for new txs');
        txs = await queryTxs({ clearCacheEntry });
      } catch (e) {
        txs = { data: {} };
        txs.data.txs = [
          {
            addresses: [
              'DDPNi26RrGrwJoTtwaqntzCDEhYBNbuYLH',
              'DETNfQPsSEBp6UGRapSz4eBtn9KrsBmkpE',
            ],
            block_hash:
              '806a370a2bf357924798fb1a1c3b56c39ca1bbaa1f20fd902459c9835042695a',
            block_height: 4470131,
            block_index: 44,
            confidence: 1,
            confirmations: 6310,
            confirmed: '2022-11-12T21:18:12Z',
            double_spend: false,
            fees: 339000,
            hash: '1ad3be9f993b29033ae03b329f4d5617b6bf46fe57a29a873d25d31aa75c63f1',
            inputs: [
              {
                addresses: ['DETNfQPsSEBp6UGRapSz4eBtn9KrsBmkpE'],
                age: 4462601,
                output_index: 1,
                output_value: 71583000,
                prev_hash:
                  '38245d570ab39077471b5836c60dc25622b7d204abdb2d8a7adbc083cb0b82df',
                script:
                  '483045022100e38a3a5f516582ea6f987d43d144bd951d9870acadcca13342f2ca5d3b38865702206d8c12c467adb3bf7c3c152b94475c331c50b5ed28d3eeecc2f98ece0aff1fc901210328b2b2ce16cf86b377708d465679f684a4acc43e3d17140a8c450bc03b42e9a2',
                script_type: 'pay-to-pubkey-hash',
                sequence: 4294967295,
              },
            ],
            outputs: [
              {
                addresses: ['DDPNi26RrGrwJoTtwaqntzCDEhYBNbuYLH'],
                script: '76a9145a74538baca360e7b7d170a14e3666c42bae4eb688ac',
                script_type: 'pay-to-pubkey-hash',
                value: 42069000,
              },
              {
                addresses: ['DETNfQPsSEBp6UGRapSz4eBtn9KrsBmkpE'],
                script: '76a914662e140deef7cff9991d672439101a7867850dfb88ac',
                script_type: 'pay-to-pubkey-hash',
                spent_by:
                  'bb5fadd56dcf48e6cf36c6f6635aa889645614be9ee6b4168f3db49ded1b61be',
                value: 29175000,
              },
            ],
            preference: 'high',
            received: '2022-11-12T21:15:54.988Z',
            relayed_by: '34.123.14.153',
            size: 226,
            total: 71244000,
            ver: 1,
            vin_sz: 1,
            vout_sz: 2,
          },
          {
            addresses: [
              'D6PAMECoQoN4oEAeqFfPUDTJAbj25s17Lr',
              'DDPNi26RrGrwJoTtwaqntzCDEhYBNbuYLH',
            ],
            block_hash:
              '11ccd909c1dac02c7b6b36a4c1505773221bab73ea25ab6286efdcbcc07bc168',
            block_height: 4466092,
            block_index: 27,
            confidence: 1,
            confirmations: 10349,
            confirmed: '2022-11-09T22:02:15Z',
            double_spend: false,
            fees: 108640508,
            hash: 'e07e03ff551ad821e8f3b7a1c404a64147823e66b57d896265185a9a24699ea8',
            inputs: [
              {
                addresses: ['D6PAMECoQoN4oEAeqFfPUDTJAbj25s17Lr'],
                age: 4465910,
                output_index: 1,
                output_value: 258306276219,
                prev_hash:
                  '117a973f1378e3c855138fb1f9d443201af98319ebb565c1733f006d76981ef6',
                script:
                  '47304402203f7c485eaf7dc32bfbafedb14357911ddadfb76bb7f6c8e9660dbbbb22fd1f03022020d946f50ae55ac56a105c0d1468b1e96038e859c9b375e0083752837b1897020121033712b425d9b480421d4d9a159886d3a487e028ce2951dfb306a89fa9836b1874',
                script_type: 'pay-to-pubkey-hash',
                sequence: 4294967295,
              },
              {
                addresses: ['D6PAMECoQoN4oEAeqFfPUDTJAbj25s17Lr'],
                age: 4464305,
                output_index: 0,
                output_value: 5000000000000,
                prev_hash:
                  '771ebdd69f7336ecc5dd39d9c18b665ab2b2c27219acdc93a86e32f393465528',
                script:
                  '4830450221008df82701c8b71a0e2c042c59f459343e644019ffc08100070ee1c3b1c197b686022042fa604d20d755c4f6ce9a77e03ffe0b6cb6f13776d055294f7d75a26e5723e90121033712b425d9b480421d4d9a159886d3a487e028ce2951dfb306a89fa9836b1874',
                script_type: 'pay-to-pubkey-hash',
                sequence: 4294967295,
              },
            ],
            outputs: [
              {
                addresses: ['DDPNi26RrGrwJoTtwaqntzCDEhYBNbuYLH'],
                script: '76a9145a74538baca360e7b7d170a14e3666c42bae4eb688ac',
                script_type: 'pay-to-pubkey-hash',
                spent_by:
                  '5059ef2363cbd5fc35c0be457f4eec98130b716038fc8f687e99ea5394f67d1d',
                value: 1803847385061,
              },
              {
                addresses: ['D6PAMECoQoN4oEAeqFfPUDTJAbj25s17Lr'],
                script: '76a9140da121291443510cb174a27ee6f8f3ae9972e44a88ac',
                script_type: 'pay-to-pubkey-hash',
                spent_by:
                  '235856c110c5c5d5d0ed0b2a54ab9c9768d61bf0f20fedd9f67e0ea584be106e',
                value: 3454350250650,
              },
            ],
            preference: 'high',
            received: '2022-11-09T22:01:54.59Z',
            relayed_by: '93.189.27.165:22556',
            size: 373,
            total: 5258197635711,
            ver: 1,
            vin_sz: 2,
            vout_sz: 2,
          },
        ];
        if (!txs) {
          logError(e);
          setIsRefreshing(false);
          if (!hasLoadedTxs) setFailedInitialTxLoad(true);
          checkLock.current = false;
          return;
        }
      }

      setTxList((oldTxList) => {
        const updatedTxList = [...oldTxList];
        const newTxs = [];
        let currOldestTx = { ...oldestTx };
        // Compare to see if we have any newer txs
        if (txs.data.txs[0] && txs.data.txs[0].hash !== newestTx.hash) {
          txs.data.txs.forEach((tx) => {
            const newTx = { ...tx };

            // if unconfirmed, make sure we don't already have it in our list
            const existingTxIdx = updatedTxList.findIndex(
              (tx2) => tx2.hash === newTx.hash
            );
            // set the time
            if (tx.confirmed) {
              newTx.time = moment(tx.confirmed).valueOf();
            } else if (tx.received) {
              newTx.time = moment(tx.received).valueOf();
            } else {
              newTx.time = moment().valueOf();
            }
            // push new tx to list, or update existing
            if (existingTxIdx === -1) {
              newTxs.push(newTx);
            } else {
              updatedTxList[existingTxIdx] = newTx;
            }

            // Track the oldest tx for next query, on first load (or first time we get txs)
            if (currOldestTx.block_height === 0) {
              if (
                newTx.block_height !== -1 &&
                (currOldestTx.block_height === 0 ||
                  newTx.block_height < currOldestTx.block_height)
              ) {
                currOldestTx = newTx;
              }
              // If there is a new oldest, set it
              if (currOldestTx.hash !== oldestTx.hash) {
                // console.log('setting oldest');
                // console.log(currOldestTx);
                setOldestTx(currOldestTx);
              }
            }
          });
          const nextNewTx = txs.data.txs.find((tx) => tx.block_height !== -1);
          if (nextNewTx?.confirmed) {
            nextNewTx.time = moment(nextNewTx.confirmed).valueOf();
            setNewestTx(nextNewTx);
          }
        }

        if (newTxs.length) {
          // Sort new txs
          newTxs.sort((a, b) => {
            if (a.pendingKey && a.toUser?.id === 'none') {
              if (b.pendingKey && b.toUser?.id !== 'none') {
                return 1; // confirmable tips above non-confirmable tips
              }
            }
            // otherwise by time
            if (a.time < b.time) return 1;
            if (a.time > b.time) return -1;
            return 0;
          });
        }

        // Add new txs to front of the list
        return [...newTxs, ...updatedTxList];
      });

      // If we found new txs, kick off a call to refresh the wallet balance
      // Toggleable because we already run balance update on the same interval, this is only for manual refresh situation
      if (shouldUpdateBalance) {
        updateBalance();
      }
      setIsRefreshing(false);
      setHasLoadedTxs(true);
      setFailedInitialTxLoad(false);
      checkLock.current = false;
    },
    [
      hasLoadedTxs,
      isLoadingMoreTxs,
      isRefreshing,
      newestTx.hash,
      oldestTx,
      queryTxs,
      updateBalance,
    ]
  );

  // Check for new txs on load and at interval
  useInterval(checkForNewTxs, QUERY_INTERVAL, true);

  // Loads older txs
  // eslint-disable-next-line
  const loadMoreTxs = useCallback(async () => {
    if (!isLoadingMoreTxs) {
      setIsLoadingMoreTxs(true);
      // Get both sent and received from oldest
      let txs;
      try {
        // console.log('querying', oldestTx.block_height);
        txs = await queryTxs({ oldestBlockHeight: oldestTx.block_height });
        // console.log(txs.request.fromCache);
      } catch (e) {
        logError(e);
        setIsLoadingMoreTxs(false);
        return;
      }
      const currTxList = [...txList];
      let currOldestTx = { ...oldestTx };
      console.log('got here');
      // Iterate all
      txs.data.txs.forEach((tx) => {
        const newTx = { ...tx };
        if (tx.confirmed) {
          newTx.time = moment(tx.confirmed).valueOf();
        } else if (tx.received) {
          newTx.time = moment(tx.received).valueOf();
        } else {
          newTx.time = moment();
        }
        // Append tx if it's not in our list
        if (!currTxList.find((elem) => elem.hash === newTx.hash)) {
          currTxList.push(newTx);
        }
        // Track the oldest tx for next query
        if (
          newTx.block_height !== -1 &&
          (currOldestTx.block_height === 0 ||
            newTx.block_height < currOldestTx.block_height)
        ) {
          currOldestTx = newTx;
        }
        // If there is a new oldest, set it
        if (currOldestTx.hash !== oldestTx.hash) {
          // console.log('setting oldest');
          // console.log(currOldestTx);
          setOldestTx(currOldestTx);
        }
      });
      // set the sorted list if it changed
      if (currTxList.length !== txList.length) {
        const sorted = currTxList.sort((a, b) => {
          if (a.time < b.time) return 1;
          if (a.time > b.time) return -1;
          return 0;
        });

        setTxList([...sorted]);
      }
      setIsLoadingMoreTxs(false);
    }
  }, [isLoadingMoreTxs, oldestTx, queryTxs, txList]);

  const transactions = [];

  txList.forEach((tx) => {
    const info = getTxSummary(tx, addr);
    const obj = {
      id: tx.hash,
      type: info.type,
      time: tx.time,
      amount: info.amount,
      fromAddr: info.fromAddr,
      toAddr: info.toAddr,
      confirmations: tx.confirmations,
      isPending: tx.confirmations >= MIN_CONFIRMATIONS,
    };
    transactions.push(obj);
  });

  const listEmpty = !transactions.length;

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
        <Box py='1px'>
          <HStack>
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
            <VStack flexDirection='row' alignItems='flex-start'>
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
        </Box>
      </Pressable>
    );
  }, []);

  // TODO: Move to settings
  //   const { updateStorage } = useStorage();

  //   const onLogOut = useCallback(() => {
  //     updateStorage({ isAuthenticated: false });
  //   }, [updateStorage]);

  const imageRatio = 1601 / 1158;
  const imageWidth = 360;
  const imageHeight = imageWidth / imageRatio;

  return (
    <Box flex={1}>
      <Image
        position='absolute'
        width={imageWidth}
        height={imageHeight}
        source={SpaceBg}
      />
      <Center>
        <Box mt={['30px', '40px']}>
          <Text
            color='white'
            fontSize={['4xl', '5xl', '7xl']}
            fontWeight='medium'
          >
            <Text fontSize={['4xl', '5xl', '7xl']} fontWeight='medium'>
              {typeof balance === 'number'
                ? `Ɖ${formatSatoshisAsDoge(balance, 3)}`
                : ' '}
            </Text>
          </Text>
        </Box>
        <Box mt='10px'>
          <Text
            bottom='20px'
            color='#b0e4ff'
            fontSize={['xl', 'xl', '2xl']}
            fontWeight='semibold'
          >
            {typeof usdValue === 'number' ? `$${asFiat(usdValue, 2)}` : ' '}
          </Text>
        </Box>
        <HStack space='24px' mt='30px'>
          <Pressable onPress={() => console.log('show receive screen')}>
            <ActionButton icon='arrow-down' title='Receive' isPressed={false} />
          </Pressable>
          <Pressable onPress={() => console.log('show send screen')}>
            <ActionButton icon='arrow-up' title='Send' isPressed={false} />
          </Pressable>
        </HStack>
      </Center>
      <Box mt='30px' flex={1}>
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
  );
}
