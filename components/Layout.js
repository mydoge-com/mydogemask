import React from 'react';

export const Layout = ({ children, ...props }) => {
  return (
    <>
      {React.cloneElement(children, {
        w: '357px',
        h: '600px',
        overflowX: 'hidden',
        bg: 'white',
        p: '20px',
        ...props,
      })}
    </>
  );
};
