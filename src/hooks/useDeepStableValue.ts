import { useRef } from 'react';

export function useDeepStableValue<T>(value: T): T {
  const reference = useRef(value);
  const previous = reference.current;
  const unchangedArray = Array.isArray(previous) && Array.isArray(value)
    && previous.length === value.length
    && previous.every((item, index) => Object.is(item, value[index]));

  if (!Object.is(previous, value) && !unchangedArray) reference.current = value;
  return reference.current;
}
