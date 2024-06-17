import {  HStack, Pressable, Text, VStack } from 'native-base';
import { useState, useCallback, useMemo } from 'react';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';
import { DRC20List } from './DRC20List';
import { useAppContext } from '../../../hooks/useAppContext';
export const CardinalsTab = ({
}) => {
  const [index, setIndex] = useState(0);
  const { navigate } = useAppContext();
  const [routes] = useState([
    { key: 'drc20', title: 'DRC-20' }
  ]);
  const DRC20Route = useCallback(
    () => (
      <DRC20List />
    ),
    []
  );
  const renderScene = useMemo(
    () =>
      SceneMap({
        drc20: DRC20Route
      }),
    [DRC20Route]
  );
  return (
    <VStack mx="10px">
      <HStack style={{ position: 'absolute', right: 0, top: '14px', zIndex: 10 }}>
        <Pressable onPress={() => { navigate('Drc20TransferHistory'); }}>
          <Text fontSize='12px' color='gray.500'>{'DRC-20 Transfer History'}</Text>
        </Pressable>
      </HStack>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: 375 }}
        renderTabBar={(props) => (
          <TabBar
            indicatorStyle={{
              backgroundColor: '#e3ab02'
            }}
            style={{ backgroundColor: 'transparent', width: '40%' }}
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
    </VStack>
  )
};
