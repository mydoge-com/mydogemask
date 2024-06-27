import { QUERY_CACHE } from '../scripts/helpers/constants';

export function cacheProvider() {
  // When initializing, we restore the data from `localStorage` into a map.
  const map = new Map(JSON.parse(localStorage.getItem(QUERY_CACHE) || '[]'));

  // Before unloading the app, we write back all the data into `localStorage`.
  window.addEventListener('beforeunload', () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem(QUERY_CACHE, appCache);
  });

  // We still use the map for write & read for performance.
  return map;
}
