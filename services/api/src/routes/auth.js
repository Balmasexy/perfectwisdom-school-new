import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
export async function requireAuth(request, reply) {
    try {
        await request.jwtVerify();
        return request.user;
    }
    catch {
        await reply.code(401).send({ error: 'Authentication required' });
        return null;
    }
}
export function requireRoles(...roles) {
    return async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user)
            return;
        if (!roles.includes(user.role)) {
            return reply.code(403).send({ error: 'You do not have permission for this action' });
        }
    };
}
export async function authRoutes(app) {
    app.post('/auth/login', async (request, reply) => {
        const body = request.body;
        const email = body.email?.trim().toLowerCase();
        if (!email || !body.password)
            return reply.code(400).send({ error: 'Email and password are required' });
        if (body.role && !['ADMIN', 'STAFF', 'PARENT'].includes(body.role)) {
            return reply.code(400).send({ error: 'Invalid account type' });
        }
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
            return reply.code(401).send({ error: 'Invalid email or password' });
        }
        if (user.status !== 'ACTIVE')
            return reply.code(403).send({ error: 'This account is not active' });
        if (body.role && user.role !== body.role) {
            return reply.code(403).send({
                error: `This account is registered as ${user.role.toLowerCase()}, not ${body.role.toLowerCase()}`,
            });
        }
        const token = await app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
        return {
            token,
            user: { id: user.id, email: user.email, role: user.role, status: user.status },
        };
    });
    app.get('/auth/me', async (request, reply) => {
        const authUser = await requireAuth(request, reply);
        if (!authUser)
            return;
        const [user] = await db.select({ id: users.id, email: users.email, role: users.role, status: users.status })
            .from(users).where(eq(users.id, authUser.sub));
        if (!user || user.status !== 'ACTIVE')
            return reply.code(401).send({ error: 'Authentication required' });
        return { user };
    });
}
//# sourceMappingURL=auth.js.map