import moment from 'moment';
import { useEffect, useState } from 'react';
import { VStack, HStack, Text, Button, Pressable } from 'native-base';
import { BLOCK_STREAM_URL } from '../../scripts/helpers/constants';
import { amountToDec, formatAccountAddress, shortAddress } from '../../scripts/helpers/cardinals';
import HeaderWithBackButton from './components/HeaderWithBackButton';
import { FiExternalLink } from "react-icons/fi";
import InfiniteScroll from 'react-infinite-scroll-component'
import { cardinals } from '../../scripts/api';
import { useAppContext } from '../../hooks/useAppContext';

const MyItem = ({ group, index, account }) => {
  const { navigate } = useAppContext();
  return (
    <>
      <VStack key={index}>
        <Text color="coolGray.600">{group.date}</Text>
        <VStack key={`item_${index}`} position="relative">
          <div width="100%" my='4px' style={{ border: '1px solid rgb(253, 196, 28)', padding: '10px', borderRadius: '10px', flexFlow: 'wrap', margin: '5px 0' }}>
            <VStack>
              <VStack space={2}>
                <Pressable
                  onPress={() => {
                    navigate('TransferDetailScreen', { group });
                  }}
                >
                  <HStack space={1} alignItems="center">
                    <FiExternalLink />
                    <Text fontSize="xs">View Detail</Text>
                  </HStack>
                </Pressable>
                {group?.drc20_tx_hash && (
                  <Text
                    fontSize="xs"
                    color="coolGray.600"
                    onPress={() => {
                      window.open(`${BLOCK_STREAM_URL}/transaction/${group?.drc20_tx_hash}`);
                    }}
                  >
                    Hash: {shortAddress(group?.drc20_tx_hash)}
                  </Text>
                )}
              </VStack>
              <Text color="coolGray.600">OrderId: {shortAddress(group?.order_id, 8)}</Text>
              <Text color="coolGray.600">{moment.unix(group.create_date).format('YYYY-MM-DD HH:mm:ss')}</Text>
              {account === group?.to_address ? (
                <div style={{ display: 'flex', flexShrink: 'inherit', flexFlow: 'wrap', flexWrap: 'wrap' }}>
                  <Text color="coolGray.600">Received</Text>
                  <Text fontWeight="bold" color="amber.400" px="6px">
                    {`${amountToDec(group?.amt)} ${group?.tick}`}
                  </Text>
                  <Text color="coolGray.600">from</Text>
                  {group?.receive_address.split(',').map((address, index) => (
                    <Text key={index} color="coolGray.600">
                      {formatAccountAddress(address)}
                    </Text>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexShrink: 'inherit', flexFlow: 'wrap', flexWrap: 'wrap' }}>
                  <Text color="coolGray.600">Transfer</Text>
                  <Text fontWeight="bold" color="amber.400" px="6px">
                    {`${amountToDec(group?.amt * group?.to_address?.split(',').length)} ${group?.tick}`}
                  </Text>
                  <Text color="coolGray.600">To</Text>
                  {group?.to_address.split(',').slice(0, 3).map((address, index) => (
                    <Text key={index} color="coolGray.600">
                      {formatAccountAddress(address)}
                    </Text>
                  ))}
                  {group?.to_address.split(',').length > 3 && <Text color="coolGray.600">...</Text>}
                </div>
              )}
            </VStack>
            <HStack style={{ position: 'absolute', right: '14px', top: '14px' }}>
              {(!group?.block_hash && !group?.fee_tx_hash) && (
                <Button
                  size='xs'
                  bg={group?.transfer_status === 'Pending' ? 'brandYellow.500' : 'gray.400'}
                >
                  <Text fontSize="xs" color="white">{group?.transfer_status}</Text>
                </Button>
              )}
              {(group?.block_hash && (group?.fee_tx_hash || group?.drc20_tx_hash)) && (
                <Button
                  size='xs'
                  bg="green.600"
                >
                  <Text fontSize="xs" color="white">{group?.transfer_status}</Text>
                </Button>
              )}
              {!group?.block_hash && (group?.fee_tx_hash || group?.drc20_tx_hash) && (
                <Button
                  size='xs'
                  bg={group?.transfer_status === 'Failed' ? 'gray.400' : 'brandYellow.500'}
                >
                  <Text fontSize="xs" color="white">{group?.transfer_status}</Text>
                </Button>
              )}
            </HStack>
          </div>
        </VStack>
      </VStack>
    </>

  );
}

export const Drc20TransferHistory = () => {
  const { wallet, selectedAddressIndex, navigate } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];
  const [page, setPage] = useState(1);
  const [historyGroups, setHistoryGroups] = useState([]);
  const [showNodata, setShowNodata] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loaderText, setLoaderText] = useState('Loading...');

  const getDRC20TransferHistory = async (limit, receive_address, offset) => {
    const params = {
      limit: limit,
      receive_address: receive_address
    }
    if (offset === 0 || offset) {
      params.offset = offset
    }
    const response = await cardinals.url('/orders/address').post({ ...params });
    const res = await response.json();
    const orderInfo = res.data || []
    if (res.code !== 200) {
      throw new Error('server exception');
    }
    return orderInfo
  }
  const loadingHistory = async () => {
    const history = await getDRC20TransferHistory(50, walletAddress, page - 1);
    if (!history?.length) {
      setShowNodata(true);
    }
    if (history?.length < 50) {
      setHasMore(false);
    }
    const currentHistory = history.filter(item => item.op === 'transfer')
    const result = [...historyGroups, ...currentHistory]
    setHistoryGroups(result);
    getStatus(result)
  };

  const getStatus = (history) => {
    const historyItems = history ? [...history] : []
    const list = historyItems?.map(item => {
      const { drc20_tx_hash, block_hash, order_status } = item
      item.transfer_status = 'Pending';
      if (drc20_tx_hash) {
        item.transfer_status = 'In-Progress';
        if (block_hash) {
          item.transfer_status = 'Completed';
        }
        if (order_status === 1) {
          item.transfer_status = 'Failed';
        }
      } else {
        const currentTime = new Date().getTime();
        const oneHourAgo = new Date(item?.create_date * 1000);
        let oneHourAgoTime = null;
        oneHourAgo.setHours(oneHourAgo.getHours() + 1);
        oneHourAgoTime = oneHourAgo.getTime();
        item.transfer_status = currentTime > oneHourAgoTime ? 'NotPaid' : 'Pending'
      }
      return {
        ...item
      }
    })
    setHistoryGroups(list);
  }

  const fetchMoreData = () => {
    setPage(page + 1);
  };

  useEffect(() => {
    loadingHistory();
  }, [page]);

  return (
    <VStack pt="20px" px="20px">
      <HeaderWithBackButton
        title="Transfer History"
        onBackPress={() => navigate('Transactions')}
      />
      {showNodata ? (
        <VStack space={4} alignItems="center" mt="20px">
          <Text color="coolGray.600">This account has no transactions</Text>
        </VStack>
      ) : (
        <VStack my="10px">
          {
            <VStack id="scrollableDiv" style={{
              overflow: 'auto'
            }}>
              <InfiniteScroll
                scrollableTarget="scrollableDiv"
                dataLength={historyGroups?.length}
                next={fetchMoreData}
                hasMore={hasMore}
                loader={<Text>{loaderText} </Text>}
                style={{ width: '100%', paddingTop: !historyGroups?.length ? '10px' : '0' }}
                endMessage={
                  <Text>
                    {'no more'}
                  </Text>
                }
              >
                {historyGroups?.map((data, index) => (
                  <MyItem key={index} group={data} index={index} account={walletAddress} />
                ))}
              </InfiniteScroll>
            </VStack>
          }
        </VStack>
      )}
    </VStack>
  );
}