import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import GamifiedPieChart from '@/components/GamifiedPieChart';
import IncomeForm from '@/components/IncomeForm';
import ExpenseForm from '@/components/ExpenseForm';
import LoanForm from '@/components/LoanForm';
import TransactionHistory from '@/components/TransactionHistory';
import axios from 'axios';
import styles from '@/styles/Dashboard.module.css';

export default function Dashboard() {
  const { user, signout } = useAuth();
  const router = useRouter();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [animationTrigger, setAnimationTrigger] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await axios.post('http://localhost:5000/get-user-data', {
        username: user.username,
        password: user.password
      });

      if (Array.isArray(response.data)) {
        calculateTotals(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (transactions) => {
    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount) || 0;
      
      if (transaction.type === 'income' || transaction.type === 'loanTaken') {
        income += amount;
      } else if (transaction.type === 'debit' || transaction.type === 'loanRepayment') {
        expense += amount;
      }
    });

    setTotalIncome(income);
    setTotalExpense(expense);
  };

  const handleIncomeAdded = (amount) => {
    setTotalIncome(prev => prev + amount);
    setAnimationTrigger({ type: 'income', amount, timestamp: Date.now() });
  };

  const handleExpenseAdded = (amount) => {
    setTotalExpense(prev => prev + amount);
    setAnimationTrigger({ type: 'expense', amount, timestamp: Date.now() });
  };

  const handleLoanAdded = (type, amount) => {
    if (type === 'taken') {
      setTotalIncome(prev => prev + amount);
    } else {
      setTotalExpense(prev => prev + amount);
    }
    fetchUserData(); // Refresh data
  };

  const handleSignout = () => {
    signout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - Financial Homie</title>
        <meta name="description" content="Your financial dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.headerTitle}>Financial Homie</h1>
            <p className={styles.headerSubtitle}>Welcome back, {user?.name || user?.username}!</p>
          </div>
          <div className={styles.headerActions}>
            <nav className={styles.nav}>
              <button onClick={() => router.push('/dashboard')} className={`${styles.navBtn} ${styles.navBtnActive}`}>
                Dashboard
              </button>
              <button onClick={() => router.push('/suggestions')} className={styles.navBtn}>
                AI Suggestions
              </button>
            </nav>
            <button onClick={handleSignout} className={styles.signoutBtn}>
              Sign Out
            </button>
          </div>
        </header>

        <main className={styles.main}>
          <section className={styles.chartSection}>
            <GamifiedPieChart 
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              animationTrigger={animationTrigger}
            />
          </section>

          <section className={styles.formsSection}>
            <div className={styles.formsGrid}>
              <IncomeForm onIncomeAdded={handleIncomeAdded} />
              <ExpenseForm onExpenseAdded={handleExpenseAdded} />
              <LoanForm onLoanAdded={handleLoanAdded} />
            </div>
          </section>

          <section className={styles.historySection}>
            <TransactionHistory />
          </section>
        </main>
      </div>
    </>
  );
}
