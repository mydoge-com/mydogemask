import { Button, HStack, Icon, IconButton, Text } from 'native-base';
import { FaWindowClose } from 'react-icons/fa';

export const BackButton = ({ onPress, ...props }) => {
  return (
    <Button
      bg='transparent'
      p={0}
      _hover={{ bg: 'transparent' }}
      _pressed={{ bg: 'transparent' }}
      alignSelf='flex-start'
      onPress={onPress}
      {...props}
    >
      <HStack alignItems='center'>
        <IconButton
          icon={<Icon as={FaWindowClose} />}
          rounded='full'
          alignSelf='flex-start'
          borderWidth='1px'
          borderColor='gray.500'
          color='gray.500'
          size='24px'
          onPress={onPress}
        />
        <Text ml='6px' color='gray.500'>
          Cancel
        </Text>
      </HStack>
    </Button>
  );
};
