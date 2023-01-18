import { useCallback, useEffect, useRef, useState } from 'react';
import sb from 'satoshi-bitcoin';

import { useAppContext } from '../../hooks/useAppContext';
import { useInterval } from '../../hooks/useInterval';
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

  const [hasMore, setHasMore] = useState(true);

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

  return {
    balance,
    usdValue,
    loading,
    transactions,
    hasMore,
    fetchMore,
  };
};
