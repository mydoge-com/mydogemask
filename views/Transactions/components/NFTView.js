import { Center, Spinner } from 'native-base';
import { Fragment, useMemo, useState } from 'react';
import MIMEType from 'whatwg-mimetype';

export const NFTView = ({ nft = {} }) => {
  const { content, contentType } = nft;
  const [nftLoaded, setNFTLoaded] = useState(false);

  const mimeType = useMemo(() => {
    let mime;
    try {
      mime = new MIMEType(contentType);
    } catch (e) {
      mime = null;
    }
    return mime;
  }, [contentType]);

  if (!mimeType) {
    return null;
  }

  if (mimeType.type === 'image') {
    return <img src={content} width='100%' height='auto' alt='NFT' />;
  }
  if (mimeType.type === 'text') {
    return (
      <>
        {!nftLoaded && (
          <Center position='absolute' width='100%' height='100%' zIndex={-1}>
            <Spinner color='amber.400' />
          </Center>
        )}
        <iframe
          title='NFT'
          src={content}
          width='100%'
          height='auto'
          sandbox='allow-same-origin allow-scripts'
          allow
          scrolling='no'
          style={{ pointerEvents: 'none', border: 'none', overflow: 'hidden' }}
          onLoad={() => setNFTLoaded(true)}
        />
      </>
    );
  }
  return (
    <img src='./assets/default-nft.webp' width='100%' height='auto' alt='NFT' />
  );
};
