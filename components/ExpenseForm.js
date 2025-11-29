import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import styles from '@/styles/Forms.module.css';

export default function ExpenseForm({ onExpenseAdded }) {
  const { user } = useAuth();
  const content = useTranslatedContent({
    title: '↓ Add Expense',
    amountLabel: 'Amount ($)',
    amountPlaceholder: 'Enter amount',
    categoryLabel: 'Category',
    categoryPlaceholder: 'Select a category',
    submitButton: 'Add Expense',
    loginRequired: 'Please login first',
    selectCategory: 'Please select a category',
    successMessage: 'Expense added successfully!',
    failedMessage: 'Failed to add expense',
    loadingCategories: 'Loading categories...',
    noCategories: 'No categories found. Add categories in My Account.'
  });
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
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-user-limits`, {
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
      setMessage({ text: content.loginRequired, type: 'error' });
      return;
    }

    if (!formData.category) {
      setMessage({ text: content.selectCategory, type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/add-transaction`, {
        username: user.username,
        password: user.password,
        amount: parseFloat(formData.amount),
        category: formData.category
      });

      if (response.data.msg) {
        setMessage({ text: content.successMessage, type: 'success' });
        setFormData({ amount: '', category: '' });
        if (onExpenseAdded) {
          onExpenseAdded(parseFloat(formData.amount));
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
          <label htmlFor="category">{content.categoryLabel}</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">{content.categoryPlaceholder}</option>
            {categories.length > 0 ? categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            )) : <option disabled>{content.noCategories}</option>}
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`${styles.submitBtn} ${styles.expenseBtn}`}
        >
          {loading ? 'Adding...' : content.submitButton}
        </button>
      </form>
    </div>
  );
}
