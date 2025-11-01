import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/TransactionHistory.module.css';

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'income', 'debit', 'loan'

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.post('http://localhost:5000/get-user-data', {
        username: user.username,
        password: user.password
      });

      if (Array.isArray(response.data)) {
        // Sort by date (most recent first)
        const sorted = response.data.sort((a, b) => 
          new Date(b.dateEntered) - new Date(a.dateEntered)
        );
        setTransactions(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    if (filter === 'all') return transactions;
    if (filter === 'loan') {
      return transactions.filter(t => 
        t.type === 'loanTaken' || t.type === 'loanRepayment'
      );
    }
    return transactions.filter(t => t.type === filter);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'income': return '↑';
      case 'debit': return '↓';
      case 'loanTaken': return '←';
      case 'loanRepayment': return '→';
      default: return '•';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'income': return '#000000';
      case 'debit': return '#525252';
      case 'loanTaken': return '#404040';
      case 'loanRepayment': return '#737373';
      default: return '#a3a3a3';
    }
  };

  const filteredTransactions = getFilteredTransactions();

  if (loading) {
    return <div className={styles.loading}>Loading transactions...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>● Transaction History</h2>
        <div className={styles.filterButtons}>
          <button 
            className={filter === 'all' ? styles.activeFilter : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'income' ? styles.activeFilter : ''}
            onClick={() => setFilter('income')}
          >
            Income
          </button>
          <button 
            className={filter === 'debit' ? styles.activeFilter : ''}
            onClick={() => setFilter('debit')}
          >
            Expenses
          </button>
          <button 
            className={filter === 'loan' ? styles.activeFilter : ''}
            onClick={() => setFilter('loan')}
          >
            Loans
          </button>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className={styles.empty}>
          <p>No transactions found</p>
        </div>
      ) : (
        <div className={styles.transactionList}>
          {filteredTransactions.map((transaction, index) => (
            <div 
              key={index} 
              className={styles.transactionItem}
              style={{ borderLeftColor: getTransactionColor(transaction.type) }}
            >
              <div className={styles.transactionIcon}>
                {getTransactionIcon(transaction.type)}
              </div>
              <div className={styles.transactionDetails}>
                <div className={styles.transactionType}>
                  {transaction.type === 'debit' ? 'Expense' : 
                   transaction.type === 'income' ? 'Income' :
                   transaction.type === 'loanTaken' ? 'Loan Taken' :
                   'Loan Repayment'}
                </div>
                <div className={styles.transactionMeta}>
                  {transaction.category && <span>Category: {transaction.category}</span>}
                  {transaction.source && <span>Source: {transaction.source}</span>}
                  {transaction.lender && <span>Lender: {transaction.lender}</span>}
                  {transaction.type === 'loanRepayment' && (
                    <span>
                      {transaction.is_paid_on_time ? '✓ On Time' : '⚠ Late'}
                    </span>
                  )}
                </div>
                <div className={styles.transactionDate}>
                  {new Date(transaction.dateEntered).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div 
                className={styles.transactionAmount}
                style={{ color: getTransactionColor(transaction.type) }}
              >
                {transaction.type === 'income' || transaction.type === 'loanTaken' ? '+' : '-'}
                ${transaction.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
