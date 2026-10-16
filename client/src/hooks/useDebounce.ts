/**
 * useDebounce — Delays propagating a value until the user stops typing.
 * Used to prevent firing a search API call on every keystroke.
 */
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
