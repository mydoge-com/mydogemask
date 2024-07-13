import { useCallback, useEffect, useState } from 'react';

import {
  INSCRIPTION_TXS_CACHE,
  TRANSACTION_PENDING_TIME,
} from '../scripts/helpers/constants';
import { getLocalValue } from '../scripts/helpers/storage';

/**
 * Custom hook to fetch cached inscription transactions.
 *
 * @param {Object} [options={}] - Configuration options for the hook.
 * @param {boolean} [options.filterPending=true] - If true, filters pending transactions based on their timestamp.
 * @returns {Array} An array of cached inscription transactions.
 *
 * @example
 * const cachedTxs = useCachedInscriptionTxs({ filterPending: false });
 */

export function useCachedInscriptionTxs({ filterPending = true } = {}) {
  const [cachedTxs, setCachedTxs] = useState([]);

  const fetchCachedTxs = useCallback(async () => {
    const transactionsCache = await getLocalValue(INSCRIPTION_TXS_CACHE);

    if (transactionsCache?.length) {
      if (!filterPending) {
        setCachedTxs(transactionsCache);
        return;
      }
      const pendingInscriptions = transactionsCache.filter(
        (tx) => tx.timestamp + TRANSACTION_PENDING_TIME > Date.now()
      );
      if (pendingInscriptions.length > 0) {
        setCachedTxs(pendingInscriptions);
      }
    }
  }, [filterPending]);

  useEffect(() => {
    fetchCachedTxs();
  }, [fetchCachedTxs]);

  return cachedTxs;
}
