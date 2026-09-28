import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CreditCard,
  History,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { apiRequest } from './api';

type PaymentConfig = {
  currency: string;
  debitCard?: boolean;
  schoolBalanceLedger?: boolean;
};

type Payment = {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  method?: string;
  status: string;
  description?: string;
  createdAt: string;
};

type SchoolBalance = {
  accountName: string;
  balance: number;
  currency: string;
  updatedAt?: string | null;
};

export default function Payments() {
  const [config, setConfig] = useState<PaymentConfig>({
    currency: 'NGN',
  });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schoolBalance, setSchoolBalance] =
    useState<SchoolBalance | null>(null);
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

      try {
        const balance = await apiRequest<SchoolBalance>(
          '/payments/school-balance',
        );
        setSchoolBalance(balance);
      } catch {
        // Parents/customers do not have access to the school ledger.
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    void loadPayments();

    const params = new URLSearchParams(
      window.location.search,
    );

    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success') {
      setMessage(
        'Debit/ATM card payment completed and the school account has been credited.',
      );
    } else if (paymentStatus === 'failed') {
      setMessage(
        'Payment was not completed. Please try again.',
      );
    }
  }, []);

  const payWithDebitCard = async () => {
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
          description:
            description.trim() ||
            'Debit/ATM card school payment',
        }),
      });

      if (!result.authorization_url) {
        throw new Error(
          'Paystack authorization URL was not returned.',
        );
      }

      window.location.assign(result.authorization_url);
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to initialize debit card payment.',
      );

      setLoading(false);
    }
  };

  return (
    <div className="page-shell payments-page">
      <div className="payments-hero">
        <div className="payments-hero-copy">
          <span className="payments-kicker">
            PERFECT WISDOM SCHOOL
          </span>
          <h1>School Payments</h1>
          <p>
            Pay securely with your Debit/ATM Card through
            Paystack.
          </p>
        </div>

        <div className="payments-hero-icon">
          <CreditCard size={28} />
        </div>
      </div>

      {schoolBalance && (
        <section className="payments-balance-card">
          <div className="payments-balance-icon">
            <Wallet size={24} />
          </div>
          <div>
            <span>PERFECT WISDOM SCHOOL ACCOUNT</span>
            <strong>
              {schoolBalance.currency}{' '}
              {Number(
                schoolBalance.balance,
              ).toLocaleString()}
            </strong>
            <small>
              Every successfully verified school payment is
              credited to this ledger.
            </small>
          </div>
        </section>
      )}

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
            <span>DEBIT / ATM CARD</span>
            <h2>Make a Payment</h2>
          </div>
        </div>

        <div className="payments-form-grid">
          <label className="payments-field">
            <span>Amount ({config.currency})</span>

            <div className="payments-input-wrap">
              <span className="payments-input-prefix">
                ₦
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
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
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="e.g. School fees"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={payWithDebitCard}
          disabled={loading}
          className="payments-pay-button"
        >
          <CreditCard size={19} />
          {loading
            ? 'Connecting to Paystack...'
            : 'Pay with Debit / ATM Card'}
          {!loading && <ArrowRight size={18} />}
        </button>

        <div className="payments-security-note">
          <ShieldCheck size={18} />
          <p>
            Paystack securely handles the card number,
            expiry, CVV, PIN, OTP and bank authentication.
            Perfect Wisdom School does not store your
            sensitive card credentials.
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
            <span>
              Your school payments will appear here.
            </span>
          </div>
        ) : (
          <div className="payments-table-wrap">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Method</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      {new Date(
                        payment.createdAt,
                      ).toLocaleString()}
                    </td>
                    <td>{payment.reference}</td>
                    <td>
                      {payment.method === 'DEBIT_CARD'
                        ? 'Debit / ATM Card'
                        : payment.method || 'Paystack'}
                    </td>
                    <td>
                      {payment.description ||
                        'School payment'}
                    </td>
                    <td>
                      {payment.currency}{' '}
                      {Number(
                        payment.amount,
                      ).toLocaleString()}
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
