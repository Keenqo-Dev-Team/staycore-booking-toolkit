export const SDK_VERSION = '0.0.0';

export type StayCoreClientOptions = {
  orgSlug: string;
  baseUrl?: string;
};

export function createPmsClient(_options: StayCoreClientOptions): { orgSlug: string } {
  return { orgSlug: _options.orgSlug };
}
