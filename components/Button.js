import { Button, Text } from 'native-base';
import React from 'react';

const styleVariants = {
  primary: {
    button: {
      background: 'brandYellow.500',
      _hover: {
        background: 'brandYellow.600',
      },
    },
    text: {
      color: 'black',
    },
  },
  secondary: {
    button: {
      background: 'gray.600',
      _hover: {
        background: 'gray.700',
      },
    },
    text: {
      color: 'white',
    },
  },
};

export const BigButton = ({
  isDisabled = false,
  loading = false,
  onPress,
  textColor,
  variant = 'primary',
  children,
  ...props
}) => {
  const buttonStyles = styleVariants[variant].button;
  const textStyles = styleVariants[variant].text;

  return (
    <Button
      isDisabled={isDisabled || loading}
      onPress={onPress}
      rounded='full'
      px='60px'
      size='md'
      alignSelf='center'
      {...buttonStyles}
      {...props}
    >
      <Text fontWeight='semibold' fontSize='16px' {...textStyles}>
        {children}
      </Text>
    </Button>
  );
};
