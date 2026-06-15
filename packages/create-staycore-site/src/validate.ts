import { createPmsClient, type OrgConfig, type Property } from '@staycore/booking-sdk';

export type OrgValidation = {
  config: OrgConfig;
  properties: Property[];
};

/**
 * Pings the public booking engine for the given org slug. Returns the org
 * config + a list of bookable properties. Throws a clear error if the org is
 * unknown, disabled, or unreachable.
 */
export async function validateOrg(orgSlug: string, baseUrl?: string): Promise<OrgValidation> {
  const client = createPmsClient({
    orgSlug,
    baseUrl,
    timeoutMs: 10_000,
  });

  let config: OrgConfig;
  try {
    config = await client.config();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(
      `Cannot reach the Stay'Core booking engine for org "${orgSlug}": ${message}\n` +
        `→ Check that the slug is correct, the org has enabled the public booking engine, ` +
        `and the API base URL is reachable.`,
    );
  }

  let properties: Property[] = [];
  try {
    properties = await client.properties.list();
  } catch {
    // Not fatal — scaffolding can proceed with an empty property list.
  }

  return { config, properties };
}
