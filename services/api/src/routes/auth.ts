import bcrypt from 'bcryptjs'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { OAuth2Client } from 'google-auth-library'
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '../db/client.js'
import {
  authChallenges,
  googleIdentities,
  passkeys,
  users,
} from '../db/schema.js'

type LoginRole = 'ADMIN' | 'STAFF' | 'PARENT'
type AuthUser = { sub: string; email: string; role: string }

const googleClient = new OAuth2Client()

function env(name: string): string {
  return process.env[name]?.trim() || ''
}

function allowedGoogleOrigins(): string[] {
  return env('GOOGLE_ALLOWED_ORIGINS')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function getRequestOrigin(request: FastifyRequest): string | null {
  const origin = request.headers.origin
  return typeof origin === 'string' && origin.trim() ? origin.trim() : null
}

function base64urlFromBytes(value: Uint8Array): string {
  return Buffer.from(value).toString('base64url')
}

function bytesFromBase64url(value: string): Uint8Array<ArrayBuffer> {
  const buffer = Buffer.from(value, 'base64url')
  return Uint8Array.from(buffer)
}

async function createChallenge(
  challenge: string,
  type: 'registration' | 'authentication',
  userId?: string,
) {
  await db
    .delete(authChallenges)
    .where(
      and(
        eq(authChallenges.challengeType, type),
        // Expired challenges are removed below by the timestamp condition.
      ),
    )

  await db.insert(authChallenges).values({
    challenge,
    challengeType: type,
    userId: userId || null,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  })
}

async function consumeChallenge(
  challenge: string,
  type: 'registration' | 'authentication',
) {
  const [record] = await db
    .select()
    .from(authChallenges)
    .where(
      and(
        eq(authChallenges.challenge, challenge),
        eq(authChallenges.challengeType, type),
        gt(authChallenges.expiresAt, new Date()),
      ),
    )

  if (!record) return null

  await db.delete(authChallenges).where(eq(authChallenges.id, record.id))

  return record
}

async function issueToken(
  app: FastifyInstance,
  user: typeof users.$inferSelect,
) {
  return app.jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  })
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.jwtVerify()
    return request.user as AuthUser
  } catch {
    await reply.code(401).send({ error: 'Authentication required' })
    return null
  }
}

export function requireRoles(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireAuth(request, reply)
    if (!user) return

    if (!roles.includes(user.role)) {
      return reply
        .code(403)
        .send({ error: 'You do not have permission for this action' })
    }
  }
}

export async function authRoutes(app: FastifyInstance) {
  /*
   * PASSWORD LOGIN
   */
  app.post('/auth/login', async (request, reply) => {
    const body = request.body as {
      email?: string
      password?: string
      role?: LoginRole
    }

    const email = body.email?.trim().toLowerCase()

    if (!email || !body.password) {
      return reply
        .code(400)
        .send({ error: 'Email and password are required' })
    }

    if (
      body.role &&
      !['ADMIN', 'STAFF', 'PARENT'].includes(body.role)
    ) {
      return reply.code(400).send({ error: 'Invalid account type' })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))

    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Invalid email or password' })
    }

    if (user.status !== 'ACTIVE') {
      return reply.code(403).send({ error: 'This account is not active' })
    }

    if (body.role && user.role !== body.role) {
      return reply.code(403).send({
        error: `This account is registered as ${user.role.toLowerCase()}, not ${body.role.toLowerCase()}`,
      })
    }

    const token = await issueToken(app, user)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    }
  })

  /*
   * GOOGLE CONFIG
   */
  app.get('/auth/google/config', async (_request, reply) => {
    const clientId = env('GOOGLE_CLIENT_ID')

    if (!clientId) {
      return reply
        .code(503)
        .send({ error: 'Google authentication is not configured' })
    }

    return { client_id: clientId }
  })

  /*
   * GOOGLE LOGIN
   */
  app.post('/auth/google', async (request, reply) => {
    const body = request.body as {
      credential?: string
      client_id?: string
      nonce?: string
    }

    const clientId = env('GOOGLE_CLIENT_ID')
    const allowedOrigins = allowedGoogleOrigins()
    const requestOrigin = getRequestOrigin(request)

    if (!clientId) {
      return reply
        .code(503)
        .send({ error: 'Google authentication is not configured' })
    }

    if (!body.credential) {
      return reply.code(400).send({ error: 'Google credential is required' })
    }

    if (body.client_id && body.client_id !== clientId) {
      return reply.code(401).send({ error: 'Invalid Google client' })
    }

    if (
      requestOrigin &&
      allowedOrigins.length > 0 &&
      !allowedOrigins.includes(requestOrigin)
    ) {
      return reply.code(403).send({ error: 'Google origin is not allowed' })
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: body.credential,
        audience: clientId,
      })

      const payload = ticket.getPayload()

      if (!payload) {
        return reply.code(401).send({ error: 'Invalid Google credential' })
      }

      if (
        payload.iss !== 'accounts.google.com' &&
        payload.iss !== 'https://accounts.google.com'
      ) {
        return reply.code(401).send({ error: 'Invalid Google issuer' })
      }

      if (!payload.sub || !payload.email || payload.email_verified !== true) {
        return reply
          .code(401)
          .send({ error: 'Google account email is not verified' })
      }

      if (body.nonce && payload.nonce && body.nonce !== payload.nonce) {
        return reply.code(401).send({ error: 'Invalid Google nonce' })
      }

      const googleSub = payload.sub
      const email = payload.email.toLowerCase()

      const [existingIdentity] = await db
        .select()
        .from(googleIdentities)
        .where(eq(googleIdentities.googleSub, googleSub))

      let user

      if (existingIdentity) {
        const [linkedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, existingIdentity.userId))

        user = linkedUser
      } else {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))

        if (!existingUser) {
          return reply.code(403).send({
            error:
              'This Google account is not registered in Perfect Wisdom School.',
          })
        }

        if (existingUser.status !== 'ACTIVE') {
          return reply
            .code(403)
            .send({ error: 'This account is not active' })
        }

        await db.insert(googleIdentities).values({
          userId: existingUser.id,
          googleSub,
          email,
        })

        user = existingUser
      }

      if (!user || user.status !== 'ACTIVE') {
        return reply.code(403).send({ error: 'This account is not active' })
      }

      const token = await issueToken(app, user)

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      }
    } catch (error) {
      request.log.error(error, 'Google authentication failed')
      return reply.code(401).send({ error: 'Google authentication failed' })
    }
  })

  /*
   * PASSKEY REGISTRATION OPTIONS
   *
   * User must already be logged in before registering a passkey.
   */
  app.post('/auth/passkey/register/options', async (request, reply) => {
    const authUser = await requireAuth(request, reply)
    if (!authUser) return

    const rpName = env('WEBAUTHN_RP_NAME') || 'Perfect Wisdom School'
    const rpID = env('WEBAUTHN_RP_ID')
    const origin = env('WEBAUTHN_ORIGIN')

    if (!rpID || !origin) {
      return reply
        .code(503)
        .send({ error: 'Passkey authentication is not configured' })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.sub))

    if (!user || user.status !== 'ACTIVE') {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    const existingPasskeys = await db
      .select()
      .from(passkeys)
      .where(eq(passkeys.userId, user.id))

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Uint8Array.from(Buffer.from(user.id)),
      userName: user.email,
      userDisplayName: user.email,
      attestationType: 'none',
      excludeCredentials: existingPasskeys.map((credential) => ({
        id: credential.credentialId,
        transports: credential.transports
          ? JSON.parse(credential.transports)
          : undefined,
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    })

    await createChallenge(options.challenge, 'registration', user.id)

    return options
  })

  /*
   * PASSKEY REGISTRATION VERIFY
   */
  app.post('/auth/passkey/register/verify', async (request, reply) => {
    const authUser = await requireAuth(request, reply)
    if (!authUser) return

    const body = request.body as {
      credential?: Parameters<typeof verifyRegistrationResponse>[0]['response']
      challenge?: string
    }

    if (!body.credential || !body.challenge) {
      return reply
        .code(400)
        .send({ error: 'Passkey credential and challenge are required' })
    }

    const challenge = await consumeChallenge(
      body.challenge,
      'registration',
    )

    if (!challenge || challenge.userId !== authUser.sub) {
      return reply.code(401).send({ error: 'Invalid or expired challenge' })
    }

    const rpID = env('WEBAUTHN_RP_ID')
    const origin = env('WEBAUTHN_ORIGIN')

    try {
      const verification = await verifyRegistrationResponse({
        response: body.credential,
        expectedChallenge: body.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      })

      if (!verification.verified || !verification.registrationInfo) {
        return reply.code(400).send({ error: 'Passkey registration failed' })
      }

      const registrationInfo = verification.registrationInfo

      const credentialId = registrationInfo.credential.id
      const publicKey = base64urlFromBytes(registrationInfo.credential.publicKey)

      await db.insert(passkeys).values({
        userId: authUser.sub,
        credentialId,
        publicKey,
        counter: Number(registrationInfo.credential.counter),
        transports: body.credential.response.transports
          ? JSON.stringify(body.credential.response.transports)
          : null,
      })

      return {
        success: true,
        message: 'Fingerprint / Face passkey registered successfully',
      }
    } catch (error) {
      request.log.error(error, 'Passkey registration failed')
      return reply.code(400).send({ error: 'Passkey registration failed' })
    }
  })

  /*
   * PASSKEY LOGIN OPTIONS
   */
  app.post('/auth/passkey/login/options', async (_request, reply) => {
    const rpID = env('WEBAUTHN_RP_ID')

    if (!rpID) {
      return reply
        .code(503)
        .send({ error: 'Passkey authentication is not configured' })
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
      allowCredentials: [],
    })

    await createChallenge(options.challenge, 'authentication')

    return options
  })

  /*
   * PASSKEY LOGIN VERIFY
   */
  app.post('/auth/passkey/login/verify', async (request, reply) => {
    const body = request.body as {
      credential?: Parameters<typeof verifyAuthenticationResponse>[0]['response']
      challenge?: string
    }

    if (!body.credential || !body.challenge) {
      return reply
        .code(400)
        .send({ error: 'Passkey credential and challenge are required' })
    }

    const challenge = await consumeChallenge(
      body.challenge,
      'authentication',
    )

    if (!challenge) {
      return reply.code(401).send({ error: 'Invalid or expired challenge' })
    }

    const credentialId = body.credential.id

    const [storedPasskey] = await db
      .select()
      .from(passkeys)
      .where(eq(passkeys.credentialId, credentialId))

    if (!storedPasskey) {
      return reply.code(401).send({
        error:
          'This fingerprint / Face passkey is not registered for Perfect Wisdom School.',
      })
    }

    const rpID = env('WEBAUTHN_RP_ID')
    const origin = env('WEBAUTHN_ORIGIN')

    try {
      const verification = await verifyAuthenticationResponse({
        response: body.credential,
        expectedChallenge: body.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: storedPasskey.credentialId,
          publicKey: bytesFromBase64url(storedPasskey.publicKey),
          counter: storedPasskey.counter,
          transports: storedPasskey.transports
            ? JSON.parse(storedPasskey.transports)
            : undefined,
        },
        requireUserVerification: true,
      })

      if (!verification.verified) {
        return reply.code(401).send({ error: 'Passkey authentication failed' })
      }

      await db
        .update(passkeys)
        .set({
          counter: verification.authenticationInfo.newCounter,
          updatedAt: new Date(),
        })
        .where(eq(passkeys.id, storedPasskey.id))

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, storedPasskey.userId))

      if (!user || user.status !== 'ACTIVE') {
        return reply.code(403).send({ error: 'This account is not active' })
      }

      const token = await issueToken(app, user)

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      }
    } catch (error) {
      request.log.error(error, 'Passkey authentication failed')
      return reply.code(401).send({ error: 'Passkey authentication failed' })
    }
  })

  /*
   * ONE-TIME ADMIN PASSWORD RESET
   * Temporary route. Remove after the production password is changed.
   */
  app.post('/auth/admin-password-reset', async (request, reply) => {
    const resetSecret = env('ADMIN_PASSWORD_RESET_SECRET')

    if (!resetSecret) {
      return reply.code(404).send({ error: 'Not found' })
    }

    const body = request.body as {
      secret?: string
      email?: string
      password?: string
    }

    if (body.secret !== resetSecret) {
      return reply.code(401).send({ error: 'Invalid reset secret' })
    }

    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!email || !password || password.length < 12) {
      return reply.code(400).send({
        error: 'Email and a password of at least 12 characters are required',
      })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))

    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id))

    return {
      success: true,
      message: 'Password updated successfully',
    }
  })

  /*
   * CURRENT USER
   */
  app.get('/auth/me', async (request, reply) => {
    const authUser = await requireAuth(request, reply)
    if (!authUser) return

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, authUser.sub))

    if (!user || user.status !== 'ACTIVE') {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    return { user }
  })
}
