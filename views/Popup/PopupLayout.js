import { Box } from 'native-base';

export const Popup = ({ children }) => {
  return (
    <Box w='357px' h='600px' overflowX='hidden'>
      {children}
    </Box>
  );
};
