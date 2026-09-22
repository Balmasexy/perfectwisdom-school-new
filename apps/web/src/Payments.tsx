import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { apiRequest } from './api'

type PaymentConfig = {
  onlineUrl: string
  bank: string
  accountName: string
  accountNumber: string
  currency: string
}

type Payment = {
  id: string
  amount: string | number
  method: string
  status: string
  reference: string
  description: string
  created_at: string
}

export default function Payments() {
  const [config, setConfig] = useState<PaymentConfig | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState(false)

  async function loadPayments() {
    try {
      setError('')

      const [paymentConfig, paymentHistory] = await Promise.all([
        apiRequest<PaymentConfig>('/payments/config'),
        apiRequest<Payment[]>('/payments/my'),
      ])

      setConfig(paymentConfig)
      setPayments(paymentHistory)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPayments()
  }, [])

  async function submitTransfer(event: React.FormEvent) {
    event.preventDefault()

    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid payment amount greater than 0.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const result = await apiRequest<{
        payment: Payment
        destination: PaymentConfig
      }>('/payments/transfer', {
        method: 'POST',
        body: JSON.stringify({
          amount: numericAmount,
          description:
            description.trim() || 'School payment by bank transfer',
        }),
      })

      setAmount('')
      setDescription('')

      setSuccess(
        `Payment reference ${result.payment.reference} created. Complete the transfer to the OPay account shown below. The payment will remain pending until it is verified.`,
      )

      await loadPayments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create payment')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyAccountNumber() {
    if (!config) return

    try {
      await navigator.clipboard.writeText(config.accountNumber)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch {
      setError('Unable to copy the account number.')
    }
  }

  function openOnlinePayment() {
    if (!config?.onlineUrl) return
    window.location.assign(config.onlineUrl)
  }

  function formatAmount(value: string | number) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(Number(value))
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  if (loading) {
    return (
      <section className="management-page">
        <div className="management-card">
          <div className="management-empty">
            <Loader2 size={22} className="spin" />
            Loading payment options...
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="management-page payments-page">
      <div className="management-header">
        <div>
          <div className="dashboard-kicker">FINANCE</div>
          <h1>Payments</h1>
          <p>
            Make school payments online or record a bank transfer to the
            school account.
          </p>
        </div>

        <button
          type="button"
          className="management-secondary-button"
          onClick={() => void loadPayments()}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="management-error">{error}</div>}

      {success && (
        <div className="payment-success">
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      <div className="payment-method-grid">
        <article className="payment-method-card">
          <div className="payment-method-icon">
            <CreditCard size={24} />
          </div>

          <h2>Pay Online</h2>
          <p>
            Continue to OPay to make your payment online. Your payment is
            completed directly through OPay.
          </p>

          <button
            type="button"
            className="management-primary-button"
            onClick={openOnlinePayment}
          >
            Open OPay
            <ExternalLink size={17} />
          </button>
        </article>

        <article className="payment-method-card">
          <div className="payment-method-icon">
            <ArrowUpRight size={24} />
          </div>

          <h2>Bank Transfer</h2>
          <p>
            Transfer the amount to the school OPay account, then keep the
            generated payment reference for verification.
          </p>

          {config && (
            <div className="opay-account-box">
              <div>
                <span>Bank</span>
                <strong>{config.bank}</strong>
              </div>

              <div>
                <span>Account Name</span>
                <strong>{config.accountName}</strong>
              </div>

              <div>
                <span>Account Number</span>
                <strong>{config.accountNumber}</strong>
              </div>

              <div>
                <span>Currency</span>
                <strong>{config.currency}</strong>
              </div>

              <button
                type="button"
                className="copy-account-button"
                onClick={() => void copyAccountNumber()}
              >
                <Copy size={15} />
                {copied ? 'Copied' : 'Copy Account Number'}
              </button>
            </div>
          )}

          <form className="payment-form" onSubmit={submitTransfer}>
            <label>
              Amount (NGN)
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                required
              />
            </label>

            <label>
              Description
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. School fees"
                maxLength={200}
              />
            </label>

            <button
              type="submit"
              className="management-primary-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={17} className="spin" />
                  Creating reference...
                </>
              ) : (
                <>
                  Create Transfer Reference
                  <ArrowUpRight size={17} />
                </>
              )}
            </button>
          </form>
        </article>
      </div>

      <div className="management-card">
        <div className="management-card-header">
          <div>
            <h2>Payment History</h2>
            <p>Your recent school payment records.</p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="management-empty">
            No school payments have been recorded yet.
          </div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.created_at)}</td>
                    <td>{payment.reference}</td>
                    <td>{payment.description}</td>
                    <td>{payment.method.replace('_', ' ')}</td>
                    <td>{formatAmount(payment.amount)}</td>
                    <td>
                      <span
                        className={`status-badge status-${payment.status.toLowerCase()}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
