import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import styles from '@/styles/Forms.module.css';

export default function LoanForm({ onLoanAdded }) {
  const { user } = useAuth();
  const content = useTranslatedContent({
    title: '💰 Manage Loans',
    loanTaken: 'Loan Taken',
    loanRepayment: 'Loan Repayment',
    amountLabel: 'Amount ($)',
    amountPlaceholder: 'Enter amount',
    lenderLabel: 'Lender/Borrower',
    lenderPlaceholderTaken: 'Who did you borrow from?',
    lenderPlaceholderRepayment: 'Who are you repaying?',
    paidOnTimeLabel: 'Paid on time?',
    submitButton: 'Record Loan',
    loginRequired: 'Please login first',
    successMessage: 'Loan recorded successfully!',
    failedMessage: 'Failed to record loan'
  });
  const [loanType, setLoanType] = useState('taken'); // 'taken' or 'repayment'
  const [formData, setFormData] = useState({
    amount: '',
    lender: '',
    is_paid_on_time: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage({ text: content.loginRequired, type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const endpoint = loanType === 'taken' 
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/add-loanTaken`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/add-loanRepayment`;

      const payload = {
        username: user.username,
        password: user.password,
        amount: parseFloat(formData.amount),
        lender: formData.lender
      };

      if (loanType === 'repayment') {
        payload.is_paid_on_time = formData.is_paid_on_time;
      }

      const response = await axios.post(endpoint, payload);

      if (response.data.msg) {
        setMessage({ text: content.successMessage, type: 'success' });
        setFormData({ amount: '', lender: '', is_paid_on_time: true });
        if (onLoanAdded) {
          onLoanAdded(loanType, parseFloat(formData.amount));
        }
      } else {
        setMessage({ text: response.data.error || content.failedMessage, type: 'error' });
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || content.failedMessage, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>{content.title}</h2>
      
      <div className={styles.tabContainer}>
        <button
          type="button"
          className={`${styles.tab} ${loanType === 'taken' ? styles.activeTab : ''}`}
          onClick={() => setLoanType('taken')}
        >
          {content.loanTaken}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${loanType === 'repayment' ? styles.activeTab : ''}`}
          onClick={() => setLoanType('repayment')}
        >
          {content.loanRepayment}
        </button>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="amount">{content.amountLabel}</label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={handleChange}
            required
            placeholder={content.amountPlaceholder}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="lender">{content.lenderLabel}</label>
          <input
            id="lender"
            name="lender"
            type="text"
            value={formData.lender}
            onChange={handleChange}
            required
            placeholder={loanType === 'taken' ? content.lenderPlaceholderTaken : content.lenderPlaceholderRepayment}
            className={styles.input}
          />
        </div>

        {loanType === 'repayment' && (
          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                name="is_paid_on_time"
                checked={formData.is_paid_on_time}
                onChange={handleChange}
              />
              <span>{content.paidOnTimeLabel}</span>
            </label>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className={`${styles.submitBtn} ${styles.loanBtn}`}
        >
          {loading ? 'Adding...' : content.submitButton}
        </button>
      </form>
    </div>
  );
}
