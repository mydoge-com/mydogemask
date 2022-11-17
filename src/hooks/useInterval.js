// https://overreacted.io/making-setinterval-declarative-with-react-hooks/

import { useEffect, useRef, useState } from 'react';

/**
 * Wrapper for setInterval
 * @param {function} callback triggered continuously based on delay
 * @param {number|null} delay in milliseconds, null pauses/stops the interval
 * @param {boolean} tickAtStart fire the callback once immediately
 */
export function useInterval(callback, delay, tickAtStart) {
  const savedCallback = useRef();
  const [hasTickedAtStart, setHasTickedAtStart] = useState(false);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  });

  // Set up the interval
  useEffect(() => {
    function tick() {
      if (typeof savedCallback.current === 'function') {
        savedCallback.current();
      }
    }
    // Passing null as delay = pause
    if (delay !== null) {
      const id = setInterval(tick, delay);
      if (tickAtStart && !hasTickedAtStart) {
        setHasTickedAtStart(true);
        tick();
      }
      return () => clearInterval(id);
    }
  }, [delay, hasTickedAtStart, tickAtStart]);
}

// Example:

/* function Counter() {
  const [delay, setDelay] = useState(1000);
  const [count, setCount] = useState(0);

  // Basic interval: update the counter every <delay>ms
  useInterval(() => {
    setCount(count + 1);
  }, delay);

  // Another interval that makes the first one go faster every second
  useInterval(() => {
    if (delay > 10) {
      setDelay(delay / 2);
    }
  }, 1000);

  function handleReset() {
    setDelay(1000);
  }

  return (
    <>
      <h1>Counter: {count}</h1>
      <h4>Delay: {delay}</h4>
      <button onClick={handleReset}>
        Reset delay
      </button>
    </>
  );
} */
