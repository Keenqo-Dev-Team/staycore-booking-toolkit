import { useStayCore } from './provider.js';
import { useAsync } from './useAsync.js';
import type { Property } from '../types.js';

export function useProperties() {
  const client = useStayCore();
  return useAsync<Property[]>(() => client.properties.list(), `properties:${client.orgSlug}`);
}
