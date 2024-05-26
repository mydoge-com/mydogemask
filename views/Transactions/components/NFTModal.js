import dayjs from 'dayjs';
import {
  Box,
  HStack,
  Modal,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from 'native-base';
import { FiExternalLink } from 'react-icons/fi';

import { DISPATCH_TYPES } from '../../../Context';
import { BigButton } from '../../../components/Button';
import { useAppContext } from '../../../hooks/useAppContext';
import { formatSatoshisAsDoge } from '../../../utils/formatters';
import { useCallback } from 'react';

export const NFTModal = ({
  isOpen,
  onClose,
  nft: {
    address,
    content,
    contentType,
    outputValue,
    inscriptionNumber,
    timestamp,
    inscriptionId,
    genesisTransaction,
  },
  children,
  nft,
}) => {
  const { dispatch, navigate } = useAppContext();
  const onSend = useCallback(() => {
    dispatch({ type: DISPATCH_TYPES.SELECT_NFT, payload: { nft } });
    navigate('SendNFT');
  }, [dispatch, navigate, nft]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='full'>
      <Modal.Content w='90%'>
        <Modal.CloseButton />
        <Modal.Body alignItems='center' pt='54px' pb='36px'>
          <VStack w='100%'>
            <Box width='100%' borderRadius='12px' overflow='hidden'>
              {children}
              <Pressable
                onPress={() => window.open(content)}
                position='absolute'
                top='12px'
                right='12px'
              >
                <FiExternalLink
                  color='white'
                  size={24}
                  style={{
                    filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5))',
                  }}
                />
              </Pressable>
              <Box
                position='absolute'
                left='10px'
                bottom='10px'
                backgroundColor='yellow.400'
                borderRadius='8px'
                paddingX='8px'
                paddingY='1px'
              >
                <Text fontWeight='semibold'>
                  Ɖ {formatSatoshisAsDoge(outputValue, 3)}
                </Text>
              </Box>
            </Box>
            <HStack justifyContent='space-between' alignItems='center'>
              <Text
                fontSize='18px'
                fontWeight='bold'
                color='yellow.600'
                pt='10px'
              >
                # {inscriptionNumber}
              </Text>
            </HStack>
            <Text fontSize='12px' fontWeight='medium' color='gray.500'>
              {dayjs(timestamp * 1000).format('YYYY-MM-DD')}
            </Text>
            <ScrollView>
              <VStack space='12px' pt='20px'>
                <VStack>
                  <Text fontSize='10px' fontWeight='medium' color='gray.500'>
                    Inscription ID
                  </Text>
                  <Text fontSize='12px' fontWeight='medium' color='gray.700'>
                    {inscriptionId}
                  </Text>
                </VStack>
                <VStack>
                  <Text fontSize='10px' fontWeight='medium' color='gray.500'>
                    Address
                  </Text>
                  <Text fontSize='12px' fontWeight='medium' color='gray.700'>
                    {address}
                  </Text>
                </VStack>
                <VStack>
                  <Text fontSize='10px' fontWeight='medium' color='gray.500'>
                    Output Value
                  </Text>
                  <Text fontSize='12px' fontWeight='medium' color='gray.700'>
                    {outputValue}
                  </Text>
                </VStack>
                <VStack>
                  <Text fontSize='10px' fontWeight='medium' color='gray.500'>
                    Content
                  </Text>
                  <Pressable onPress={() => window.open(content)}>
                    <Text fontSize='12px' fontWeight='medium' color='gray.700'>
                      {content}
                    </Text>
                  </Pressable>
                </VStack>
                <VStack>
                  <Text fontSize='10px' fontWeight='medium' color='gray.500'>
                    Content Type
                  </Text>
                  <Text fontSize='12px' fontWeight='medium' color='gray.700'>
                    {contentType}
                  </Text>
                </VStack>
                <VStack>
                  <Text fontSize='10px' fontWeight='medium' color='gray.500'>
                    Genesis Transaction
                  </Text>
                  <Text fontSize='12px' fontWeight='medium' color='gray.700'>
                    {genesisTransaction}
                  </Text>
                </VStack>
              </VStack>
            </ScrollView>

            <Box pt='32px'>
              <BigButton variant='secondary' px='28px' onPress={onSend}>
                Send
              </BigButton>
            </Box>
          </VStack>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
};
