import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../../hooks/useAppContext';
import { amountToBn } from '../../../scripts/helpers/cardinals';
import { cardinals, nownodes } from '../../../scripts/api';
import { VStack, Input, useToast, Spinner, Center, Text, HStack, Pressable, Box } from 'native-base';
import { logError } from '../../../utils/error';
import { BalanceCard } from './BalanceCard';
import { FiSearch } from "react-icons/fi";

export const CardinalsTab = () => {
  const { wallet, selectedAddressIndex, navigate } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];
  const toast = useToast();
  const [tokens, setTokens] = useState([]);
  const [currentToken, setCurrentToken] = useState([]);
  const [total, setTotal] = useState(-1);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 50 });

  const showErrorToast = (message) => {
    toast.show({
      title: message || 'Unknown error'
    });
  };

  const fetchData = useCallback(async () => {
    try {
      const [allSummary, dogeUsd, popularTokenList, myDrc20s] = await Promise.all([
        getAllSummary(),
        getDogePrice(),
        getPopularTokenList(walletAddress),
        getAddressTokenList(walletAddress, 0, 1000)
      ]);

      if (myDrc20s?.list?.length === 1000) {
        const nextPageDrc20s = await getAddressTokenList(walletAddress, 1000, 1000);
        myDrc20s.list = myDrc20s.list.concat(nextPageDrc20s.list);
      }

      const swapDrc20 = myDrc20s.list.filter((item) => item.tick.length >= 10);
      let drc20s = popularTokenList.concat(swapDrc20);

      const allListInfo = drc20s.length > 0 && allSummary.length > 0
        ? drc20s.map(item => {
          const tickItem = allSummary.find(i => i.tick === item.tick);
          const total_price = item.tick.length > 10 && item.tick === 'WDOGE(WRAPPED-DOGE)'
            ? dogeUsd
            : (dogeUsd * (tickItem?.last_price || 0));
          const last_price = amountToBn(tickItem?.last_price);
          return { ...item, ...tickItem, last_price, total_price, isdrc20: item.isdrc20 };
        })
        : drc20s;

      const allList = Array.from(new Set(allListInfo.map(item => item.tick))).map(tick => {
        return allListInfo.find(item => item.tick === tick);
      });

      setTokens(allList);
      setCurrentToken(allList);
      setTotal(allList.length);
    } catch (error) {
      logError(error);
      showErrorToast(error.message);
    }
  }, [walletAddress]);

  const getAllSummary = async () => {
    try {
      const response = await cardinals.url('/swap/price').post();
      const res = await response.json();
      return res.data || [];
    } catch (err) {
      showErrorToast(err.message);
      return [];
    }
  };

  const getPopularTokenList = async (address) => {
    try {
      const response = await cardinals.url('/drc20/popular').post({ receive_address: address });
      const res = await response.json();
      return res.data?.map(item => ({ ...item, isdrc20: true })) || [];
    } catch (err) {
      showErrorToast(err.message);
      return [];
    }
  };

  const getDogePrice = async () => {
    try {
      const res = await nownodes.get('/tickers/?currency=usd');
      const data = await res.json();
      return data?.rates?.usd;
    } catch (err) {
      logError(err);
      return null;
    }
  };

  const getAddressTokenList = async (address, cursor, size) => {
    try {
      const response = await cardinals.url('/drc20/address').post({ receive_address: address, limit: size, offset: cursor });
      const res = await response.json();
      const drc20Lists = res.data || [];
      return {
        list: drc20Lists.map(item => ({ ...item, isdrc20: true })),
        total: res?.total,
      };
    } catch (err) {
      showErrorToast(err.message);
      return { list: [], total: 0 };
    }
  };

  const tickerChange = (text) => {
    const val = text.toUpperCase();
    const filterList = currentToken.filter(item => item.tick.toUpperCase().includes(val));
    setTokens(filterList);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <Box flex={1}>
        <VStack pl={14} pr={2}>
          <HStack justifyContent='end'>
            <Pressable onPress={() => { navigate('TransferHistory'); }}>
              <Text py="2" fontSize='14px' bold color='brandYellow.500'>{'Transfer History'}</Text>
            </Pressable>
          </HStack>
          <Box>
            <FiSearch style={{
              color: 'rgb(161, 161, 170)',
              position: 'absolute',
              top: '10px',
              left: '10px',
              zIndex: 1
            }} />
            <Input
              onChangeText={tickerChange}
              backgroundColor='gray.100'
              placeholder="Search"
              focusOutlineColor='brandYellow.500'
              style={{ textIndent: 20 }} />
          </Box>
          {
            tokens.length > 0 ?
              <VStack justifyContent='space-between' py="2">
                {tokens.map((data, index) => (
                  !data.isHide && +data.amt > 0 && (
                    <BalanceCard
                      key={index}
                      tokenBalance={data}
                    />
                  )
                ))}
              </VStack> : <Center pt='40px'>
                <Center pt='40px'>
                  <Spinner color='amber.400' />
                </Center>
              </Center>
          }
        </VStack>
      </Box>
    </>

  );
};