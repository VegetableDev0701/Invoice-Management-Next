import { RefObject, useEffect, useState } from 'react';

export default function useMutationObserver(ref: RefObject<HTMLInputElement>) {
  // Mutation Observer setup
  const [mutatedState, setMutatedState] = useState<string | null>(null);
  useEffect(() => {
    if (ref.current) {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'value'
          ) {
            const newValue = ref.current!.value;
            setMutatedState(newValue);
          }
        }
      });
      observer.observe(ref.current, { attributes: true });
      return () => observer.disconnect(); // Clean up the observer
    }
  }, []);

  return mutatedState;
}
