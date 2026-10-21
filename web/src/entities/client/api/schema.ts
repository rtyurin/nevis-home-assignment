import { z } from 'zod';

const values = z.array(z.number().nonnegative().nullable());
const channel = z.object({ id: z.string(), name: z.string(), values });
const employee = channel.extend({ channels: z.array(channel).optional() });
const branch = channel.extend({ employees: z.array(employee).optional() });
const company = channel.extend({ branches: z.array(branch).optional() });

/** GET /api/clients */
export const clientsResponseSchema = z.object({
  months: z.array(z.string().regex(/^\d{4}-\d{2}$/)).min(1),
  company,
});

export type ClientsResponse = z.infer<typeof clientsResponseSchema>;
