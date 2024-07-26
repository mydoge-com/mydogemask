import { useCallback } from 'react';

export const useLinks = () => {
  const onLinkClick = useCallback((url) => {
    if (chrome?.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  }, []);

  return { onLinkClick };
};
