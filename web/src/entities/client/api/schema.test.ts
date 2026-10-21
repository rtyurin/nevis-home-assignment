import { describe, expect, it } from 'vitest';
import { clientsResponse } from '@/test/fixtures';
import { clientsResponseSchema } from './schema';

describe('clientsResponseSchema', () => {
  it('accepts the payload the API serves', () => {
    expect(clientsResponseSchema.safeParse(clientsResponse).success).toBe(true);
  });

  it('rejects a level it does not know, instead of dropping it', () => {
    const withRegions = { ...clientsResponse, company: { ...clientsResponse.company, regions: [] } };
    const result = clientsResponseSchema.safeParse(withRegions);

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([expect.objectContaining({ code: 'unrecognized_keys', keys: ['regions'] })]);
  });
});
