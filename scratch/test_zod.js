const { z } = require('zod');

const schema = z.object({
  name: z.string().min(5)
});

const result = schema.safeParse({ name: 'abc' });
console.log('Success:', result.success);
if (!result.success) {
  console.log('Error object keys:', Object.keys(result.error));
  console.log('Error issues exists:', !!result.error.issues);
  console.log('Error errors exists:', !!result.error.errors);
  console.log('Error issues:', result.error.issues);
}
