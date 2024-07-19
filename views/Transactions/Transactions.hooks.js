import { useCallback, useEffect, useRef, useState } from 'react';
import sb from 'satoshi-bitcoin';
import useSWRInfinite from 'swr/infinite';

import {
  getTransactions,
  getTransactionsKey,
} from '../../dataFetchers/getTransactions';
import { useCachedInscriptionTxs } from '../../hooks/useCachedInscriptionTxs';
import { useInterval } from '../../hooks/useInterval';
import { doginals, doginalsV2 } from '../../scripts/api';
import { MESSAGE_TYPES, NFT_PAGE_SIZE } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { logError } from '../../utils/error';

const QUERY_INTERVAL = 10000;
const VISIBLE_NFTS_PER_PAGE = 8;

export const useTransactions = ({ wallet, selectedAddressIndex, navigate }) => {
  const walletAddress = wallet?.addresses?.[selectedAddressIndex];

  const {
    data: transactionsData,
    size: transactionsPage,
    setSize: setTransactionsPage,
    isLoading: isLoadingTransactions,
  } = useSWRInfinite(
    !walletAddress
      ? null
      : (pageIndex, prevData) =>
          getTransactionsKey(pageIndex, prevData, walletAddress),
    getTransactions,
    {
      initialSize: 1,
      revalidateAll: false,
      revalidateFirstPage: true,
      persistSize: false,
      parallel: false,
      refreshInterval: QUERY_INTERVAL,
    }
  );
  const transactions = transactionsData?.flat() ?? undefined;

  const cachedInscriptions = useCachedInscriptionTxs({ filterPending: false });

  const fetchMoreTransactions = () => setTransactionsPage(transactionsPage + 1);

  const isLoadingMoreTransactions =
    isLoadingTransactions ||
    (transactionsPage > 0 &&
      transactionsData &&
      typeof transactionsData[transactionsPage - 1] === 'undefined');

  const hasMoreTransactions =
    transactionsData &&
    !(transactionsData[transactionsData.length - 1]?.length < NFT_PAGE_SIZE);

  const refreshTransactions = () => {
    setTransactionsPage(1);
  };

  const [balance, setBalance] = useState(null);
  const [usdPrice, setUSDPrice] = useState(0);
  const [NFTsLoading, setNFTsLoading] = useState(true);
  const [NFTs, setNFTs] = useState();
  const [NFTsTotal, setNFTsTotal] = useState();
  const [visibleNFTsPage, setVisibleNFTsPage] = useState(1);

  const [tokensLoading, setTokensLoading] = useState(true);
  const [tokens, setTokens] = useState();
  const [tokensTotal, setTokensTotal] = useState();

  const currentNFTPage = useRef(0);
  const currentTokensPage = useRef(0);

  useEffect(() => {
    console.log('nfts', NFTs);
  }, [NFTs]);

  const fetchNFTs = useCallback(
    ({ currentNFTs = [], cursor } = {}) => {
      setNFTsLoading(true);
      doginalsV2
        .get(
          `/address/inscriptions?address=${walletAddress}&cursor=${
            cursor ?? 0
          }&size=${NFT_PAGE_SIZE}`
        )
        .json((res) => {
          setNFTs(
            [...currentNFTs, ...(res?.result?.list ?? [])].sort(
              (a, b) => a.inscriptionNumber - b.inscriptionNumber
            )
          );
          setNFTsTotal(res?.result?.total);
          // Don't increment page on initial fetch, where cursor is undefined
          if (typeof cursor === 'number') {
            currentNFTPage.current = cursor;
          }
        })
        .catch(logError)
        .finally(() => setNFTsLoading(false));
    },
    [walletAddress]
  );

  const fetchTokens = useCallback(
    ({ cursor, currentTokens = [] } = {}) => {
      setTokensLoading(true);
      doginals
        .get(
          `/brc20/tokens?address=${walletAddress}&cursor=${
            cursor || 0
          }&size=${NFT_PAGE_SIZE}`
        )
        .json((res) => {
          setTokens([...currentTokens, ...(res?.result?.list ?? [])]);
          setTokensTotal(res?.result?.total);
          // Don't increment page on initial fetch, where cursor is undefined
          if (typeof cursor === 'number') {
            currentTokensPage.current = cursor;
          }
        })
        .catch(logError)
        .finally(() => setTokensLoading(false));
    },
    [walletAddress]
  );

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

  const hasMoreNFTs = visibleNFTsPage * VISIBLE_NFTS_PER_PAGE < NFTsTotal;
  const hasMoreTokens = tokens?.length < tokensTotal;

  const fetchMoreNFTs = useCallback(() => {
    if (hasMoreNFTs) {
      if (visibleNFTsPage * VISIBLE_NFTS_PER_PAGE < NFTs?.length) {
        setVisibleNFTsPage(visibleNFTsPage + 1);
        return;
      }
      fetchNFTs({
        cursor: currentNFTPage.current + NFT_PAGE_SIZE,
        currentNFTs: NFTs,
      });
    }
  }, [hasMoreNFTs, visibleNFTsPage, fetchNFTs, NFTs]);

  const fetchMoreTokens = useCallback(() => {
    if (hasMoreTokens) {
      fetchTokens({
        cursor: currentTokensPage.current + NFT_PAGE_SIZE,
        currentTokens: tokens,
      });
    }
  }, [fetchTokens, hasMoreTokens, tokens]);

  useEffect(() => {
    if (!wallet || typeof selectedAddressIndex !== 'number') {
      return;
    }
    getAddressBalance();
    getDogecoinPrice();
    fetchTokens();
    fetchNFTs();
  }, [
    fetchNFTs,
    fetchTokens,
    getAddressBalance,
    getDogecoinPrice,
    selectedAddressIndex,
    wallet,
    walletAddress,
  ]);

  useInterval(
    () => {
      if (!walletAddress) {
        return;
      }
      getAddressBalance();
      getDogecoinPrice();
    },
    QUERY_INTERVAL,
    false
  );

  return {
    balance,
    usdValue,
    transactions,
    isLoadingTransactions,
    isLoadingMoreTransactions,
    hasMoreTransactions,
    fetchMoreTransactions,
    refreshTransactions,
    NFTs: NFTs?.slice(0, VISIBLE_NFTS_PER_PAGE * visibleNFTsPage),
    hasMoreNFTs,
    fetchMoreNFTs,
    NFTsLoading,
    tokens,
    tokensLoading,
    hasMoreTokens,
    fetchMoreTokens,
    wallet,
    selectedAddressIndex,
    navigate,
    cachedInscriptions,
  };
};
