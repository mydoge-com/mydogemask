import { Box, HStack, Image } from 'native-base';

export const HomeWrapper = ({ children }) => {
  return (
    <HStack h='100vh' overflow='hidden' justifyContent='space-between'>
      <Box
        h='100%'
        flex={0.5}
        justifyContent='center'
        alignItems='center'
        bg='white'
      >
        <Image
          source={{ uri: '/assets/bg.png' }}
          h='100%'
          position='absolute'
          zIndex={-1}
          left={0}
          right={0}
        />
        <Image
          source={{ uri: '/assets/mydoge-mask.png' }}
          size={250}
          resizeMode='contain'
          position='absolute'
          top='-30px'
          alignSelf='center'
        />
        <Image
          source={{ uri: '/assets/intro.png' }}
          size={500}
          resizeMode='contain'
        />
      </Box>
      <Box h='100%' bg='#f1f1f1' flex={0.5}>
        {children}
      </Box>
    </HStack>
  );
};
