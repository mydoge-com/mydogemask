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

import { BigButton } from '../../../components/Button';
import { NFT } from './NFT';

export const CollectiblesTab = ({
  NFTs,
  hasMoreNFTs,
  fetchMoreNFTs,
  NFTsLoading,
}) => {
  const renderItem = useCallback(({ item, index }) => <NFT nft={item} index={index} />, []);

  return (
    <Box flex={1}>
      {!NFTs ? (
        <Center pt='40px'>
          <Spinner color='amber.400' />
        </Center>
      ) : NFTs.length < 1 ? (
        <VStack pt='48px' alignItems='center'>
          <Text color='gray.500' pt='24px' pb='32px'>
            No NFTs found
          </Text>
          <Text fontSize='16px'>To get started, buy NFTs</Text>
          <BigButton mt='24px'>Buy NFTs</BigButton>
        </VStack>
      ) : (
        <Box px='20px'>
          <VStack space='10px'>
            <FlatList
              data={NFTs}
              renderItem={renderItem}
              keyExtractor={(item) => item.inscriptionId}
              numColumns={2}
            />
            {hasMoreNFTs ? (
              <Button
                variant='unstyled'
                my='12px'
                _hover={{ bg: 'gray.200' }}
                alignSelf='center'
                bg='gray.100'
                onPress={fetchMoreNFTs}
                isDisabled={NFTsLoading}
                alignItems='center'
              >
                <Text color='gray.500' alignItems='center'>
                  View more
                  {NFTsLoading ? (
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
  );
};
