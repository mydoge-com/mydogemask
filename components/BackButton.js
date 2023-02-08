import { Button, HStack, Text } from 'native-base';
import { ImCancelCircle } from 'react-icons/im';

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
        <Button variant='ghost' rounded='full' p='8px' onPress={onPress}>
          <ImCancelCircle size='20px' color='#808080' />
        </Button>
        <Text color='gray.500'>Cancel</Text>
      </HStack>
    </Button>
  );
};
