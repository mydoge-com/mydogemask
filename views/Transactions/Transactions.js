import { Box, Center, HStack, Text } from 'native-base';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';
import { useParams, useSearchParams } from 'react-router-dom';

import { WalletDetailModal } from '../../components/Header/WalletDetailModal';
import { Layout } from '../../components/Layout';
import { ActionButton } from './components/ActionButton';
import { Balance } from './components/Balance';
import { NFTsTab } from './components/NFTsTab';
import { TokensTab } from './components/TokensTab';
import { TransactionsTab } from './components/TransactionsTab';
import { useTransactions } from './Transactions.hooks';

const Buy = 'assets/buy.svg';
const Receive = 'assets/receive.svg';
const Send = 'assets/send.svg';

export function Transactions() {
  const {
    balance,
    usdValue,
    transactions,
    isLoadingTransactions,
    isLoadingMoreTransactions,
    hasMoreTransactions,
    fetchMoreTransactions,
    refreshTransactions,
    NFTs,
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
  } = useTransactions();

  const [searchParams] = useSearchParams();

  const shouldRefresh = searchParams.get('refresh');

  useEffect(() => {
    if (shouldRefresh) {
      refreshTransactions();
    }
  }, [shouldRefresh, refreshTransactions]);

  const activeAddress = wallet.addresses[selectedAddressIndex];

  const activeAddressNickname =
    wallet.nicknames?.[activeAddress] ?? `Address ${selectedAddressIndex + 1}`;

  const onBuy = useCallback(() => {
    window.open(`https://buy.getdoge.com/?addr=${activeAddress}`);
  }, [activeAddress]);

  const [routes] = useState([
    { key: 'transactions', title: 'Transactions' },
    { key: 'doginals', title: 'Doginals' },
    { key: 'tokens', title: 'Tokens' },
  ]);

  const NFTsRoute = useCallback(() => {
    return (
      <NFTsTab
        NFTs={NFTs}
        hasMoreNFTs={hasMoreNFTs}
        fetchMoreNFTs={fetchMoreNFTs}
        NFTsLoading={NFTsLoading}
      />
    );
  }, [NFTs, NFTsLoading, fetchMoreNFTs, hasMoreNFTs]);

  const [addressDetailOpen, setAddressDetailOpen] = useState(false);

  const toggleReceiveModal = useCallback(() => {
    setAddressDetailOpen((val) => !val);
  }, []);

  const TransactionsRoute = useCallback(
    () => (
      <TransactionsTab
        toggleReceiveModal={toggleReceiveModal}
        onBuy={onBuy}
        transactions={transactions}
        loading={isLoadingTransactions}
        hasMore={hasMoreTransactions}
        fetchMore={fetchMoreTransactions}
        isLoadingMore={isLoadingMoreTransactions}
      />
    ),
    [
      toggleReceiveModal,
      onBuy,
      transactions,
      isLoadingTransactions,
      hasMoreTransactions,
      fetchMoreTransactions,
      isLoadingMoreTransactions,
    ]
  );

  const TokensRoute = useCallback(
    () => (
      <TokensTab
        tokens={tokens}
        tokensLoading={tokensLoading}
        hasMoreTokens={hasMoreTokens}
        fetchMoreTokens={fetchMoreTokens}
      />
    ),
    [fetchMoreTokens, hasMoreTokens, tokens, tokensLoading]
  );

  const renderScene = useMemo(
    () =>
      SceneMap({
        transactions: TransactionsRoute,
        tokens: TokensRoute,
        doginals: NFTsRoute,
      }),
    [NFTsRoute, TokensRoute, TransactionsRoute]
  );

  const { tab } = useParams();

  const [txTabIndex, setTxTabIndex] = useState(
    routes.findIndex((r) => r.key === tab) ?? 0
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
          navigationState={{ index: txTabIndex, routes }}
          renderScene={renderScene}
          onIndexChange={setTxTabIndex}
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
