import { Box, Image, Spinner, Text, VStack } from 'native-base';
import { FaLink } from 'react-icons/fa';

import { OriginBadge } from './OriginBadge';

const MydogeIcon = 'assets/mydoge-icon.svg';

export function ClientPopupLoading({ pageLoading, origin, loadingText }) {
  return (
    <>
      <Image
        src={MydogeIcon}
        width={66}
        height={66}
        alignSelf='center'
        zIndex={2}
        alt='Mydoge icon'
      />
      <Box p='8px' bg='brandYellow.500' rounded='full' my='24px'>
        <FaLink />
      </Box>
      <OriginBadge origin={origin} />
      <VStack alignItems='center' justifyContent='center' space='6px' pt='80px'>
        {pageLoading ? <Spinner size='lg' color='amber.500' /> : null}
        <Text fontSize='md' pt='6px' color='gray.400'>
          {loadingText}
        </Text>
      </VStack>
    </>
  );
}
