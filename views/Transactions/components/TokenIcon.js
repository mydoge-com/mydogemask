import { Avatar } from 'native-base';
import { useEffect, useState } from 'react';

import {
  DOGGY_ICON_URL,
  DRC20_ICON_URL,
  DUNES_ICON_URL,
} from '../../../scripts/helpers/constants';

const getImageUrl = (ticker, index) => {
  const imageUrls = [
    `${DOGGY_ICON_URL}/${ticker}.png`,
    `${DOGGY_ICON_URL}/${ticker}.jpg`,
    `${DRC20_ICON_URL}/${ticker}.png`,
  ];
  return imageUrls[index];
};

export const TokenIcon = ({ ticker, protocol, ...props }) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        await new Promise((resolve, reject) => {
          const img = new window.Image();
          img.src = getImageUrl(ticker, currentUrlIndex);

          img.onload = () => {
            resolve();
          };

          img.onerror = () => {
            reject();
          };
        });
      } catch (e) {
        if (currentUrlIndex < 2) {
          setCurrentUrlIndex((prev) => prev + 1);
        }
      }
    })();
  }, [currentUrlIndex, ticker]);

  return (
    <Avatar
      source={{
        uri: getImageUrl(ticker, currentUrlIndex),
      }}
      {...props}
    >
      {ticker?.substring(0, 2).toUpperCase()}
    </Avatar>
  );
};
