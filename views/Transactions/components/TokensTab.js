import {
  Box,
  Button,
  Center,
  FlatList,
  Spinner,
  Text,
  VStack,
} from 'native-base';
import { useCallback } from 'react';

import { DISPATCH_TYPES } from '../../../Context';
import { useAppContext } from '../../../hooks/useAppContext';
import { Token } from './Token';
import { TokenModal } from './TokenModal';

export const TokensTab = ({
  tokens,
  tokensLoading,
  hasMoreTokens,
  fetchMoreTokens,
}) => {
  const { dispatch, selectedToken } = useAppContext();
  const selectToken = useCallback(
    (token) => {
      dispatch({
        type: DISPATCH_TYPES.SELECT_TOKEN,
        payload: {
          token,
        },
      });
    },
    [dispatch]
  );
  const renderItem = useCallback(
    ({ item }) => <Token token={item} selectToken={selectToken} />,
    [selectToken]
  );

  return (
    <>
      <Box flex={1}>
        {tokens === undefined ? (
          <Center pt='40px'>
            <Spinner color='amber.400' />
          </Center>
        ) : tokens.length <= 0 ? (
          <VStack pt='48px' alignItems='center'>
            <Text color='gray.500' pt='24px' pb='32px'>
              No transactions found
            </Text>
          </VStack>
        ) : (
          <Box px='20px'>
            <VStack space='10px'>
              <FlatList
                data={tokens}
                renderItem={renderItem}
                keyExtractor={(item) => item.ticker}
              />
              {hasMoreTokens ? (
                <Button
                  variant='unstyled'
                  my='12px'
                  _hover={{ bg: 'gray.200' }}
                  alignSelf='center'
                  bg='gray.100'
                  onPress={fetchMoreTokens}
                  isDisabled={tokensLoading}
                  alignItems='center'
                >
                  <Text color='gray.500' alignItems='center'>
                    View more
                    {tokensLoading ? (
                      <Spinner
                        color='amber.400'
                        pl='8px'
                        transform={[{ translateY: 4 }]}
                      />
                    ) : null}
                  </Text>
                </Button>
              ) : null}
            </VStack>
          </Box>
        )}
      </Box>
      <TokenModal
        isOpen={!!selectedToken}
        token={selectedToken}
        onClose={() => {
          dispatch({
            type: DISPATCH_TYPES.SELECT_TOKEN,
            payload: { token: undefined },
          });
        }}
      />
    </>
  );
};
