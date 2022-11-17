import { Box, Image } from 'native-base';

import { AppProvider } from '../../components/AppProvider';

function App() {
  return (
    <AppProvider>
      <Box h='100vh' overflow='hidden'>
        <Box
          w='50vw'
          h='100%'
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
            size={200}
            resizeMode='contain'
            position='absolute'
            top='0px'
            alignSelf='center'
          />
          <Image
            source={{ uri: '/assets/intro.png' }}
            size={500}
            resizeMode='contain'
          />
        </Box>
        <Box w='50vw' h='100%' />
      </Box>
    </AppProvider>
  );
}

export default App;
