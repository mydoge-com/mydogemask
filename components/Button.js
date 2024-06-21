import { Button, HStack, Spinner, Text } from 'native-base';

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
  danger: {
    button: {
      background: 'danger.600',
      _hover: {
        background: 'danger.700',
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
      <HStack space='8px'>
        {loading ? <Spinner color='amber.600' /> : null}
        <Text fontWeight='semibold' fontSize='16px' {...textStyles}>
          {children}
        </Text>
      </HStack>
    </Button>
  );
};
