import { useCallback, useEffect, useRef, useState } from 'react';
import sb from 'satoshi-bitcoin';

import { useAppContext } from '../../hooks/useAppContext';
import { useInterval } from '../../hooks/useInterval';
import { doginals } from '../../scripts/api';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { logError } from '../../utils/error';
import { formatTransaction } from '../../utils/transactions';

const QUERY_INTERVAL = 30000;

export const useTransactions = () => {
  const { wallet, selectedAddressIndex } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];

  const [balance, setBalance] = useState(null);
  const [usdPrice, setUSDPrice] = useState(0);
  const [transactions, setTransactions] = useState();
  const [loading, setLoading] = useState(true);
  const [NFTs, setNFTs] = useState();
  const [NFTsTotal, setNFTsTotal] = useState();

  const [hasMore, setHasMore] = useState(true);

  const currentPage = useRef(0);

  useEffect(() => {
    doginals
      .get(`/address/inscriptions?address=${walletAddress}&cursor=0&size=25`)
      .json((res) => {
        console.log('NFTs', res);
        setNFTs(res?.result?.list);
        setNFTsTotal(res?.result?.total);
      })
      .catch(logError);
  }, [walletAddress]);

  const usdValue = balance ? sb.toBitcoin(balance) * usdPrice : 0;
  const getAddressBalance = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_ADDRESS_BALANCE,
        data: { address: walletAddress },
      },
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
    sendMessage({ message: MESSAGE_TYPES.GET_DOGECOIN_PRICE }, ({ usd }) => {
      if (usd) {
        setUSDPrice(usd);
      } else {
        logError(new Error('Failed to get Dogecoin price'));
      }
    });
  }, []);

  const getRecentTransactions = useCallback(() => {
    if (currentPage.current > 0 && !loading) {
      sendMessage(
        {
          message: MESSAGE_TYPES.GET_TRANSACTIONS,
          data: {
            address: walletAddress,
            page: 0,
          },
        },
        ({ transactions: transactions_ }) => {
          if (transactions_) {
            let formattedTransactions = [];
            transactions_.forEach((transaction) => {
              formattedTransactions.push(
                formatTransaction({ transaction, walletAddress })
              );
            });
            // Find new transactions
            formattedTransactions = formattedTransactions.filter((tx) => {
              const idx = (transactions || []).findIndex((t) => t.id === tx.id);
              if (idx === -1) {
                return true;
              } else if (
                tx.confirmations > 0 &&
                transactions[idx].confirmations === 0
              ) {
                // Replace the updated tx
                setTransactions((state = []) => {
                  const nextState = [...state];
                  nextState[idx] = tx;
                  return nextState;
                });
              }
              return false;
            });
            // Append and sort
            setTransactions((state = []) =>
              [...state, ...formattedTransactions].sort(
                (a, b) => b.blockTime - a.blockTime
              )
            );
          } else {
            logError(new Error('Failed to get recent transactions'));
          }
        }
      );
    }
  }, [loading, transactions, walletAddress]);

  const getTransactions = useCallback(() => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_TRANSACTIONS,
        data: {
          address: walletAddress,
          page: currentPage.current,
        },
      },
      ({ page, totalPages, transactions: transactions_ }) => {
        if (transactions_) {
          const formattedTransactions = [];
          transactions_.forEach((transaction) => {
            formattedTransactions.push(
              formatTransaction({ transaction, walletAddress })
            );
          });
          setTransactions((state = []) =>
            [...state, ...formattedTransactions].filter(
              (tx, i, self) => self.findIndex((t) => t.id === tx.id) === i
            )
          );
          currentPage.current = page + 1;
          setHasMore(page < totalPages);
          setLoading(false);
        } else {
          logError(new Error('Failed to get transaction history'));
        }
      }
    );
  }, [walletAddress]);

  const fetchMore = useCallback(() => {
    if (hasMore) {
      getTransactions();
    }
  }, [getTransactions, hasMore]);

  const currentAddress = useRef(walletAddress);

  useEffect(() => {
    if (currentAddress.current !== walletAddress) {
      currentAddress.current = walletAddress;
      currentPage.current = 0;
      setTransactions();
    }
    getTransactions();
    getAddressBalance();
  }, [getAddressBalance, getTransactions, walletAddress]);

  useInterval(
    () => {
      getAddressBalance();
      getDogecoinPrice();
      getRecentTransactions();
    },
    QUERY_INTERVAL,
    true
  );

  return {
    balance,
    usdValue,
    loading,
    transactions,
    hasMore,
    fetchMore,
    NFTs,
    hasMoreNFTs: NFTs?.length < NFTsTotal,
  };
};
