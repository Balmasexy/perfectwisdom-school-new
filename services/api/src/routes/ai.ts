import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { requireAuth } from './auth.js'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatBody = {
  message?: string
  history?: ChatMessage[]
  context?: {
    role?: string
    section?: string
  }
}

function env(name: string): string {
  return process.env[name]?.trim() || ''
}

function getTextFromResponse(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim()
  }

  const parts: string[] = []

  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (typeof content?.text === 'string' && content.text.trim()) {
        parts.push(content.text.trim())
      }
    }
  }

  return parts.join('\n\n').trim()
}

export async function aiRoutes(app: FastifyInstance) {
  app.post('/ai/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireAuth(request, reply)
    if (!user) return

    const body = request.body as ChatBody
    const message = body?.message?.trim()

    if (!message) {
      return reply.code(400).send({ error: 'Message is required' })
    }

    if (message.length > 4000) {
      return reply.code(400).send({ error: 'Message is too long' })
    }

    const key = env('BALMZ_AI_KEY')
    const baseUrl = (env('BALMZ_AI_BASE_URL') || 'https://api.openai.com/v1').replace(/\/$/, '')
    const model = env('BALMZ_AI_MODEL') || 'gpt-5.6-luna'

    if (!key) {
      return reply.code(503).send({
        error: 'BALMZ AI is not configured on the school server',
      })
    }

    const history = Array.isArray(body?.history)
      ? body.history
          .filter(
            (item) =>
              (item?.role === 'user' || item?.role === 'assistant') &&
              typeof item?.content === 'string' &&
              item.content.trim(),
          )
          .slice(-10)
          .map((item) => ({
            role: item.role,
            content: item.content.trim().slice(0, 4000),
          }))
      : []

    const contextText = [
      `Current user role: ${user.role}`,
      body?.context?.section ? `Current workspace: ${body.context.section}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const systemPrompt = [
      'You are BALMZ AI, the intelligent assistant for Perfect Wisdom School.',
      'Help school administrators, staff, and parents use the school platform safely and effectively.',
      'Give clear, practical answers. When explaining a school workflow, use numbered steps when useful.',
      'Do not invent school records, student results, payments, attendance, credentials, or official government information.',
      'If the user asks for data you cannot access, say what is available and direct them to the relevant workspace.',
      'Never ask for passwords, API keys, private tokens, or other secrets.',
      contextText,
    ].join('\n')

    const input = [
      { role: 'developer', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ]

    try {
      const response = await fetch(`${baseUrl}/responses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input,
          max_output_tokens: 900,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        request.log.error(
          { status: response.status, provider: data?.error?.message || data?.error },
          'BALMZ AI provider request failed',
        )
        return reply.code(502).send({
          error: 'BALMZ AI could not process the request right now',
        })
      }

      const answer = getTextFromResponse(data)

      if (!answer) {
        return reply.code(502).send({
          error: 'BALMZ AI returned an empty response',
        })
      }

      return {
        answer,
        model,
      }
    } catch (error) {
      request.log.error(error, 'BALMZ AI request failed')
      return reply.code(502).send({
        error: 'BALMZ AI is temporarily unavailable',
      })
    }
  })
}
