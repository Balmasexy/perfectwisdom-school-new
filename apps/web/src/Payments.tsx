import { useEffect, useState } from 'react';
import { ArrowRight, CreditCard, History, ShieldCheck } from 'lucide-react';
import { apiRequest } from './api';

type PaymentConfig = {
  currency: string;
};

type Payment = {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
};

export default function Payments() {
  const [config, setConfig] = useState<PaymentConfig>({ currency: 'NGN' });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadPayments = async () => {
    try {
      const [cfg, history] = await Promise.all([
        apiRequest<PaymentConfig>('/payments/config'),
        apiRequest<Payment[]>('/payments/my'),
      ]);

      setConfig(cfg);
      setPayments(history || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    void loadPayments();

    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success') {
      setMessage('Payment completed successfully.');
    } else if (paymentStatus === 'failed') {
      setMessage('Payment was not completed. Please try again.');
    }
  }, []);

  const payWithPaystack = async () => {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setMessage('Enter a valid payment amount.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await apiRequest<{
        authorization_url: string;
        reference: string;
      }>('/payments/paystack/initialize', {
        method: 'POST',
        body: JSON.stringify({
          amount: numericAmount,
          description: description.trim() || 'School payment',
        }),
      });

      if (!result.authorization_url) {
        throw new Error('Paystack authorization URL was not returned.');
      }

      window.location.assign(result.authorization_url);
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to initialize Paystack payment.'
      );

      setLoading(false);
    }
  };

  return (
    <div className="page-shell payments-page">
      <div className="payments-hero">
        <div className="payments-hero-copy">
          <span className="payments-kicker">PERFECT WISDOM SCHOOL</span>
          <h1>School Payments</h1>
          <p>
            Make and track your school payments securely through Paystack.
          </p>
        </div>

        <div className="payments-hero-icon">
          <CreditCard size={28} />
        </div>
      </div>

      {message && (
        <div className="payments-message">
          <ShieldCheck size={18} />
          <strong>{message}</strong>
        </div>
      )}

      <section className="payments-card payments-form-card">
        <div className="payments-card-heading">
          <div className="payments-section-icon">
            <CreditCard size={20} />
          </div>

          <div>
            <span>SECURE CHECKOUT</span>
            <h2>Make a Payment</h2>
          </div>
        </div>

        <div className="payments-form-grid">
          <label className="payments-field">
            <span>Amount ({config.currency})</span>

            <div className="payments-input-wrap">
              <span className="payments-input-prefix">₦</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                inputMode="decimal"
              />
            </div>
          </label>

          <label className="payments-field">
            <span>Description</span>

            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. School fees"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={payWithPaystack}
          disabled={loading}
          className="payments-pay-button"
        >
          <CreditCard size={19} />
          {loading ? 'Connecting to Paystack...' : 'Pay with Paystack'}
          {!loading && <ArrowRight size={18} />}
        </button>

        <div className="payments-security-note">
          <ShieldCheck size={18} />
          <p>
            You will be redirected to Paystack's secure checkout to complete
            your payment using the available payment methods, including bank
            transfer.
          </p>
        </div>
      </section>

      <section className="payments-card payments-history-card">
        <div className="payments-card-heading">
          <div className="payments-section-icon">
            <History size={20} />
          </div>

          <div>
            <span>TRANSACTION RECORDS</span>
            <h2>Payment History</h2>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="payments-empty">
            <History size={30} />
            <strong>No payments found</strong>
            <span>Your completed school payments will appear here.</span>
          </div>
        ) : (
          <div className="payments-table-wrap">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.createdAt).toLocaleString()}</td>
                    <td>{payment.reference}</td>
                    <td>{payment.description || 'School payment'}</td>
                    <td>
                      {payment.currency}{' '}
                      {Number(payment.amount).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`payment-status payment-status-${payment.status.toLowerCase()}`}
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
      </section>
    </div>
  );
}
