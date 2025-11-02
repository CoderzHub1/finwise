/**
 * Example: How to add translation to any component in FinWise
 * 
 * This file demonstrates three different approaches to implementing
 * translation in your components.
 */

// ============================================================================
// Example 1: Dashboard Component with Translation
// ============================================================================

import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import LanguageSelector from '@/components/LanguageSelector';

export default function DashboardExample() {
  const { user } = useAuth();
  
  // Define all text content in English
  const content = useTranslatedContent({
    title: 'Dashboard',
    welcome: 'Welcome back',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expenses',
    balance: 'Balance',
    addIncome: 'Add Income',
    addExpense: 'Add Expense',
    recentTransactions: 'Recent Transactions'
  });

  return (
    <div>
      <Navbar currentPage="/dashboard" />
      <LanguageSelector />
      
      <h1>{content.title}</h1>
      <p>{content.welcome}, {user?.name}!</p>
      
      <div className="stats">
        <div>{content.totalIncome}: $1,000</div>
        <div>{content.totalExpense}: $500</div>
        <div>{content.balance}: $500</div>
      </div>
      
      <button>{content.addIncome}</button>
      <button>{content.addExpense}</button>
      
      <h2>{content.recentTransactions}</h2>
    </div>
  );
}

// ============================================================================
// Example 2: Simple Component with Single Text Translation
// ============================================================================

import { useTranslatedText } from '@/hooks/useTranslatedContent';

export default function WelcomeMessageExample() {
  const welcomeText = useTranslatedText('Welcome to FinWise');
  const descriptionText = useTranslatedText('Your personal finance management tool');

  return (
    <div>
      <h1>{welcomeText}</h1>
      <p>{descriptionText}</p>
    </div>
  );
}

// ============================================================================
// Example 3: Form Component with Dynamic Translation
// ============================================================================

import { useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';

export default function FormExample() {
  const { translate } = useTranslation();
  const [message, setMessage] = useState('');
  
  const content = useTranslatedContent({
    formTitle: 'Add New Transaction',
    amountLabel: 'Amount',
    categoryLabel: 'Category',
    descriptionLabel: 'Description',
    submitButton: 'Submit',
    cancelButton: 'Cancel',
    successMessage: 'Transaction added successfully',
    errorMessage: 'Failed to add transaction'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Your form submission logic here
    setMessage(content.successMessage);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{content.formTitle}</h2>
      
      <label>{content.amountLabel}</label>
      <input type="number" placeholder={content.amountLabel} />
      
      <label>{content.categoryLabel}</label>
      <select>
        <option>{content.categoryLabel}</option>
      </select>
      
      <label>{content.descriptionLabel}</label>
      <textarea placeholder={content.descriptionLabel} />
      
      <button type="submit">{content.submitButton}</button>
      <button type="button">{content.cancelButton}</button>
      
      {message && <p>{message}</p>}
    </form>
  );
}

// ============================================================================
// Example 4: Translating Dynamic User Data
// ============================================================================

import { useEffect, useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';

export default function TranslateUserDataExample() {
  const { translateObject, currentLanguage } = useTranslation();
  const [categories, setCategories] = useState({});

  useEffect(() => {
    // Example: Translate category names from backend
    const originalCategories = {
      food: 'Food',
      transport: 'Transport',
      entertainment: 'Entertainment',
      utilities: 'Utilities'
    };

    const translateCategories = async () => {
      if (currentLanguage === 'en') {
        setCategories(originalCategories);
      } else {
        const translated = await translateObject(originalCategories);
        setCategories(translated);
      }
    };

    translateCategories();
  }, [currentLanguage, translateObject]);

  return (
    <div>
      <h2>Categories</h2>
      <ul>
        {Object.entries(categories).map(([key, value]) => (
          <li key={key}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Example 5: Adding Language Selector to Navbar (Global Access)
// ============================================================================

import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import LanguageSelector from '@/components/LanguageSelector';
import styles from '@/styles/Navbar.module.css';

export default function NavbarWithTranslation({ currentPage = '' }) {
  const router = useRouter();
  const { user, signout } = useAuth();
  const { translate, currentLanguage } = useTranslation();
  const [navText, setNavText] = useState({
    welcome: 'Welcome back',
    signOut: 'Sign Out'
  });

  // Translate navbar text when language changes
  useEffect(() => {
    const translateNav = async () => {
      if (currentLanguage === 'en') {
        setNavText({
          welcome: 'Welcome back',
          signOut: 'Sign Out'
        });
      } else {
        const [welcomeTranslated, signOutTranslated] = await Promise.all([
          translate('Welcome back'),
          translate('Sign Out')
        ]);
        setNavText({
          welcome: welcomeTranslated,
          signOut: signOutTranslated
        });
      }
    };
    translateNav();
  }, [currentLanguage, translate]);

  const handleSignout = () => {
    signout();
    router.push('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1>FinWise</h1>
        <p>{navText.welcome}, {user?.name || user?.username}!</p>
      </div>
      
      {/* Add Language Selector to Navbar for global access */}
      <LanguageSelector />
      
      <button onClick={handleSignout}>
        {navText.signOut}
      </button>
    </header>
  );
}

// ============================================================================
// Quick Reference Guide
// ============================================================================

/*

QUICK START:

1. Import the hook:
   import { useTranslatedContent } from '@/hooks/useTranslatedContent';

2. Define your content:
   const content = useTranslatedContent({
     title: 'Page Title',
     button: 'Click Me'
   });

3. Use in JSX:
   <h1>{content.title}</h1>
   <button>{content.button}</button>

TIPS:

- Always define text in English as default
- Use descriptive keys for your content object
- Translation happens automatically when language changes
- Content is cached to improve performance
- No translation occurs when English is selected (saves API costs)

ADVANCED USAGE:

- useTranslation() - Direct access to translation functions
- translate(text) - Translate a single string
- translateMultiple([texts]) - Batch translate multiple strings
- translateObject({key: value}) - Translate object values
- currentLanguage - Get the current language code

*/
