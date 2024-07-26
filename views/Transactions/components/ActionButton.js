import { HStack, Image, Pressable, Text, VStack } from 'native-base';

export const ActionButton = ({ icon, onPress, label, ...props }) => {
  return (
    <VStack alignItems='center' space='8px'>
      <Pressable onPress={onPress} {...props}>
        <HStack
          height='50px'
          width='50px'
          bg='gray.100'
          alignItems='center'
          justifyContent='center'
          borderRadius='18px'
        >
          <Image src={icon} width='24px' height='24px' alt={label} />
        </HStack>
      </Pressable>
      <Text fontSize={13} fontWeight='500'>
        {label}
      </Text>
    </VStack>
  );
};
