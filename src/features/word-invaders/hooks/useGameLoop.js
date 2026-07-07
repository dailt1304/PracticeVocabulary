import { useEffect, useRef } from 'react';

/**
 * Custom hook that runs a game loop using requestAnimationFrame.
 * Provides deltaTime (in seconds) for frame-rate independent movement.
 *
 * @param {function} callback - Called every frame with (deltaTime) in seconds
 * @param {boolean} isRunning - Whether the loop should be active
 */
const useGameLoop = (callback, isRunning) => {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const callbackRef = useRef(callback);

  // Keep callback ref up to date without restarting the loop
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isRunning) {
      previousTimeRef.current = undefined;
      return;
    }

    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = (time - previousTimeRef.current) / 1000; // Convert ms to seconds
        // Cap deltaTime to prevent huge jumps (e.g. when tab is inactive)
        const clampedDelta = Math.min(deltaTime, 0.1);
        callbackRef.current(clampedDelta);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning]);
};

export default useGameLoop;
