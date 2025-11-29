import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import LanguageSelector from '@/components/LanguageSelector';
import axios from 'axios';
import styles from '@/styles/MyAccount.module.css';

export default function MyAccount() {
  const { user, signout } = useAuth();
  const { translate, currentLanguage } = useTranslation();
  const router = useRouter();
  const [limits, setLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedLimits, setEditedLimits] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState(5);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [translatedContent, setTranslatedContent] = useState({
    title: 'My Account',
    subtitle: 'Manage your spending categories and limits',
    spendingLimits: 'Spending Limits',
    editLimits: 'Edit Limits',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    addCategory: 'Add Category',
    cancelAdd: 'Cancel Add',
    categoryName: 'Category Name',
    limitPercent: 'Limit %',
    add: 'Add',
    noCategories: 'No spending categories yet. Add your first category!',
    totalAllocation: 'Total Allocation:',
    warningExceeds: '⚠️ Total exceeds 100%. Consider adjusting your limits.',
    infoUnallocated: '💡 You have',
    unallocated: 'unallocated.',
    deleteConfirm: 'Are you sure you want to delete the category',
    loadingAccount: 'Loading your account...',
    limitsUpdated: 'Limits updated successfully!',
    categoryAdded: 'added successfully!',
    categoryDeleted: 'deleted successfully!',
    enterCategoryName: 'Please enter a category name',
    failedToLoad: 'Failed to load your limits',
    failedToUpdate: 'Failed to update limits',
    failedToAdd: 'Failed to add category',
    failedToDelete: 'Failed to delete category'
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      fetchUserLimits();
    }
  }, [user]);

  // Translate UI content when language changes
  useEffect(() => {
    const translateUI = async () => {
      if (currentLanguage === 'en') {
        // Reset to English
        setTranslatedContent({
          title: 'My Account',
          subtitle: 'Manage your spending categories and limits',
          spendingLimits: 'Spending Limits',
          editLimits: 'Edit Limits',
          cancel: 'Cancel',
          saveChanges: 'Save Changes',
          addCategory: 'Add Category',
          cancelAdd: 'Cancel Add',
          categoryName: 'Category Name',
          limitPercent: 'Limit %',
          add: 'Add',
          noCategories: 'No spending categories yet. Add your first category!',
          totalAllocation: 'Total Allocation:',
          warningExceeds: '⚠️ Total exceeds 100%. Consider adjusting your limits.',
          infoUnallocated: '💡 You have',
          unallocated: 'unallocated.',
          deleteConfirm: 'Are you sure you want to delete the category',
          loadingAccount: 'Loading your account...',
          limitsUpdated: 'Limits updated successfully!',
          categoryAdded: 'added successfully!',
          categoryDeleted: 'deleted successfully!',
          enterCategoryName: 'Please enter a category name',
          failedToLoad: 'Failed to load your limits',
          failedToUpdate: 'Failed to update limits',
          failedToAdd: 'Failed to add category',
          failedToDelete: 'Failed to delete category'
        });
      } else {
        // Translate all UI strings
        const translations = await Promise.all([
          translate('My Account'),
          translate('Manage your spending categories and limits'),
          translate('Spending Limits'),
          translate('Edit Limits'),
          translate('Cancel'),
          translate('Save Changes'),
          translate('Add Category'),
          translate('Cancel Add'),
          translate('Category Name'),
          translate('Limit %'),
          translate('Add'),
          translate('No spending categories yet. Add your first category!'),
          translate('Total Allocation:'),
          translate('⚠️ Total exceeds 100%. Consider adjusting your limits.'),
          translate('💡 You have'),
          translate('unallocated.'),
          translate('Are you sure you want to delete the category'),
          translate('Loading your account...'),
          translate('Limits updated successfully!'),
          translate('added successfully!'),
          translate('deleted successfully!'),
          translate('Please enter a category name'),
          translate('Failed to load your limits'),
          translate('Failed to update limits'),
          translate('Failed to add category'),
          translate('Failed to delete category')
        ]);

        setTranslatedContent({
          title: translations[0],
          subtitle: translations[1],
          spendingLimits: translations[2],
          editLimits: translations[3],
          cancel: translations[4],
          saveChanges: translations[5],
          addCategory: translations[6],
          cancelAdd: translations[7],
          categoryName: translations[8],
          limitPercent: translations[9],
          add: translations[10],
          noCategories: translations[11],
          totalAllocation: translations[12],
          warningExceeds: translations[13],
          infoUnallocated: translations[14],
          unallocated: translations[15],
          deleteConfirm: translations[16],
          loadingAccount: translations[17],
          limitsUpdated: translations[18],
          categoryAdded: translations[19],
          categoryDeleted: translations[20],
          enterCategoryName: translations[21],
          failedToLoad: translations[22],
          failedToUpdate: translations[23],
          failedToAdd: translations[24],
          failedToDelete: translations[25]
        });
      }
    };

    translateUI();
  }, [currentLanguage, translate]);

  const fetchUserLimits = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-user-limits`, {
        username: user.username,
        password: user.password
      });

      if (response.data.limits) {
        setLimits(response.data.limits);
        setEditedLimits(response.data.limits);
      }
    } catch (error) {
      console.error('Failed to fetch user limits:', error);
      showMessage('error', translatedContent.failedToLoad);
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
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/update-user-limits`, {
        username: user.username,
        password: user.password,
        limits: editedLimits
      });

      if (response.data.msg) {
        setLimits(editedLimits);
        setEditMode(false);
        showMessage('success', translatedContent.limitsUpdated);
      }
    } catch (error) {
      console.error('Failed to update limits:', error);
      showMessage('error', error.response?.data?.error || translatedContent.failedToUpdate);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      showMessage('error', translatedContent.enterCategoryName);
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/add-category`, {
        username: user.username,
        password: user.password,
        category_name: newCategoryName.trim(),
        limit_percentage: newCategoryLimit
      });

      if (response.data.msg) {
        setLimits(response.data.all_limits);
        setEditedLimits(response.data.all_limits);
        const categoryName = newCategoryName;
        setNewCategoryName('');
        setNewCategoryLimit(5);
        setShowAddCategory(false);
        showMessage('success', `${translatedContent.addCategory} "${categoryName}" ${translatedContent.categoryAdded}`);
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      showMessage('error', error.response?.data?.error || translatedContent.failedToAdd);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!confirm(`${translatedContent.deleteConfirm} "${categoryName}"?`)) {
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/delete-category`, {
        username: user.username,
        password: user.password,
        category_name: categoryName
      });

      if (response.data.msg) {
        setLimits(response.data.all_limits);
        setEditedLimits(response.data.all_limits);
        showMessage('success', `${translatedContent.addCategory} "${categoryName}" ${translatedContent.categoryDeleted}`);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      showMessage('error', error.response?.data?.error || translatedContent.failedToDelete);
    }
  };

  const getTotalPercentage = () => {
    return Object.values(editedLimits).reduce((sum, val) => sum + val, 0).toFixed(1);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>{translatedContent.loadingAccount}</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{translatedContent.title} - FinWise</title>
      </Head>
      <div className={styles.pageContainer}>
        <Navbar currentPage="/myAccount" />
        
        <main className={styles.mainContent}>
          <LanguageSelector />
          
          <div className={styles.accountHeader}>
            <h1>{translatedContent.title}</h1>
            <p className={styles.subtitle}>{translatedContent.subtitle}</p>
          </div>

          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          <div className={styles.accountCard}>
            <div className={styles.cardHeader}>
              <h2>{translatedContent.spendingLimits}</h2>
              <div className={styles.cardActions}>
                {editMode && (
                  <button 
                    className={styles.addBtn}
                    onClick={() => setShowAddCategory(!showAddCategory)}
                  >
                    {showAddCategory ? translatedContent.cancelAdd : `+ ${translatedContent.addCategory}`}
                  </button>
                )}
                <button 
                  className={editMode ? styles.cancelBtn : styles.editBtn}
                  onClick={handleEditToggle}
                >
                  {editMode ? translatedContent.cancel : translatedContent.editLimits}
                </button>
                {editMode && (
                  <button 
                    className={styles.saveBtn}
                    onClick={handleSaveLimits}
                  >
                    {translatedContent.saveChanges}
                  </button>
                )}
              </div>
            </div>

            {showAddCategory && (
              <form className={styles.addCategoryForm} onSubmit={handleAddCategory}>
                <div className={styles.formRow}>
                  <input
                    type="text"
                    placeholder={translatedContent.categoryName}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={styles.input}
                    maxLength={50}
                  />
                  <input
                    type="number"
                    placeholder={translatedContent.limitPercent}
                    value={newCategoryLimit}
                    onChange={(e) => setNewCategoryLimit(parseFloat(e.target.value) || 0)}
                    className={styles.input}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <button type="submit" className={styles.submitBtn}>
                    {translatedContent.add}
                  </button>
                </div>
              </form>
            )}

            <div className={styles.limitsContainer}>
              {Object.keys(limits).length === 0 ? (
                <p className={styles.noData}>{translatedContent.noCategories}</p>
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
                            title={translatedContent.deleteConfirm}
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
                      <span className={styles.totalLabel}>{translatedContent.totalAllocation}</span>
                      <span className={`${styles.totalValue} ${
                        getTotalPercentage() > 100 ? styles.overLimit : ''
                      }`}>
                        {getTotalPercentage()}%
                      </span>
                    </div>
                    {getTotalPercentage() > 100 && (
                      <p className={styles.warningText}>
                        {translatedContent.warningExceeds}
                      </p>
                    )}
                    {getTotalPercentage() < 100 && (
                      <p className={styles.infoText}>
                        {translatedContent.infoUnallocated} {(100 - getTotalPercentage()).toFixed(1)}% {translatedContent.unallocated}
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
