import { Link, Text } from 'native-base';

export const Footer = () => (
  <Text textAlign='center' mt='80px' color='gray.400'>
    Need help using MyDoge?{' '}
    <Link href='https://www.mydoge.com/#faq' target='_blank'>
      <Text color='brandYellow.500' underline fontWeight='medium'>
        Frequently Asked Questions
      </Text>
    </Link>
  </Text>
);
