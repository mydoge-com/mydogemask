import { Link, Text } from 'native-base';
import React from 'react';

export const Footer = ({ ...props }) => (
  <Text textAlign='center' mt='80px' color='gray.400' {...props}>
    Need help using MyDoge?{' '}
    <Link href='https://www.mydoge.com/#faq' target='_blank'>
      <Text color='brandYellow.500' underline fontWeight='medium'>
        Frequently Asked Questions
      </Text>
    </Link>
  </Text>
);
