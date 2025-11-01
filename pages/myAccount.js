import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import styles from '@/styles/MyAccount.module.css';

export default function MyAccount() {
  const { user, signout } = useAuth();
  const router = useRouter();
  const [limits, setLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedLimits, setEditedLimits] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState(5);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      fetchUserLimits();
    }
  }, [user]);

  const fetchUserLimits = async () => {
    try {
      const response = await axios.post('http://localhost:5000/get-user-limits', {
        username: user.username,
        password: user.password
      });

      if (response.data.limits) {
        setLimits(response.data.limits);
        setEditedLimits(response.data.limits);
      }
    } catch (error) {
      console.error('Failed to fetch user limits:', error);
      showMessage('error', 'Failed to load your limits');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleEditToggle = () => {
    if (editMode) {
      setEditedLimits(limits);
    }
    setEditMode(!editMode);
  };

  const handleLimitChange = (category, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setEditedLimits({
        ...editedLimits,
        [category]: numValue
      });
    }
  };

  const handleSaveLimits = async () => {
    try {
      const response = await axios.post('http://localhost:5000/update-user-limits', {
        username: user.username,
        password: user.password,
        limits: editedLimits
      });

      if (response.data.msg) {
        setLimits(editedLimits);
        setEditMode(false);
        showMessage('success', 'Limits updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update limits:', error);
      showMessage('error', error.response?.data?.error || 'Failed to update limits');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      showMessage('error', 'Please enter a category name');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/add-category', {
        username: user.username,
        password: user.password,
        category_name: newCategoryName.trim(),
        limit_percentage: newCategoryLimit
      });

      if (response.data.msg) {
        setLimits(response.data.all_limits);
        setEditedLimits(response.data.all_limits);
        setNewCategoryName('');
        setNewCategoryLimit(5);
        setShowAddCategory(false);
        showMessage('success', `Category "${newCategoryName}" added successfully!`);
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      showMessage('error', error.response?.data?.error || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/delete-category', {
        username: user.username,
        password: user.password,
        category_name: categoryName
      });

      if (response.data.msg) {
        setLimits(response.data.all_limits);
        setEditedLimits(response.data.all_limits);
        showMessage('success', `Category "${categoryName}" deleted successfully!`);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      showMessage('error', error.response?.data?.error || 'Failed to delete category');
    }
  };

  const getTotalPercentage = () => {
    return Object.values(editedLimits).reduce((sum, val) => sum + val, 0).toFixed(1);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your account...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Account - FinWise</title>
      </Head>
      <div className={styles.pageContainer}>
        <Navbar currentPage="/myAccount" />
        
        <main className={styles.mainContent}>
          <div className={styles.accountHeader}>
            <h1>My Account</h1>
            <p className={styles.subtitle}>Manage your spending categories and limits</p>
          </div>

          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          <div className={styles.accountCard}>
            <div className={styles.cardHeader}>
              <h2>Spending Limits</h2>
              <div className={styles.cardActions}>
                {editMode && (
                  <button 
                    className={styles.addBtn}
                    onClick={() => setShowAddCategory(!showAddCategory)}
                  >
                    {showAddCategory ? 'Cancel Add' : '+ Add Category'}
                  </button>
                )}
                <button 
                  className={editMode ? styles.cancelBtn : styles.editBtn}
                  onClick={handleEditToggle}
                >
                  {editMode ? 'Cancel' : 'Edit Limits'}
                </button>
                {editMode && (
                  <button 
                    className={styles.saveBtn}
                    onClick={handleSaveLimits}
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </div>

            {showAddCategory && (
              <form className={styles.addCategoryForm} onSubmit={handleAddCategory}>
                <div className={styles.formRow}>
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={styles.input}
                    maxLength={50}
                  />
                  <input
                    type="number"
                    placeholder="Limit %"
                    value={newCategoryLimit}
                    onChange={(e) => setNewCategoryLimit(parseFloat(e.target.value) || 0)}
                    className={styles.input}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <button type="submit" className={styles.submitBtn}>
                    Add
                  </button>
                </div>
              </form>
            )}

            <div className={styles.limitsContainer}>
              {Object.keys(limits).length === 0 ? (
                <p className={styles.noData}>No spending categories yet. Add your first category!</p>
              ) : (
                <>
                  <div className={styles.limitsList}>
                    {Object.entries(editMode ? editedLimits : limits).map(([category, limit]) => (
                      <div key={category} className={styles.limitItem}>
                        <div className={styles.limitInfo}>
                          <span className={styles.categoryName}>{category}</span>
                          {editMode ? (
                            <div className={styles.editControl}>
                              <input
                                type="number"
                                value={limit}
                                onChange={(e) => handleLimitChange(category, e.target.value)}
                                className={styles.limitInput}
                                min="0"
                                max="100"
                                step="0.1"
                              />
                              <span className={styles.percentSign}>%</span>
                            </div>
                          ) : (
                            <span className={styles.limitValue}>{limit}%</span>
                          )}
                        </div>
                        {editMode && (
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteCategory(category)}
                            title="Delete category"
                          >
                            ✕
                          </button>
                        )}
                        <div 
                          className={styles.limitBar}
                          style={{ 
                            '--limit-width': `${Math.min(limit, 100)}%`,
                            '--limit-color': limit > 30 ? '#f44336' : limit > 15 ? '#ff9800' : '#4CAF50'
                          }}
                        >
                          <div className={styles.limitFill}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.totalSection}>
                    <div className={styles.totalRow}>
                      <span className={styles.totalLabel}>Total Allocation:</span>
                      <span className={`${styles.totalValue} ${
                        getTotalPercentage() > 100 ? styles.overLimit : ''
                      }`}>
                        {getTotalPercentage()}%
                      </span>
                    </div>
                    {getTotalPercentage() > 100 && (
                      <p className={styles.warningText}>
                        ⚠️ Total exceeds 100%. Consider adjusting your limits.
                      </p>
                    )}
                    {getTotalPercentage() < 100 && (
                      <p className={styles.infoText}>
                        💡 You have {(100 - getTotalPercentage()).toFixed(1)}% unallocated.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
