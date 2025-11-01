import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/Forms.module.css';

export default function ExpenseForm({ onExpenseAdded }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUserCategories();
    }
  }, [user]);

  const fetchUserCategories = async () => {
    try {
      const response = await axios.post('http://localhost:5000/get-user-limits', {
        username: user.username,
        password: user.password
      });

      if (response.data.limits) {
        const categoryNames = Object.keys(response.data.limits);
        setCategories(categoryNames);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Set default categories as fallback
      setCategories([
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Education',
        'Travel',
        'Other'
      ]);
    }
  };

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
      const response = await axios.post('http://localhost:5000/add-transaction', {
        username: user.username,
        password: user.password,
        amount: parseFloat(formData.amount),
        category: formData.category
      });

      if (response.data.msg) {
        setMessage({ text: response.data.msg, type: 'success' });
        setFormData({ amount: '', category: '' });
        if (onExpenseAdded) {
          onExpenseAdded(parseFloat(formData.amount));
        }
      } else {
        setMessage({ text: response.data.error || 'Failed to add expense', type: 'error' });
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || 'Failed to add expense', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>↓ Add Expense</h2>
      
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
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`${styles.submitBtn} ${styles.expenseBtn}`}
        >
          {loading ? 'Adding...' : '- Add Expense'}
        </button>
      </form>
    </div>
  );
}
