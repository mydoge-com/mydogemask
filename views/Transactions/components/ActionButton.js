import { Center, Text, VStack } from 'native-base';
import { cloneElement } from 'react';

export const ActionButton = ({ Icon, title }) => {
  return (
    <VStack alignItems='center'>
      <Center
        width='40px'
        height='40px'
        rounded='12px'
        bg='rgb(45,47,49)'
        _light={{ bg: 'rgb(55,58,60)' }}
        shadow={1}
      >
        {cloneElement(Icon, {
          size: 20,
          color: 'rgb(243,203,83)',
        })}
      </Center>
      <Text
        fontSize='13px'
        fontWeight='semibold'
        color='white'
        mt='4px'
        shadow={1}
      >
        {title}
      </Text>
    </VStack>
  );
};
