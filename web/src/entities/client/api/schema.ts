import { z } from 'zod/mini';

const values = z.array(z.nullable(z.number().check(z.nonnegative())));
const channel = z.object({ id: z.string(), name: z.string(), values });
const employee = z.extend(channel, { avatarUrl: z.optional(z.string()), channels: z.optional(z.array(channel)) });
const branch = z.extend(channel, { employees: z.optional(z.array(employee)) });
const company = z.extend(channel, { branches: z.optional(z.array(branch)) });

/** GET /api/clients */
export const clientsResponseSchema = z.object({
  months: z.array(z.string().check(z.regex(/^\d{4}-\d{2}$/))).check(z.minLength(1)),
  company,
});

export type ClientsResponse = z.infer<typeof clientsResponseSchema>;
