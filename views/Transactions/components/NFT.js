import dayjs from 'dayjs';
import { Box, Pressable, Text, VStack } from 'native-base';
import { Fragment, useState } from 'react';

import { NFTModal } from './NFTModal';

export const NFT = ({
  nft: { content, inscriptionNumber, timestamp },
  nft,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  return (
    <Fragment key={inscriptionNumber}>
      <Pressable onPress={() => setIsOpen(true)} paddingTop='20px'>
        <VStack p='10px' borderRadius='22px' bg='gray.100'>
          <Box width='100%' borderRadius='12px' overflow='hidden'>
            <img
              src={content}
              width='100%'
              height='auto'
              alt='NFT'
              resizeMode='contain'
            />
          </Box>

          <Text fontSize='16px' fontWeight='bold' color='yellow.600' pt='10px'>
            # {inscriptionNumber}
          </Text>

          <Text fontSize='12px' fontWeight='medium' color='gray.500'>
            {dayjs(timestamp * 1000).format('YYYY-MM-DD')}
          </Text>
        </VStack>
      </Pressable>
      <NFTModal isOpen={isOpen} onClose={onClose} nft={nft} />
    </Fragment>
  );
};
