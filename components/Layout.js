import { Box } from 'native-base';
import React from 'react';

import { Header } from './Header/Header';

export const Layout = ({
  withHeader,
  withBackButton,
  backRoute,
  onBack,
  children,
  ...props
}) => {
  return (
    <Box
      w='357px'
      h='600px'
      overflowX='hidden'
      bg='white'
      {...props}
      mx='auto'
      shadow='2'
    >
      {withHeader ? (
        <Header
          withBackButton={withBackButton}
          backRoute={backRoute}
          onBack={onBack}
        />
      ) : null}
      {children}
    </Box>
  );
};
