import React from 'react';
import { HStack, Text } from 'native-base';
import { FiArrowLeft } from 'react-icons/fi';

const HeaderWithBackButton = ({ title, onBackPress }) => {
  return (
    <HStack onClick={onBackPress}>
      <HStack style={{ flex: '1 1 0%' }} alignItems="center">
        <FiArrowLeft size="22" color='rgb(23, 23, 23)' />
        <Text>{'Back'}</Text>
      </HStack>
      <Text textAlign="center" fontWeight='bold'>
        {title}
      </Text>
      <HStack style={{ flex: '1 1 0%' }}></HStack>
    </HStack>
  );
};

export default HeaderWithBackButton;
