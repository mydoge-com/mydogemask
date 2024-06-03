import { Box, Image } from 'native-base';
import React, { useEffect } from 'react';

import { Header } from './Header/Header';

const BGPattern = 'assets/bg-pattern.png';

export const Layout = ({
  addressColor,
  withHeader,
  withCancelButton,
  cancelRoute,
  children,
  w,
  width,
  withConnectStatus,
  ...props
}) => {
  const xtWidth = w || width || '357px';
  useEffect(() => {
    document.body.style.width = xtWidth;
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
        <Header
          withCancelButton={withCancelButton}
          cancelRoute={cancelRoute}
          addressColor={addressColor}
          withConnectStatus={withConnectStatus}
        />
      ) : null}
      {children}

      <Image
        source={BGPattern}
        position='fixed'
        top='0px'
        left='0px'
        zIndex={-100}
        resizeMode='cover'
        width={xtWidth}
        height='600px'
        opacity={0.7}
        pointerEvents='none'
        alt='Background pattern'
      />
    </Box>
  );
};
