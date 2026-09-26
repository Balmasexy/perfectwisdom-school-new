import { useState } from 'react'
import { Bot, Send, Sparkles, X } from 'lucide-react'
import { apiRequest } from './api'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function BalmzAI({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendMessage() {
    const text = message.trim()
    if (!text || loading) return

    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    setMessage('')
    setError('')
    setLoading(true)

    try {
      const role = localStorage.getItem('perfect-wisdom-school-role') || 'Admin'
      const section =
        localStorage.getItem('perfect-wisdom-school-active-section') || 'Dashboard'

      const result = await apiRequest<{ answer: string }>('/ai/chat', {
        method: 'POST',
        body: {
          message: text,
          history: messages.slice(-10),
          context: { role, section },
        },
      })

      setMessages([
        ...nextMessages,
        { role: 'assistant', content: result.answer },
      ])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'BALMZ AI is temporarily unavailable',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    const token = localStorage.getItem('perfect-wisdom-school-token')

    if (!token) {
      setOpen(true)
      setError('Please sign in to use BALMZ AI.')
      return
    }

    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        className={`balmz-ai ${compact ? 'balmz-ai-compact' : ''}`}
        onClick={handleOpen}
        aria-label="Open BALMZ AI"
      >
        <div className="balmz-ai-icon">
          <Sparkles size={compact ? 17 : 21} />
        </div>
        <div>
          <strong>BALMZ AI</strong>
          {!compact && (
            <span>Your intelligent Perfect Wisdom School assistant</span>
          )}
        </div>
      </button>

      {open && (
        <div className="balmz-ai-overlay" onClick={() => setOpen(false)}>
          <section
            className="balmz-ai-chat"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="balmz-ai-chat-header">
              <div>
                <div className="balmz-ai-chat-title">
                  <Bot size={20} />
                  <strong>BALMZ AI</strong>
                </div>
                <span>Perfect Wisdom School Assistant</span>
              </div>

              <button
                type="button"
                className="balmz-ai-close"
                onClick={() => setOpen(false)}
                aria-label="Close BALMZ AI"
              >
                <X size={19} />
              </button>
            </header>

            <div className="balmz-ai-messages">
              {messages.length === 0 && (
                <div className="balmz-ai-welcome">
                  <Sparkles size={28} />
                  <strong>How can I help you?</strong>
                  <span>
                    Ask about school operations, students, attendance,
                    registrations, reports or how to use the platform.
                  </span>
                </div>
              )}

              {messages.map((item, index) => (
                <div
                  key={index}
                  className={`balmz-ai-message ${item.role}`}
                >
                  {item.content}
                </div>
              ))}

              {loading && (
                <div className="balmz-ai-message assistant">
                  BALMZ AI is thinking…
                </div>
              )}

              {error && <div className="balmz-ai-error">{error}</div>}
            </div>

            <form
              className="balmz-ai-input"
              onSubmit={(event) => {
                event.preventDefault()
                void sendMessage()
              }}
            >
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask BALMZ AI…"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !message.trim()}>
                <Send size={18} />
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
