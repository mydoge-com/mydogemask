import { useCallback, useState } from 'react';

import { logError } from '../utils/error';

export const useCopyText = ({ text, onCopy }) => {
  const [textCopied, setTextCopied] = useState(false);
  const copyTextToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setTextCopied(true);
      onCopy?.();
      setTimeout(() => setTextCopied(false), 3000);
    } catch (e) {
      logError(e);
    }
  }, [onCopy, text]);
  return { copyTextToClipboard, textCopied };
};
