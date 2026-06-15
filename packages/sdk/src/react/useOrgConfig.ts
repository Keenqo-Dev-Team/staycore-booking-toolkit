import { useStayCore } from './provider.js';
import { useAsync } from './useAsync.js';
import type { OrgConfig } from '../types.js';

export function useOrgConfig() {
  const client = useStayCore();
  return useAsync<OrgConfig>(() => client.config(), `config:${client.orgSlug}`);
}
