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
import { useSearchParams } from 'react-router-dom';

import { useAppContext } from '../../../hooks/useAppContext';
import { useCachedInscriptionTxs } from '../../../hooks/useCachedInscriptionTxs';
import { Token } from './Token';
import { TokenModal } from './TokenModal';

export const TokensTab = ({
  tokens,
  tokensLoading,
  hasMoreTokens,
  fetchMoreTokens,
}) => {
  const { navigate } = useAppContext();

  const [searchParams] = useSearchParams();

  let selectedToken = searchParams.get('selectedToken');

  if (selectedToken) {
    selectedToken = JSON.parse(selectedToken);
  }

  const pendingTxs = useCachedInscriptionTxs({
    filterPending: true,
  });

  const renderItem = useCallback(
    ({ item }) => (
      <Token
        token={item}
        pendingTxs={pendingTxs.filter((tx) => tx.ticker === item.ticker)}
      />
    ),
    [pendingTxs]
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
        onClose={() => navigate(-1)}
      />
    </>
  );
};
