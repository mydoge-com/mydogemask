import { useCallback, useEffect, useRef, useState } from 'react';
import useSWRInfinite from 'swr/infinite';

import {
  getTransactions,
  getTransactionsKey,
} from '../../dataFetchers/getTransactions';
import { useCachedInscriptionTxs } from '../../hooks/useCachedInscriptionTxs';
import { mydoge } from '../../scripts/api';
import {
  NFT_PAGE_SIZE,
  TRANSACTION_PAGE_SIZE,
} from '../../scripts/helpers/constants';
import { logError } from '../../utils/error';

const QUERY_INTERVAL = 10000;
const VISIBLE_NFTS_PER_PAGE = 6;

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
    !(
      transactionsData[transactionsData.length - 1]?.length <
      TRANSACTION_PAGE_SIZE
    );

  const refreshTransactions = () => {
    setTransactionsPage(1);
  };

  const [NFTsLoading, setNFTsLoading] = useState(true);
  const [NFTs, setNFTs] = useState();
  const [NFTsTotal, setNFTsTotal] = useState();
  const [visibleNFTsPage, setVisibleNFTsPage] = useState(1);

  const [tokensLoading, setTokensLoading] = useState(true);
  const [tokens, setTokens] = useState();
  const [tokensTotal, setTokensTotal] = useState();

  const currentNFTPage = useRef(0);
  const currentTokensPage = useRef(0);

  const fetchNFTs = useCallback(
    async ({ currentNFTs = [], cursor } = {}) => {
      setNFTsLoading(true);
      try {
        const res = (await mydoge.get(`/inscriptions/${walletAddress}`)).data;

        setNFTs(
          [...currentNFTs, ...(res.list ?? [])].sort(
            (a, b) => b.height - a.height
          )
        );
        setNFTsTotal(res?.total);
        // Don't increment page on initial fetch, where cursor is undefined
        if (typeof cursor === 'number') {
          currentNFTPage.current = cursor;
        }
      } catch (e) {
        logError(e);
      } finally {
        setNFTsLoading(false);
      }
    },
    [walletAddress]
  );

  const fetchTokens = useCallback(
    async ({ cursor, currentTokens = [] } = {}) => {
      setTokensLoading(true);
      try {
        const drc20res = (await mydoge.get(`/drc20/${walletAddress}`)).data;
        const dunes20res = (await mydoge.get(`/dunes/${walletAddress}`)).data;

        setTokens(
          [
            ...currentTokens,
            ...(drc20res.balances ?? []),
            ...(dunes20res.balances ?? []),
          ].sort((a, b) => {
            if (a.ticker < b.ticker) {
              return -1;
            }
            if (a.ticker > b.ticker) {
              return 1;
            }
            return 0;
          })
        );
        setTokensTotal(drc20res.total + dunes20res.total);
        // Don't increment page on initial fetch, where cursor is undefined
        if (typeof cursor === 'number') {
          currentTokensPage.current = cursor;
        }
      } catch (e) {
        logError(e);
      } finally {
        setTokensLoading(false);
      }
    },
    [walletAddress]
  );

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
    if (!walletAddress) {
      return;
    }
    fetchNFTs();
    fetchTokens();
  }, [fetchNFTs, fetchTokens, walletAddress]);

  return {
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
