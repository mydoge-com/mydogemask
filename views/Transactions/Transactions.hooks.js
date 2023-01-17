// import axios from 'axios';
// import moment from 'moment';
import { useCallback, useEffect, useRef, useState } from 'react';
import sb from 'satoshi-bitcoin';

// import { MIN_CONFIRMATIONS } from '../../constants/Doge';
// import { MINUTES_10, SECONDS_10 } from '../../constants/Time';
import { useAppContext } from '../../hooks/useAppContext';
import { useInterval } from '../../hooks/useInterval';
import { sendMessage } from '../../scripts/helpers/message';
// import { callWithRetry } from '../../utils/api';
import { logError } from '../../utils/error';
import { formatTransaction } from '../../utils/transactions';
// import { getTxSummary } from '../../utils/transactions';

const QUERY_INTERVAL = 30000;

export const useTransactions = () => {
  const { wallet, selectedAddressIndex } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];

  const [balance, setBalance] = useState(null);
  const [usdPrice, setUSDPrice] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // const [hasLoadedTxs, setHasLoadedTxs] = useState(false);
  // const [failedInitialTxLoad, setFailedInitialTxLoad] = useState(false);

  const currentPage = useRef(0);

  const usdValue = balance ? sb.toBitcoin(balance) * usdPrice : 0;
  const getAddressBalance = useCallback(() => {
    sendMessage(
      { message: 'getAddressBalance', data: { address: walletAddress } },
      (walletBalance) => {
        if (walletBalance) {
          setBalance(Number(walletBalance));
        } else {
          logError(new Error('Failed to get wallet balance'));
        }
      }
    );
  }, [walletAddress]);

  const getDogecoinPrice = useCallback(() => {
    sendMessage({ message: 'getDogecoinPrice' }, ({ usd }) => {
      if (usd) {
        setUSDPrice(usd);
      } else {
        logError(new Error('Failed to get dogecoin price'));
      }
    });
  }, []);

  const getTransactions = useCallback(() => {
    setLoading(true);
    sendMessage(
      {
        message: 'getTransactions',
        data: { address: walletAddress, page: currentPage.current },
      },
      (txHistory) => {
        if (txHistory) {
          console.log('txHistory', txHistory);
          const formattedTransactions = [];
          txHistory.transactions.forEach((transaction) => {
            formattedTransactions.push(
              formatTransaction({ transaction, walletAddress })
            );
          });
          setTransactions((state) => [...state, ...formattedTransactions]);
          setLoading(false);
        } else {
          logError(new Error('Failed to get transaction history'));
        }
      }
    );
  }, [walletAddress]);

  useInterval(
    () => {
      getAddressBalance();
      getDogecoinPrice();
    },
    QUERY_INTERVAL,
    true
  );

  useEffect(() => {
    getTransactions();
    getAddressBalance();
  }, [getAddressBalance, getTransactions, walletAddress]);

  // // note: we rely on these initial values for oldestTx and newestTx
  // const [oldestTx, setOldestTx] = useState({
  //   block_height: 0, // important: must be 0, we check === 0 to know if we have one yet or not
  //   hash: '',
  //   time: Date.now(),
  // });
  // const [newestTx, setNewestTx] = useState({
  //   block_height: 0,
  //   hash: '',
  //   time: 0,
  // });
  // const [isLoadingMoreTxs, setIsLoadingMoreTxs] = useState(false);
  // const [isRefreshing, setIsRefreshing] = useState(false);
  // const { addr } = {
  //   addr: 'DDPNi26RrGrwJoTtwaqntzCDEhYBNbuYLH',
  // }; // TODO: read from storage

  // const checkLock = useRef(false);

  // optionally takes oldest block height
  // const queryTxs = useCallback(
  //   async (opts = {}) => {
  //     opts = opts || {}; // eslint-disable-line no-param-reassign
  //     const { clearCacheEntry = false, oldestBlockHeight } = opts;
  //     // console.log('getOlder:', oldestBlockHeight);
  //     return callWithRetry(
  //       axios.get,
  //       `/wallet/${addr}/txs?before=${oldestBlockHeight || ''}`,
  //       {
  //         cache: { maxAge: oldestBlockHeight ? MINUTES_10 : SECONDS_10 },
  //         clearCacheEntry,
  //       }
  //     );
  //   },
  //   [addr]
  // );

  // Note: loadMoreTxs to do our initial load; this function expects to be used only for subsequent updates
  // const checkForNewTxs = useCallback(
  //   async (opts) => {
  //     if (checkLock.current) {
  //       return;
  //     }
  //     checkLock.current = true;

  //     opts = opts || {}; // eslint-disable-line no-param-reassign
  //     const { clearCacheEntry = false, shouldUpdateBalance = false } = opts;
  //     // console.log('checkForNewTxs');
  //     if (isLoadingMoreTxs || isRefreshing) {
  //       // console.log('checkForNewCanceled-isLoading/isRefreshing');
  //       checkLock.current = false;
  //       return; // cancel if onScroll is running
  //     }
  //     // Get all txs from newest
  //     let txs;
  //     try {
  //       // console.log('checking for new txs');
  //       txs = await queryTxs({ clearCacheEntry });
  //     } catch (e) {
  //       txs = { data: {} };
  //       txs.data.txs = [
  //         {
  //           addresses: [
  //             'DDPNi26RrGrwJoTtwaqntzCDEhYBNbuYLH',
  //             'DETNfQPsSEBp6UGRapSz4eBtn9KrsBmkpE',
  //           ],
  //           block_hash:
  //             '806a370a2bf357924798fb1a1c3b56c39ca1bbaa1f20fd902459c9835042695a',
  //           block_height: 4470131,
  //           block_index: 44,
  //           confidence: 1,
  //           confirmations: 6310,
  //           confirmed: '2022-11-12T21:18:12Z',
  //           double_spend: false,
  //           fees: 339000,
  //           hash: '1ad3be9f993b29033ae03b329f4d5617b6bf46fe57a29a873d25d31aa75c63f1',
  //           inputs: [
  //             {
  //               addresses: ['DETNfQPsSEBp6UGRapSz4eBtn9KrsBmkpE'],
  //               age: 4462601,
  //               output_index: 1,
  //               output_value: 71583000,
  //               prev_hash:
  //                 '38245d570ab39077471b5836c60dc25622b7d204abdb2d8a7adbc083cb0b82df',
  //               script:
  //                 '483045022100e38a3a5f516582ea6f987d43d144bd951d9870acadcca13342f2ca5d3b38865702206d8c12c467adb3bf7c3c152b94475c331c50b5ed28d3eeecc2f98ece0aff1fc901210328b2b2ce16cf86b377708d465679f684a4acc43e3d17140a8c450bc03b42e9a2',
  //               script_type: 'pay-to-pubkey-hash',
  //               sequence: 4294967295,
  //             },
  //           ],
  //           outputs: [
  //             {
  //               addresses: ['DDPNi26RrGrwJoTtwaqntzCDEhYBNbuYLH'],
  //               script: '76a9145a74538baca360e7b7d170a14e3666c42bae4eb688ac',
  //               script_type: 'pay-to-pubkey-hash',
  //               value: 42069000,
  //             },
  //             {
  //               addresses: ['DETNfQPsSEBp6UGRapSz4eBtn9KrsBmkpE'],
  //               script: '76a914662e140deef7cff9991d672439101a7867850dfb88ac',
  //               script_type: 'pay-to-pubkey-hash',
  //               spent_by:
  //                 'bb5fadd56dcf48e6cf36c6f6635aa889645614be9ee6b4168f3db49ded1b61be',
  //               value: 29175000,
  //             },
  //           ],
  //           preference: 'high',
  //           received: '2022-11-12T21:15:54.988Z',
  //           relayed_by: '34.123.14.153',
  //           size: 226,
  //           total: 71244000,
  //           ver: 1,
  //           vin_sz: 1,
  //           vout_sz: 2,
  //         },
  //         {
  //           addresses: [
  //             'D6PAMECoQoN4oEAeqFfPUDTJAbj25s17Lr',
  //             'DDPNi26RrGrwJoTtwaqntzCDEhYBNbuYLH',
  //           ],
  //           block_hash:
  //             '11ccd909c1dac02c7b6b36a4c1505773221bab73ea25ab6286efdcbcc07bc168',
  //           block_height: 4466092,
  //           block_index: 27,
  //           confidence: 1,
  //           confirmations: 10349,
  //           confirmed: '2022-11-09T22:02:15Z',
  //           double_spend: false,
  //           fees: 108640508,
  //           hash: 'e07e03ff551ad821e8f3b7a1c404a64147823e66b57d896265185a9a24699ea8',
  //           inputs: [
  //             {
  //               addresses: ['D6PAMECoQoN4oEAeqFfPUDTJAbj25s17Lr'],
  //               age: 4465910,
  //               output_index: 1,
  //               output_value: 258306276219,
  //               prev_hash:
  //                 '117a973f1378e3c855138fb1f9d443201af98319ebb565c1733f006d76981ef6',
  //               script:
  //                 '47304402203f7c485eaf7dc32bfbafedb14357911ddadfb76bb7f6c8e9660dbbbb22fd1f03022020d946f50ae55ac56a105c0d1468b1e96038e859c9b375e0083752837b1897020121033712b425d9b480421d4d9a159886d3a487e028ce2951dfb306a89fa9836b1874',
  //               script_type: 'pay-to-pubkey-hash',
  //               sequence: 4294967295,
  //             },
  //             {
  //               addresses: ['D6PAMECoQoN4oEAeqFfPUDTJAbj25s17Lr'],
  //               age: 4464305,
  //               output_index: 0,
  //               output_value: 5000000000000,
  //               prev_hash:
  //                 '771ebdd69f7336ecc5dd39d9c18b665ab2b2c27219acdc93a86e32f393465528',
  //               script:
  //                 '4830450221008df82701c8b71a0e2c042c59f459343e644019ffc08100070ee1c3b1c197b686022042fa604d20d755c4f6ce9a77e03ffe0b6cb6f13776d055294f7d75a26e5723e90121033712b425d9b480421d4d9a159886d3a487e028ce2951dfb306a89fa9836b1874',
  //               script_type: 'pay-to-pubkey-hash',
  //               sequence: 4294967295,
  //             },
  //           ],
  //           outputs: [
  //             {
  //               addresses: ['DDPNi26RrGrwJoTtwaqntzCDEhYBNbuYLH'],
  //               script: '76a9145a74538baca360e7b7d170a14e3666c42bae4eb688ac',
  //               script_type: 'pay-to-pubkey-hash',
  //               spent_by:
  //                 '5059ef2363cbd5fc35c0be457f4eec98130b716038fc8f687e99ea5394f67d1d',
  //               value: 1803847385061,
  //             },
  //             {
  //               addresses: ['D6PAMECoQoN4oEAeqFfPUDTJAbj25s17Lr'],
  //               script: '76a9140da121291443510cb174a27ee6f8f3ae9972e44a88ac',
  //               script_type: 'pay-to-pubkey-hash',
  //               spent_by:
  //                 '235856c110c5c5d5d0ed0b2a54ab9c9768d61bf0f20fedd9f67e0ea584be106e',
  //               value: 3454350250650,
  //             },
  //           ],
  //           preference: 'high',
  //           received: '2022-11-09T22:01:54.59Z',
  //           relayed_by: '93.189.27.165:22556',
  //           size: 373,
  //           total: 5258197635711,
  //           ver: 1,
  //           vin_sz: 2,
  //           vout_sz: 2,
  //         },
  //       ];
  //       if (!txs) {
  //         logError(e);
  //         setIsRefreshing(false);
  //         if (!hasLoadedTxs) setFailedInitialTxLoad(true);
  //         checkLock.current = false;
  //         return;
  //       }
  //     }

  //     setTxList((oldTxList) => {
  //       const updatedTxList = [...oldTxList];
  //       const newTxs = [];
  //       let currOldestTx = { ...oldestTx };
  //       // Compare to see if we have any newer txs
  //       if (txs.data.txs[0] && txs.data.txs[0].hash !== newestTx.hash) {
  //         txs.data.txs.forEach((tx) => {
  //           const newTx = { ...tx };

  //           // if unconfirmed, make sure we don't already have it in our list
  //           const existingTxIdx = updatedTxList.findIndex(
  //             (tx2) => tx2.hash === newTx.hash
  //           );
  //           // set the time
  //           if (tx.confirmed) {
  //             newTx.time = moment(tx.confirmed).valueOf();
  //           } else if (tx.received) {
  //             newTx.time = moment(tx.received).valueOf();
  //           } else {
  //             newTx.time = moment().valueOf();
  //           }
  //           // push new tx to list, or update existing
  //           if (existingTxIdx === -1) {
  //             newTxs.push(newTx);
  //           } else {
  //             updatedTxList[existingTxIdx] = newTx;
  //           }

  //           // Track the oldest tx for next query, on first load (or first time we get txs)
  //           if (currOldestTx.block_height === 0) {
  //             if (
  //               newTx.block_height !== -1 &&
  //               (currOldestTx.block_height === 0 ||
  //                 newTx.block_height < currOldestTx.block_height)
  //             ) {
  //               currOldestTx = newTx;
  //             }
  //             // If there is a new oldest, set it
  //             if (currOldestTx.hash !== oldestTx.hash) {
  //               // console.log('setting oldest');
  //               // console.log(currOldestTx);
  //               setOldestTx(currOldestTx);
  //             }
  //           }
  //         });
  //         const nextNewTx = txs.data.txs.find((tx) => tx.block_height !== -1);
  //         if (nextNewTx?.confirmed) {
  //           nextNewTx.time = moment(nextNewTx.confirmed).valueOf();
  //           setNewestTx(nextNewTx);
  //         }
  //       }

  //       if (newTxs.length) {
  //         // Sort new txs
  //         newTxs.sort((a, b) => {
  //           if (a.pendingKey && a.toUser?.id === 'none') {
  //             if (b.pendingKey && b.toUser?.id !== 'none') {
  //               return 1; // confirmable tips above non-confirmable tips
  //             }
  //           }
  //           // otherwise by time
  //           if (a.time < b.time) return 1;
  //           if (a.time > b.time) return -1;
  //           return 0;
  //         });
  //       }

  //       // Add new txs to front of the list
  //       return [...newTxs, ...updatedTxList];
  //     });

  //     // If we found new txs, kick off a call to refresh the wallet balance
  //     // Toggleable because we already run balance update on the same interval, this is only for manual refresh situation
  //     // if (shouldUpdateBalance) {
  //     //   updateBalance();
  //     // }
  //     setIsRefreshing(false);
  //     setHasLoadedTxs(true);
  //     setFailedInitialTxLoad(false);
  //     checkLock.current = false;
  //   },
  //   [
  //     hasLoadedTxs,
  //     isLoadingMoreTxs,
  //     isRefreshing,
  //     newestTx.hash,
  //     oldestTx,
  //     queryTxs,
  //   ]
  // );

  // Check for new txs on load and at interval
  // useInterval(checkForNewTxs, QUERY_INTERVAL, true);

  // Loads older txs
  // eslint-disable-next-line
  // const loadMoreTxs = useCallback(async () => {
  //   if (!isLoadingMoreTxs) {
  //     setIsLoadingMoreTxs(true);
  //     // Get both sent and received from oldest
  //     let txs;
  //     try {
  //       // console.log('querying', oldestTx.block_height);
  //       txs = await queryTxs({ oldestBlockHeight: oldestTx.block_height });
  //       // console.log(txs.request.fromCache);
  //     } catch (e) {
  //       logError(e);
  //       setIsLoadingMoreTxs(false);
  //       return;
  //     }
  //     const currTxList = [...txList];
  //     let currOldestTx = { ...oldestTx };
  //     console.log('got here');
  //     // Iterate all
  //     txs.data.txs.forEach((tx) => {
  //       const newTx = { ...tx };
  //       if (tx.confirmed) {
  //         newTx.time = moment(tx.confirmed).valueOf();
  //       } else if (tx.received) {
  //         newTx.time = moment(tx.received).valueOf();
  //       } else {
  //         newTx.time = moment();
  //       }
  //       // Append tx if it's not in our list
  //       if (!currTxList.find((elem) => elem.hash === newTx.hash)) {
  //         currTxList.push(newTx);
  //       }
  //       // Track the oldest tx for next query
  //       if (
  //         newTx.block_height !== -1 &&
  //         (currOldestTx.block_height === 0 ||
  //           newTx.block_height < currOldestTx.block_height)
  //       ) {
  //         currOldestTx = newTx;
  //       }
  //       // If there is a new oldest, set it
  //       if (currOldestTx.hash !== oldestTx.hash) {
  //         // console.log('setting oldest');
  //         // console.log(currOldestTx);
  //         setOldestTx(currOldestTx);
  //       }
  //     });
  //     // set the sorted list if it changed
  //     if (currTxList.length !== txList.length) {
  //       const sorted = currTxList.sort((a, b) => {
  //         if (a.time < b.time) return 1;
  //         if (a.time > b.time) return -1;
  //         return 0;
  //       });

  //       setTxList([...sorted]);
  //     }
  //     setIsLoadingMoreTxs(false);
  //   }
  // }, [isLoadingMoreTxs, oldestTx, queryTxs, txList]);

  // const transactions = [];

  // txList.forEach((tx) => {
  //   const info = getTxSummary(tx, addr);
  //   const obj = {
  //     id: tx.hash,
  //     type: info.type,
  //     time: tx.time,
  //     amount: info.amount,
  //     fromAddr: info.fromAddr,
  //     toAddr: info.toAddr,
  //     confirmations: tx.confirmations,
  //     isPending: tx.confirmations >= MIN_CONFIRMATIONS,
  //   };
  //   transactions.push(obj);
  // });

  // const listEmpty = !transactions.length;

  return {
    balance,
    usdValue,
    loading,
    transactions,
    // listEmpty,
    // txList,
    // failedInitialTxLoad,
    // updateBalance,
    // checkForNewTxs,
  };
};
