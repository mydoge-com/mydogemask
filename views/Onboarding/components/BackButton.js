import { HStack, Icon, IconButton, Text } from 'native-base';
import { FaAngleLeft } from 'react-icons/fa';

export const BackButton = ({ onPress, ...props }) => {
  return (
    <HStack alignItems='center' pb='30px' {...props}>
      <IconButton
        icon={<Icon as={FaAngleLeft} />}
        rounded='full'
        alignSelf='flex-start'
        borderWidth='1px'
        borderColor='gray.500'
        color='gray.500'
        size='24px'
        onPress={onPress}
      />
      <Text ml='6px' color='gray.500'>
        Back
      </Text>
    </HStack>
  );
};
