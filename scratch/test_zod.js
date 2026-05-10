const { z } = require('zod');

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  role: z.string().optional(),
  isLocked: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  search: z.string().optional(),
  unassigned: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
});

console.log('Test 1 (empty):', paginationSchema.safeParse({}));
console.log('Test 2 (limit 50):', paginationSchema.safeParse({ limit: '50' }));
console.log('Test 3 (extra key):', paginationSchema.safeParse({ something: 'else' }));
