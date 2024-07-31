import moment from 'moment';
import { useEffect, useState } from 'react';
import { VStack, HStack, Text, Button, Pressable, View } from 'native-base';
import { BLOCK_STREAM_URL } from '../../scripts/helpers/constants';
import { amountToDec, formatAccountAddress, shortAddress } from '../../scripts/helpers/cardinals';
import HeaderWithBackButton from './components/HeaderWithBackButton';
import { FiExternalLink } from "react-icons/fi";
import InfiniteScroll from 'react-infinite-scroll-component';
import { cardinals } from '../../scripts/api';
import { useAppContext } from '../../hooks/useAppContext';
import { useNavigate } from "react-router-dom";

const MyItem = ({ group, index, account }) => {
  const navigate = useNavigate();
  const isReceived = account === group?.to_address;
  const addresses = isReceived ? group?.receive_address.split(',') : group?.to_address.split(',');

  return (
    <VStack key={index}>
      <Text color="coolGray.600">{group.date}</Text>
      <VStack key={`item_${index}`} position="relative">
        <div style={{ border: '1px solid rgba(1, 1, 1, 0.1)', padding: '10px', borderRadius: '10px', margin: '5px 0' }}>
          <VStack space={2}>
            <Pressable onPress={() => navigate('/TransferDetailScreen', { state: { group } })}>
              <HStack space={1} alignItems="center">
                <FiExternalLink />
                <Text fontSize="xs" fontWeight='bold'>View Detail</Text>
              </HStack>
            </Pressable>
            {group?.drc20_tx_hash && (
              <HStack pb={1}>
                <Text fontSize="12px" onPress={() => window.open(`${BLOCK_STREAM_URL}/transaction/${group?.drc20_tx_hash}`)}>
                  Hash:
                </Text>
                <Text color="coolGray.600" pl={1} fontSize="12px" > {shortAddress(group?.drc20_tx_hash)}</Text>
              </HStack>

            )}
          </VStack>
          <HStack pb={1}>
            <Text fontSize="12px">OrderId:</Text>
            <Text color="coolGray.600" pl={1} fontSize="12px">{shortAddress(group?.order_id)}</Text>
          </HStack>
          <HStack pb={1}>
            <Text fontSize="12px">Time:</Text>
            <Text color="coolGray.600" fontSize="12px" pl={1}>{moment.unix(group.create_date).format('YYYY-MM-DD HH:mm:ss')}</Text>
          </HStack>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            <Text fontSize="12px" fontWeight='bold'>{isReceived ? 'Received' : 'Transfer'}</Text>
            <Text fontWeight="bold" color="amber.400" px="6px">
              {`${amountToDec(isReceived ? group?.amt : group?.amt * addresses.length)} ${group?.tick}`}
            </Text>
            <Text fontSize="12px" fontWeight='bold'>{isReceived ? 'from' : 'To'}</Text>
            {addresses.slice(0, 3).map((address, idx) => (
              <Text key={idx} color="coolGray.600" fontSize='12px' fontWeight='bold'>{formatAccountAddress(address)}</Text>
            ))}
            {addresses.length > 3 && <Text color="coolGray.600">...</Text>}
          </div>
          <HStack style={{ position: 'absolute', right: '14px', top: '14px' }}>
            <Button size='xs' bg={getButtonColor(group)} py="1.5"><Text fontSize="xs" color={getTextColor(group)} fontWeight='bold'>{group?.transfer_status}</Text></Button>
          </HStack>
        </div>
      </VStack>
    </VStack>
  );
};

const getButtonColor = (group) => {
  if (!group?.block_hash && !group?.fee_tx_hash) {
    return group?.transfer_status === 'Pending' ? 'brandYellow.200' : 'gray.400';
  }
  if (group?.block_hash && (group?.fee_tx_hash || group?.drc20_tx_hash)) {
    return '#E0F8E8';
  }
  return group?.transfer_status === 'Failed' ? 'gray.400' : 'brandYellow.200';
};

const getTextColor = (group) => {
  if (!group?.block_hash && !group?.fee_tx_hash) {
    return group?.transfer_status === 'Pending' ? 'gray.500' : 'white';
  }
  if (group?.block_hash && (group?.fee_tx_hash || group?.drc20_tx_hash)) {
    return 'green.500';
  }
  return group?.transfer_status === 'Failed' ? 'white' : 'gray.500';
};

export const TransferHistory = () => {
  const { wallet, selectedAddressIndex, navigate } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];
  const [page, setPage] = useState(1);
  const [historyGroups, setHistoryGroups] = useState([]);
  const [showNodata, setShowNodata] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loaderText, setLoaderText] = useState('Loading...');

  const getTransferHistory = async (limit, receive_address, offset) => {
    const params = { limit, receive_address, offset };
    const response = await cardinals.url('/orders/address').post(params);
    const res = await response.json();
    if (res.code !== 200) throw new Error('server exception');
    return res.data || [];
  };

  const loadingHistory = async () => {
    const history = await getTransferHistory(50, walletAddress, page - 1);
    if (!history.length) setShowNodata(true);
    if (history.length < 50) setHasMore(false);
    const currentHistory = history.filter(item => item.op === 'transfer');
    const result = [...historyGroups, ...currentHistory];
    setHistoryGroups(result);
    updateStatus(result);
  };

  const updateStatus = (history) => {
    const updatedHistory = history.map(item => {
      const { drc20_tx_hash, block_hash, order_status, create_date } = item;
      item.transfer_status = 'Pending';
      if (drc20_tx_hash) {
        item.transfer_status = block_hash ? 'Completed' : 'In-Progress';
        if (order_status === 1) item.transfer_status = 'Failed';
      } else {
        const oneHourAgo = new Date(create_date * 1000);
        oneHourAgo.setHours(oneHourAgo.getHours() + 1);
        item.transfer_status = new Date().getTime() > oneHourAgo.getTime() ? 'NotPaid' : 'Pending';
      }
      return item;
    });
    setHistoryGroups(updatedHistory);
  };

  const fetchMoreData = () => setPage(page + 1);

  useEffect(() => {
    loadingHistory();
  }, [page]);

  return (
    <VStack pt="20px" px="20px">
      <HeaderWithBackButton title="Transfer History" onBackPress={() => navigate('Transactions')} />
      {showNodata ? (
        <VStack space={4} alignItems="center" mt="20px">
          <Text color="coolGray.600">This account has no transactions</Text>
        </VStack>
      ) : (
        <VStack my="10px">
          <VStack id="scrollableDiv" style={{ overflow: 'auto' }}>
            <InfiniteScroll
              scrollableTarget="scrollableDiv"
              dataLength={historyGroups.length}
              next={fetchMoreData}
              hasMore={hasMore}
              loader={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text>{loaderText}</Text>
                </View>
              }
              style={{ width: '100%', paddingTop: !historyGroups.length ? '10px' : '0' }}
              endMessage={<Text>no more</Text>}
            >
              {historyGroups.map((data, index) => (
                <MyItem key={index} group={data} index={index} account={walletAddress} />
              ))}
            </InfiniteScroll>
          </VStack>
        </VStack>
      )}
    </VStack>
  );
};