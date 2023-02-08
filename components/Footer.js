import { Text } from 'native-base';
import { useCallback } from 'react';

export const Footer = ({ ...props }) => {
  const onClickFAQ = useCallback(() => {
    if (chrome?.tabs) {
      chrome.tabs.create({ url: 'https://www.mydoge.com/#faq' });
    } else {
      window.open('https://www.mydoge.com/#faq', '_blank');
    }
  }, []);

  return (
    <Text textAlign='center' mt='80px' color='gray.400' {...props}>
      Need help using MyDoge?{'\n'}
      <Text
        color='brandYellow.500'
        underline
        fontWeight='medium'
        onClickFAQ
        onPress={onClickFAQ}
      >
        Frequently Asked Questions
      </Text>
    </Text>
  );
};
