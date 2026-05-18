import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createPmsClient, type StayCoreClient, type StayCoreClientOptions } from '../client.js';

const StayCoreContext = createContext<StayCoreClient | null>(null);

export type StayCoreProviderProps = StayCoreClientOptions & {
  children: ReactNode;
};

export function StayCoreProvider({ children, ...options }: StayCoreProviderProps) {
  const client = useMemo(() => createPmsClient(options), [
    options.orgSlug,
    options.baseUrl,
    options.timeoutMs,
  ]);
  return <StayCoreContext.Provider value={client}>{children}</StayCoreContext.Provider>;
}

export function useStayCore(): StayCoreClient {
  const client = useContext(StayCoreContext);
  if (!client) {
    throw new Error(
      'useStayCore: no <StayCoreProvider> found. Wrap your tree with <StayCoreProvider orgSlug="..." />.',
    );
  }
  return client;
}
