import { Box } from 'native-base';

export const PopupLayout = ({ children, ...props }) => {
  return (
    <Box w='357px' h='600px' overflowX='hidden' bg='white' p='20px' {...props}>
      {children}
    </Box>
  );
};
