import { Avatar, Box, HStack, Text, Tooltip, VStack } from 'native-base';

export const RecipientAddress = ({ address = '' }) => {
  if (!address) return null;
  return (
    <Box pb='24px' pt='8px'>
      <Tooltip label={address} _text={{ fontSize: '10px' }}>
        <VStack>
          <Text fontSize='sm' textAlign='center' color='gray.400'>
            Recipient Address
          </Text>
          <HStack alignItems='center' space='12px'>
            <Avatar
              size='sm'
              bg='brandYellow.500'
              _text={{ color: 'gray.800' }}
            >
              {address.substring(0, 2)}
            </Avatar>
            <Text
              fontSize='sm'
              fontWeight='semibold'
              color='gray.500'
              textAlign='center'
            >
              {address.slice(0, 8)}...{address.slice(-4)}
            </Text>
          </HStack>
        </VStack>
      </Tooltip>
    </Box>
  );
};
