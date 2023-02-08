import { HStack, Text, Tooltip } from 'native-base';

export const OriginBadge = ({ origin, ...rest }) => {
  return (
    <Tooltip label={origin} _text={{ fontSize: '10px' }}>
      <HStack
        px='20px'
        py='4px'
        colorScheme='gray'
        rounded='full'
        alignSelf='center'
        display='flex'
        bg='gray.200'
        maxW='90%'
        {...rest}
      >
        <Text
          fontSize='13px'
          w='100%'
          noOfLines={1}
          fontWeight='medium'
          width='70%'
          flex={1}
          flexShrink={1}
        >
          {new URL(origin).hostname.replace('www.', '')}
        </Text>
      </HStack>
    </Tooltip>
  );
};
