import { Box, Pressable } from 'native-base';
import { Fragment, useState } from 'react';

export const NFT = ({ nft: { content, inscriptionId, preview } }) => {
  const [, setIsOpen] = useState(false);
  return (
    <Fragment key={inscriptionId}>
      <Pressable onPress={() => setIsOpen(true)} paddingTop='10px'>
        {/* <Text>{content}</Text> */}
        <Box width='100%' borderRadius='12px' overflow='hidden'>
          <img
            // source={{ uri: preview }}
            src={content}
            width='100%'
            height='auto'
            alt='NFT'
            resizeMode='contain'
          />
        </Box>
      </Pressable>
    </Fragment>
  );
};
