import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/Forms.module.css';

export default function IncomeForm({ onIncomeAdded }) {
  const { user } = useAuth();
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
      setMessage({ text: 'Please login first', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await axios.post('http://localhost:5000/add-income', {
        username: user.username,
        password: user.password,
        amount: parseFloat(formData.amount),
        source: formData.source
      });

      if (response.data.msg) {
        setMessage({ text: response.data.msg, type: 'success' });
        setFormData({ amount: '', source: '' });
        if (onIncomeAdded) {
          onIncomeAdded(parseFloat(formData.amount));
        }
      } else {
        setMessage({ text: response.data.error || 'Failed to add income', type: 'error' });
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || 'Failed to add income', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>↑ Add Income</h2>
      
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="amount">Amount ($)</label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={handleChange}
            required
            placeholder="Enter amount"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="source">Source</label>
          <input
            id="source"
            name="source"
            type="text"
            value={formData.source}
            onChange={handleChange}
            required
            placeholder="e.g., Salary, Freelance, Investment"
            className={styles.input}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`${styles.submitBtn} ${styles.incomeBtn}`}
        >
          {loading ? 'Adding...' : '+ Add Income'}
        </button>
      </form>
    </div>
  );
}
