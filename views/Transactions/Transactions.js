import {
  Box,
  // Button,
  Center,
  // FlatList,
  HStack,
  // Spinner,
  Text,
  // VStack,
} from 'native-base';
import { useCallback, useMemo, useState } from 'react';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';

import { WalletDetailModal } from '../../components/Header/WalletDetailModal';
import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { ActionButton } from './components/ActionButton';
import { Balance } from './components/Balance';
import { CollectiblesTab } from './components/CollectiblesTab';
// import { Transaction } from './components/Transaction';
import { TransactionsTab } from './components/TransactionsTab';
import { useTransactions } from './Transactions.hooks';

const Buy = 'assets/buy.svg';
const Receive = 'assets/receive.svg';
const Send = 'assets/send.svg';

export function Transactions() {
  const { balance, usdValue } = useTransactions();

  const { wallet, navigate, selectedAddressIndex } = useAppContext();

  const activeAddress = wallet.addresses[selectedAddressIndex];

  const activeAddressNickname =
    wallet.nicknames?.[activeAddress] ?? `Address ${selectedAddressIndex + 1}`;

  const onBuy = useCallback(() => {
    window.open(`https://buy.getdoge.com/?addr=${activeAddress}`);
  }, [activeAddress]);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Transactions' },
    { key: 'second', title: 'Doginals' },
  ]);

  const NFTsRoute = useCallback(() => {
    return <CollectiblesTab />;
  }, []);

  const [addressDetailOpen, setAddressDetailOpen] = useState(false);

  const toggleReceiveModal = useCallback(() => {
    setAddressDetailOpen((val) => !val);
  }, []);

  const TransactionsRoute = useCallback(
    () => (
      <TransactionsTab toggleReceiveModal={toggleReceiveModal} onBuy={onBuy} />
    ),
    [toggleReceiveModal, onBuy]
  );

  const renderScene = useMemo(
    () =>
      SceneMap({
        first: TransactionsRoute,
        second: NFTsRoute,
      }),
    [NFTsRoute, TransactionsRoute]
  );

  return (
    <Layout withHeader withConnectStatus p={0}>
      <Box pt='60px'>
        <Balance balance={balance} usdValue={usdValue} />
        <Center>
          <HStack space='24px' pt='14px' pb='16px'>
            <ActionButton icon={Buy} label='Buy' onPress={onBuy} />

            <ActionButton
              icon={Receive}
              label='Receive'
              onPress={toggleReceiveModal}
            />

            <ActionButton
              icon={Send}
              label='Send'
              onPress={() => navigate('Send')}
            />
          </HStack>
        </Center>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: 375 }}
          renderTabBar={(props) => (
            <TabBar
              indicatorStyle={{
                backgroundColor: '#e3ab02',
              }}
              style={{ backgroundColor: 'transparent' }}
              renderLabel={({ route, focused }) => (
                <Text
                  fontWeight='bold'
                  fontSize='14px'
                  color={focused ? 'black' : '#A1A1AA'}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {route.title}
                </Text>
              )}
              {...props}
            />
          )}
          lazy
        />
      </Box>

      <WalletDetailModal
        showModal={addressDetailOpen}
        onClose={toggleReceiveModal}
        addressNickname={activeAddressNickname}
        wallet={wallet}
        allowEdit={false}
        address={activeAddress}
      />
    </Layout>
  );
}
