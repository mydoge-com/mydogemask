import { Box } from 'native-base';
import React from 'react';

import { Header } from './Header/Header';

export const Layout = ({ withHeader, children, ...props }) => {
  return (
    <Box w='357px' h='600px' overflowX='hidden' bg='white' {...props}>
      {withHeader ? <Header /> : null}
      {children}
    </Box>
  );
};
