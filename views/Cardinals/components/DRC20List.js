import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../hooks/useAppContext';
import { amountToBn } from '../../../scripts/helpers/cardinals';
import { cardinals, nownodes } from '../../../scripts/api';
import { VStack, Input, useToast, Spinner, Center, Text } from 'native-base';
import { logError } from '../../../utils/error';
import { DRC20BalanceCard } from './DRC20BalanceCard';
import { FiSearch } from "react-icons/fi";
export const DRC20List = () => {
  const { wallet, selectedAddressIndex } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];
  const toast = useToast();
  const [tokens, setTokens] = useState([]);
  const [currentToken, setCurrentToken] = useState([]);
  const [total, setTotal] = useState(-1);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 50 });
  const getAllSummary = async () => {
    try {
      const response = await cardinals.url('/swap/price').post();
      const res = await response.json();
      const list = res.data || [];
      return list;
    } catch (err) {
      toast.show({
        title: err.message || 'Unknown error'
      });
      return [];
    }
  };
  const getPopularTokenList = async (address) => {
    try {
      const response = await cardinals.url('/drc20/popular').post({ receive_address: address });
      const res = await response.json();
      const drc20Lists = res.data || []
      const newData = drc20Lists?.map(item => ({ ...item, isdrc20: true }))
      return newData;
    } catch (err) {
      toast.show({
        title: err.message || 'Unknown error'
      });
      return [];
    }
  }
  const getDogePrice = async () => {
    try {
      const res = await nownodes.get('/tickers/?currency=usd')
      const data = await res.json();
      const usd = data?.rates?.usd
      return usd
    } catch (err) {
      logError(err);
    }
  }
  const getAddressTokenList = async (address, cursor, size) => {
    try {
      const response = await cardinals.url('/drc20/address').post({ receive_address: address, limit: size, offset: cursor });
      const res = await response.json();
      const drc20Lists = res.data || []
      const newData = drc20Lists?.map(item => ({ ...item, isdrc20: true }))
      const list = {
        list: [...newData],
        total: res?.total,
      }
      return list
    } catch (err) {
      toast.show({
        title: err.message || 'Unknown error'
      });
      return [];
    }
  }
  const fetchData = async () => {
    try {
      let allSummary = [];
      try {
        allSummary = await getAllSummary();
      } catch (error) {
        console.log('Error in getAllSummary:', error);
      }
      const dogeUsd = await getDogePrice()
      const popularTokenList = await getPopularTokenList(walletAddress)
      const localData = (await new Promise((resolve) => {
        chrome.storage.local.get(['drc20TokenInfo'], function (res) {
          const result = res?.drc20TokenInfo && res?.drc20TokenInfo[walletAddress] ? res?.drc20TokenInfo[walletAddress] : []
          resolve(result);
        });
      }))
      let page = 0;
      const perPage = 1000;
      const myDrc20s = await getAddressTokenList(walletAddress, page, perPage);

      if (myDrc20s?.list?.length === perPage) {
        page++;
        const nextPageDrc20s = await getAddressTokenList(walletAddress, page * perPage, perPage);
        myDrc20s.list = myDrc20s.list.concat(nextPageDrc20s.list);
      }
      const swapDrc20 = myDrc20s.list.filter((item) => item.tick.length >= 10)
      let drc20s = popularTokenList.concat(swapDrc20)
      if (localData?.length) {
        localData?.forEach(data => {
          const dataItem = myDrc20s?.list?.find(dataEntry => dataEntry.tick === data.tick)
          if (dataItem) {
            data.amt = dataItem.amt
          } else {
            data.amt = 0
          }
        })
      }
      drc20s.forEach(inputEntry => {
        const existingEntryIndex = localData?.findIndex(dataEntry => dataEntry.tick === inputEntry.tick);
        if (existingEntryIndex !== -1) {
          localData[existingEntryIndex].amt = inputEntry.amt;
        } else {
          localData.push(inputEntry);
        }
      });
      const outputArray = localData.map(entry => ({ 'amt': entry.amt, 'tick': entry.tick, 'isHide': entry.isHide, 'isdrc20': entry.isdrc20 }));
      drc20s = [...outputArray];
      const allListInfo =
        drc20s?.length > 0 && allSummary?.length > 0
          ? drc20s.map(item => {
            const tickItem = allSummary.find(i => i.tick === item.tick);
            const total_price = item.tick.length > 10 && item.tick === 'WDOGE(WRAPPED-DOGE)'
              ? dogeUsd
              : (dogeUsd * (tickItem?.last_price || 0))
            const last_price = amountToBn(tickItem?.last_price)
            return { ...item, ...tickItem, last_price, total_price, isdrc20: item.isdrc20 };
          })
          : drc20s;
      const allList = Array.from(new Set(allListInfo.map(item => item.tick))).map(tick => {
        return allListInfo.find(item => item.tick === tick);
      });
      const result = {
        list: [...allList],
        total: allList?.length,
      };
      const info = {}
      info[walletAddress] = [...allList]
      const drc20TokenInfo = info
      chrome.storage.local.set(drc20TokenInfo)
      const { list, total } = result
      setTokens(list);
      setCurrentToken(list)
      setTotal(total);
    } catch (error) {
      console.log(error);
      toast.show({
        title: error.message || 'Unknown error'
      });
    }
  };
  const tickerChange = (text) => {
    const val = text;
    const filterAction = {
      0: item => item,
      1: item => item.tick.toUpperCase().indexOf(val?.toUpperCase()) !== -1,
    };
    const filterType = val ? 1 : 0;
    const filterList = currentToken?.filter(filterAction[filterType]);
    setTokens(filterList);
  }
  useEffect(() => {
    fetchData();
  }, [pagination]);
  return (
    <VStack>
      <VStack w="100%" space={3} alignSelf="center" style={{position: 'relative'}}>
        <FiSearch style={{
          color: 'rgb(113, 113, 122)',
          position: 'absolute',
          top: '24px',
          left: '10px',
          zIndex: 1
          }}/>
        <Input
          onChangeText={tickerChange}
          style={{ textIndent: 20 }}
          focusOutlineColor='brandYellow.500'
          _hover={{
            borderColor: 'brandYellow.500',
          }}
          _invalid={{
            borderColor: 'red.500',
            focusOutlineColor: 'red.500',
            _hover: {
              borderColor: 'red.500',
            },
          }}
          backgroundColor='gray.100'
          placeholder="Search" variant="filled" width="100%"  py="2" px="2" autoFocus/>
      </VStack>
      {
        tokens?.length > 0 ?
          <VStack justifyContent='space-between' py="2">
            {tokens?.map((data, index) => (
              <VStack key={index} justifyContent='space-between'>
                {!data.isHide && +data.amt > 0 && (
                  <DRC20BalanceCard
                    key={index}
                    tokenBalance={data}
                  />
                )}
              </VStack>
            ))}
          </VStack> : <Center pt='40px'>
            <Center pt='40px'>
              <Spinner color='amber.400' />
            </Center>
          </Center>
      }
    </VStack>
  )
}