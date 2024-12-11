import {
  Box,
  Button,
  Center,
  FlatList,
  Spinner,
  Text,
  Toast,
  VStack,
} from 'native-base';
import { useCallback, useEffect, useState } from 'react';

import { BigButton } from '../../components/Button';
import { RecipientAddress } from '../../components/RecipientAddress';
import { ToastRender } from '../../components/ToastRender';
import { WalletAddress } from '../../components/WalletAddress';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { getDRC20Inscriptions } from '../../scripts/helpers/doginals';
import { sendMessage } from '../../scripts/helpers/message';
import { NFT } from '../Transactions/components/NFT';

export const TransferDRC20Amount = ({
  setFormPage,
  setFormData,
  formData,
  walletAddress,
  selectedToken,
  selectedNFT,
  setSelectedNFT,
}) => {
  const [loading, setLoading] = useState(false);
  const [nfts, setNFTs] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const transfers = await getDRC20Inscriptions(
          walletAddress,
          selectedToken.ticker
        );

        setNFTs(transfers);
      } catch (e) {
        Toast.show({
          title: 'Error',
          description: 'Error loading inscriptions',
          duration: 3000,
          render: () => {
            return (
              <ToastRender
                title='Error'
                description='Error loading inscriptions'
                status='error'
              />
            );
          },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedToken.ticker, walletAddress]);

  const renderItem = useCallback(
    ({ item, index }) => {
      return (
        <NFT
          nft={item}
          index={index}
          onPress={() => {
            setSelectedNFT(item);
          }}
          selected={selectedNFT?.location === item.location}
        />
      );
    },
    [selectedNFT?.location, setSelectedNFT]
  );

  const onSubmit = useCallback(() => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.CREATE_NFT_TRANSACTION,
        data: {
          ...selectedNFT,
          address: walletAddress,
          recipientAddress: formData.address.trim(),
        },
      },
      ({ rawTx, fee, amount }) => {
        if (rawTx && fee !== undefined && amount) {
          setFormData({
            ...formData,
            rawTx,
            fee,
            dogeAmount: amount,
          });
          setFormPage('confirmationDRC20');
          setLoading(false);
        } else {
          setLoading(false);
          Toast.show({
            title: 'Error',
            description: 'Error creating transaction',
            duration: 3000,
            render: () => {
              return (
                <ToastRender
                  title='Error'
                  description='Error creating transaction'
                  status='error'
                />
              );
            },
          });
        }
      }
    );
  }, [formData, setFormData, setFormPage, selectedNFT, walletAddress]);

  return (
    <Center>
      <WalletAddress />
      <Text fontSize='xl' pb='8px' textAlign='center'>
        Transfer <Text fontWeight='bold'>{selectedToken.ticker}</Text> Tokens
      </Text>
      <RecipientAddress address={formData.address} />
      <Box flex={1}>
        {!nfts ? (
          <Center pt='40px'>
            <Spinner color='amber.400' />
          </Center>
        ) : nfts?.length < 1 ? (
          <VStack pt='48px' alignItems='center'>
            <Text color='gray.500' pt='24px' pb='32px'>
              No transfers found
            </Text>
          </VStack>
        ) : (
          <Box justifyContent='center' pos='relative'>
            <VStack space='10px' w='100%' pos='relative'>
              <FlatList
                data={nfts}
                renderItem={renderItem}
                keyExtractor={(item) =>
                  `${selectedNFT?.location}${item.location}`
                }
                numColumns={2}
                initialNumToRender={4}
              />
            </VStack>
            <Center
              space='18px'
              position='sticky'
              bottom={0}
              bg='white'
              w='100%'
              flexDir='row'
              pt='6px'
            >
              <Button
                variant='unstyled'
                colorScheme='coolGray'
                onPress={() => {
                  setSelectedNFT(null);
                  setFormPage('address');
                }}
                alignSelf='center'
              >
                Back
              </Button>
              <BigButton
                onPress={onSubmit}
                type='submit'
                role='button'
                px='28px'
                isDisabled={!selectedNFT}
                loading={loading}
              >
                Next
              </BigButton>
            </Center>
          </Box>
        )}
      </Box>

      {/* <HStack
        alignItems='center'
        mt='60px'
        space='12px'
        position='fixed'
        // bottom='16px'
        // bg='red.400'
        // f={1}
        // w='300px'
        // jc='center'
        // flexBasis={1}
      >
        <Button
          variant='unstyled'
          colorScheme='coolGray'
          onPress={() => setFormPage('address')}
        >
          Back
        </Button>
        <BigButton
          onPress={onSubmit}
          type='submit'
          role='button'
          px='28px'
          isDisabled={!selectedNFT}
          loading={loading}
        >
          Next
        </BigButton>
      </HStack> */}
    </Center>
  );
};
