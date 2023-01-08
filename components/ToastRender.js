import { Alert, HStack, Text } from 'native-base';

export const ToastRender = ({ title, description, status }) => (
  <Alert status={status} w='100%' alignItems='flex-start'>
    <HStack flexShrink={1} space={2} justifyContent='space-between' pb='4px'>
      <Alert.Icon mt='1' />
      {title ? (
        <Text fontWeight='bold'>{title}</Text>
      ) : (
        <Text>{description}</Text>
      )}
    </HStack>
    {title ? (
      <Text fontSize='12px' color='coolGray.800'>
        {description}
      </Text>
    ) : null}
  </Alert>
);
