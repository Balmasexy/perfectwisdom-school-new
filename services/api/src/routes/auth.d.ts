import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
type AuthUser = {
    sub: string;
    email: string;
    role: string;
};
export declare function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null>;
export declare function requireRoles(...roles: string[]): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
export declare function authRoutes(app: FastifyInstance): Promise<void>;
export {};
//# sourceMappingURL=auth.d.ts.map