import dayjs from 'dayjs';
import { Box, Pressable, Text, VStack } from 'native-base';
import { Fragment, useState } from 'react';
import MIMEType from 'whatwg-mimetype';

import { NFTModal } from './NFTModal';

export const NFT = ({
  nft: { content, inscriptionNumber, timestamp, contentType, amount, ticker },
  nft,
  index,
  onPress,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  const mimeType = new MIMEType(contentType);
  return (
    <Fragment key={inscriptionNumber}>
      <Pressable
        onPress={() => {
          if (onPress) {
            onPress();
          } else {
            setIsOpen(true);
          }
        }}
        paddingTop='20px'
        flex={1 / 2}
        paddingLeft={index % 2 === 0 ? 0 : '6px'}
        paddingRight={index % 2 === 0 ? '6px' : 0}
      >
        <VStack p='10px' borderRadius='12px' bg='gray.100'>
          <Box
            width='100%'
            borderRadius='6px'
            overflow='hidden'
            alignItems='center'
            justifyContent='center'
            maxH='130px'
          >
            <NFTView content={content} mimeType={mimeType} />
          </Box>

          <Text fontSize='16px' fontWeight='bold' color='yellow.600' pt='10px'>
            {ticker ? `${ticker} ${amount}` : `# ${inscriptionNumber}`}
          </Text>

          {timestamp && (
            <Text fontSize='12px' fontWeight='medium' color='gray.500'>
              {dayjs(timestamp * 1000).format('YYYY-MM-DD')}
            </Text>
          )}
        </VStack>
      </Pressable>
      <NFTModal isOpen={isOpen} onClose={onClose} nft={nft}>
        <NFTView content={content} mimeType={mimeType} />
      </NFTModal>
    </Fragment>
  );
};

export const NFTView = ({ content, mimeType }) => {
  switch (mimeType.type) {
    case 'image':
      return <img src={content} width='100%' height='auto' alt='NFT' />;
    case 'text':
      return (
        <iframe
          title='NFT'
          src={content}
          width='100%'
          height='auto'
          sandbox='allow-same-origin allow-scripts'
          allow
        />
      );
    default:
      return (
        <img
          src='./assets/default-nft.webp'
          width='100%'
          height='auto'
          alt='NFT'
        />
      );
  }
};
