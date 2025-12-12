import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import styles from '@/styles/Forms.module.css';

export default function IncomeForm({ onIncomeAdded }) {
  const { user } = useAuth();
  const content = useTranslatedContent({
    title: '↑ Add Income',
    amountLabel: 'Amount ($)',
    amountPlaceholder: 'Enter amount',
    sourceLabel: 'Source',
    sourcePlaceholder: 'e.g., Salary, Freelance, Investment',
    submitButton: 'Add Income',
    loginRequired: 'Please login first',
    successMessage: 'Income added successfully!',
    failedMessage: 'Failed to add income'
  });
  const [formData, setFormData] = useState({
    amount: '',
    source: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/add-income`, {
        username: user.username,
        password: user.password,
        amount: parseFloat(formData.amount),
        source: formData.source
      });

      if (response.data.msg) {
        setMessage({ text: content.successMessage, type: 'success' });
        setFormData({ amount: '', source: '' });
        if (onIncomeAdded) {
          onIncomeAdded(parseFloat(formData.amount));
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
          <label htmlFor="source">{content.sourceLabel}</label>
          <input
            id="source"
            name="source"
            type="text"
            value={formData.source}
            onChange={handleChange}
            required
            placeholder={content.sourcePlaceholder}
            className={styles.input}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`${styles.submitBtn} ${styles.incomeBtn}`}
        >
          {loading ? 'Adding...' : content.submitButton}
        </button>
      </form>
    </div>
  );
}
