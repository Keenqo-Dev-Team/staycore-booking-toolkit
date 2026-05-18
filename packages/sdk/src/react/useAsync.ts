import { useEffect, useRef, useState } from 'react';

export type AsyncState<T> =
  | { status: 'idle'; data: null; error: null; isLoading: false }
  | { status: 'loading'; data: null; error: null; isLoading: true }
  | { status: 'success'; data: T; error: null; isLoading: false }
  | { status: 'error'; data: null; error: Error; isLoading: false };

const IDLE: AsyncState<never> = { status: 'idle', data: null, error: null, isLoading: false };

/**
 * Tiny async runner with cancellation. Re-fires when `key` changes; pass
 * `null` to skip the fetch (useful when required params are not ready).
 */
export function useAsync<T>(
  factory: () => Promise<T>,
  key: string | null,
): AsyncState<T> & { refresh: () => void } {
  const [state, setState] = useState<AsyncState<T>>(IDLE as AsyncState<T>);
  const tickRef = useRef(0);

  useEffect(() => {
    if (key === null) {
      setState(IDLE as AsyncState<T>);
      return;
    }
    const tick = ++tickRef.current;
    setState({ status: 'loading', data: null, error: null, isLoading: true });

    factory()
      .then((data) => {
        if (tick !== tickRef.current) return;
        setState({ status: 'success', data, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (tick !== tickRef.current) return;
        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          isLoading: false,
        });
      });

    return () => {
      tickRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const refresh = () => {
    tickRef.current++;
    if (key !== null) {
      const tick = tickRef.current;
      setState({ status: 'loading', data: null, error: null, isLoading: true });
      factory()
        .then((data) => {
          if (tick !== tickRef.current) return;
          setState({ status: 'success', data, error: null, isLoading: false });
        })
        .catch((error: unknown) => {
          if (tick !== tickRef.current) return;
          setState({
            status: 'error',
            data: null,
            error: error instanceof Error ? error : new Error(String(error)),
            isLoading: false,
          });
        });
    }
  };

  return { ...state, refresh };
}
