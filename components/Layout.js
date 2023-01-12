import { Box } from 'native-base';
import React from 'react';

import { Header } from './Header/Header';

export const Layout = ({
  withHeader,
  withBackButton,
  backRoute,
  children,
  ...props
}) => {
  return (
    <Box w='357px' h='600px' overflowX='hidden' bg='white' {...props}>
      {withHeader ? (
        <Header withBackButton={withBackButton} backRoute={backRoute} />
      ) : null}
      {children}
    </Box>
  );
};
