import { Center, Spinner } from 'native-base';
import { memo, useEffect, useRef, useState } from 'react';

const MAX_RETRIES = 2;

export const NFTViewComponent = ({ nft = {} }) => {
  const iframeRef = useRef(null);
  const retryCount = useRef(0);

  const {preview} = nft;
  const [nftLoaded, setNFTLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!iframeRef.current) {
      return;
    }
    const iframe = iframeRef.current;
    iframe.onload = () => {
      setNFTLoaded(true);
      retryCount.current = 0;
    };

    iframe.onerror = () => {
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        setTimeout(() => {
          iframe.src = preview;
        }, 200);
      } else {
        setLoadFailed(true); // Mark load as failed after max retries
      }
    };
  }, [preview]);


  if (loadFailed) {
    return (
        <img src='./assets/default-nft.webp' width='100%' height='auto' alt='NFT' />
    );
  }

  return (
    <>
      {!nftLoaded && (
        <Center position='absolute' width='100%' height='100%' zIndex={-1}>
          <Spinner color='amber.400' />
        </Center>
      )}
      <iframe
        key={preview}
        ref={iframeRef}
        title='NFT'
        src={preview}
        width='100%'
        height='auto'
        sandbox='allow-same-origin allow-scripts'
        allow
        scrolling='no'
        style={{
          pointerEvents: 'none',
          border: 'none',
          overflow: 'hidden',
          opacity: nftLoaded ? 1 : 0,
        }}
      />
    </>
  );

};

export const NFTView = memo(
  NFTViewComponent,
  (prev, next) => prev.nft.output === next.nft.output
);
