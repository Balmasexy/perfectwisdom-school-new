import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
dotenv.config();
const app = Fastify({
    logger: true,
});
await app.register(cors, {
    origin: true,
    credentials: true,
});
await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'change-this-secret-before-production',
});
app.get('/health', async () => {
    return {
        status: 'ok',
        service: 'perfect-wisdom-school-api',
        timestamp: new Date().toISOString(),
    };
});
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';
try {
    await app.listen({ port, host });
}
catch (error) {
    app.log.error(error);
    process.exit(1);
}
//# sourceMappingURL=server.js.map