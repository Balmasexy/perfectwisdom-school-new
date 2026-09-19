import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { branches } from '../db/schema.js';
import { requireRoles } from './auth.js';
export async function branchRoutes(app) {
    app.get('/branches', { preHandler: requireRoles('ADMIN') }, async () => {
        return db.select().from(branches);
    });
    app.get('/branches/:id', { preHandler: requireRoles('ADMIN') }, async (request, reply) => {
        const { id } = request.params;
        const [branch] = await db
            .select()
            .from(branches)
            .where(eq(branches.id, id));
        if (!branch) {
            return reply.code(404).send({
                error: 'Branch not found',
            });
        }
        return branch;
    });
    app.post('/branches', { preHandler: requireRoles('ADMIN') }, async (request, reply) => {
        const body = request.body;
        if (!body.name || !body.code || !body.address || !body.phoneNumber) {
            return reply.code(400).send({
                error: 'Branch name, code, address and phone number are required',
            });
        }
        const [created] = await db
            .insert(branches)
            .values({
            name: body.name.trim(),
            code: body.code.trim().toUpperCase(),
            address: body.address.trim(),
            phoneNumber: body.phoneNumber.trim(),
        })
            .returning();
        return reply.code(201).send(created);
    });
}
//# sourceMappingURL=branches.js.map