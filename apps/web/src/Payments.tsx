import { useEffect, useState } from 'react';
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
    loadPayments();

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
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p>Make and track school payments securely with Paystack.</p>
        </div>
      </div>

      {message && (
        <div className="card" style={{ marginBottom: 16 }}>
          <strong>{message}</strong>
        </div>
      )}

      <div className="card">
        <h2>Make a Payment</h2>

        <div className="form-grid">
          <label>
            Amount ({config.currency})
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </label>

          <label>
            Description
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
          className="primary-button"
        >
          {loading ? 'Connecting to Paystack...' : 'Pay with Paystack'}
        </button>

        <p style={{ marginTop: 12 }}>
          You will be redirected to Paystack where you can complete payment
          using the available payment methods, including bank transfer.
        </p>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>Payment History</h2>

        {payments.length === 0 ? (
          <p>No payments found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
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
                      {payment.currency} {Number(payment.amount).toLocaleString()}
                    </td>
                    <td>{payment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
