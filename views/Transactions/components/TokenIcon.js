import { Avatar } from 'native-base';
import { useState, useEffect } from 'react';

import {
  DOGGY_ICON_URL,
  DRC20_ICON_URL,
  DUNES_ICON_URL,
} from '../../../scripts/helpers/constants';

export const TokenIcon = ({ ticker, protocol, ...props }) => {
  const imageUrls = [
    `${DOGGY_ICON_URL}/${ticker}.png`,
    `${DOGGY_ICON_URL}/${ticker}.jpg`,
    `${DRC20_ICON_URL}/${ticker}.png`,
  ];

  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        await new Promise((resolve, reject) => {
          const img = new window.Image();
          img.src = imageUrls[currentUrlIndex];

          img.onload = () => {
            resolve();
          };

          img.onerror = () => {
            reject();
          };
        });
      } catch (e) {
        if (currentUrlIndex < imageUrls.length - 1) {
          setCurrentUrlIndex((prev) => prev + 1);
        }
      }
    })();
  }, [currentUrlIndex]);

  return (
    <Avatar
      source={{
        uri: imageUrls[currentUrlIndex],
      }}
      {...props}
    >
      {ticker?.substring(0, 2).toUpperCase()}
    </Avatar>
  );
};
