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
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return {
    balance,
    usdValue,
    loading,
    transactions,
  };
};
