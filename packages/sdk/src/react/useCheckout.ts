import { useCallback, useState } from 'react';
import { useStayCore } from './provider.js';
import type { CheckoutRequest, CheckoutResponse } from '../types.js';
import type { AsyncState } from './useAsync.js';

const IDLE: AsyncState<CheckoutResponse> = {
  status: 'idle',
  data: null,
  error: null,
  isLoading: false,
};

/**
 * Mutation hook for the checkout endpoint. Returns `{ submit, ...state }`.
 */
export function useCheckout(): AsyncState<CheckoutResponse> & {
  submit: (payload: CheckoutRequest) => Promise<CheckoutResponse>;
  reset: () => void;
} {
  const client = useStayCore();
  const [state, setState] = useState<AsyncState<CheckoutResponse>>(IDLE);

  const submit = useCallback(
    async (payload: CheckoutRequest) => {
      setState({ status: 'loading', data: null, error: null, isLoading: true });
      try {
        const data = await client.checkout.create(payload);
        setState({ status: 'success', data, error: null, isLoading: false });
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ status: 'error', data: null, error: err, isLoading: false });
        throw err;
      }
    },
    [client],
  );

  const reset = useCallback(() => setState(IDLE), []);

  return { ...state, submit, reset };
}
