import { useEffect, useRef } from 'react';

import { useInterval } from '../hooks/useInterval';
import { MESSAGE_TYPES } from '../scripts/helpers/constants';

const TRANSACTION_POLLING_INTERVAL = 10000;
const MAX_INTERVALS = 30;

export default function Offscreen() {
  const messageCount = useRef(0);
  const port = useRef(null);

  useEffect(() => {
    // Open port to background script
    port.current = chrome.runtime.connect({ name: 'keepAlive' });
  }, []);

  useInterval(
    () => {
      if (messageCount.current > MAX_INTERVALS) {
        // Close offscreen window after MAX_INTERVALS messages
        window?.close();
        return;
      }
      messageCount.current += 1;
      const url = new URL(window.location.href);
      const txId = url.searchParams.get('txId');

      port.current?.postMessage({
        message: MESSAGE_TYPES.NOTIFY_TRANSACTION_SUCCESS,
        data: { txId },
      });
    },
    TRANSACTION_POLLING_INTERVAL,
    false
  );

  return <div />;
}
