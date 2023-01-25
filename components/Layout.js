import { Box } from 'native-base';
import React, { useEffect } from 'react';

import { Header } from './Header/Header';

export const Layout = ({
  withHeader,
  withBackButton,
  backRoute,
  children,
  w,
  width,
  ...props
}) => {
  const xtWidth = w || width || '357px';
  useEffect(() => {
    window?.resizeTo(Number(xtWidth.replace(/[^0-9]/g, '')), 640);
  }, [xtWidth]);
  return (
    <Box
      w={xtWidth}
      h='600px'
      overflowX='hidden'
      bg='white'
      {...props}
      mx='auto'
    >
      {withHeader ? (
        <Header withBackButton={withBackButton} backRoute={backRoute} />
      ) : null}
      {children}
    </Box>
  );
};
