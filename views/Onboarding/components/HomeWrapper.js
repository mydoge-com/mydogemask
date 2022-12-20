import { Box, HStack, Image } from 'native-base';
import React from 'react';

export const HomeWrapper = ({ children }) => {
  return (
    <HStack h='100vh' justifyContent='space-between'>
      <Box
        h='100%'
        flex={1}
        justifyContent='center'
        alignItems='center'
        bg='white'
        // flexShrink={1}
      >
        <Image
          source={{ uri: '/assets/bg.png' }}
          h='100%'
          position='absolute'
          zIndex={-1}
          left={0}
          right={0}
          alt='background'
        />
        <Image
          source={{ uri: '/assets/mydoge-mask.png' }}
          size={250}
          resizeMode='contain'
          position='absolute'
          top='-30px'
          alignSelf='center'
          alt='mydogemask'
        />
        <Image
          source={{ uri: '/assets/intro.png' }}
          size={500}
          resizeMode='contain'
          alt='intro'
        />
      </Box>
      <Box h='100%' bg='#f1f1f1' flex={1} minW='500px'>
        {children}
      </Box>
    </HStack>
  );
};
