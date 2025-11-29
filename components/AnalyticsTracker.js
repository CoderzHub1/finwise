import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/Analytics.module.css';

const TIME_FRAMES = [
  { value: '1week', label: '1 Week' },
  { value: '1month', label: '1 Month' },
  { value: '3months', label: '3 Months' },
  { value: '6months', label: '6 Months' },
  { value: '1year', label: '1 Year' }
];

export default function AnalyticsTracker() {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState('1month');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('income'); // income, expenses, loans, limits
  const [userLimits, setUserLimits] = useState({});

  useEffect(() => {
    if (user) {
      fetchAnalytics();
      fetchUserLimits();
    }
  }, [user, timeFrame]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-analytics`, {
        username: user.username,
        password: user.password,
        time_frame: timeFrame
      });

      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLimits = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-user-limits`, {
        username: user.username,
        password: user.password
      });

      if (response.data.limits) {
        setUserLimits(response.data.limits);
      }
    } catch (err) {
      console.error('Failed to fetch user limits:', err);
    }
  };

  const calculatePercentage = (amount, total) => {
    if (total === 0) return 0;
    return ((amount / total) * 100).toFixed(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderIncomeBreakdown = () => {
    if (!analyticsData?.income?.by_source || Object.keys(analyticsData.income.by_source).length === 0) {
      return <div className={styles.noData}>No income data for this period</div>;
    }

    return (
      <div className={styles.breakdown}>
        <div className={styles.breakdownHeader}>
          <h3>Income by Source</h3>
          <div className={styles.total}>
            Total: <span className={styles.totalAmount}>{formatCurrency(analyticsData.income.total)}</span>
          </div>
        </div>
        <div className={styles.itemsList}>
          {Object.entries(analyticsData.income.by_source).map(([source, amount]) => (
            <div key={source} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>{source}</span>
                <span className={styles.itemAmount}>{formatCurrency(amount)}</span>
              </div>
              <div className={styles.itemBar}>
                <div 
                  className={styles.itemBarFill}
                  style={{ 
                    width: `${calculatePercentage(amount, analyticsData.income.total)}%`,
                    background: 'linear-gradient(90deg, #10b981, #059669)'
                  }}
                />
              </div>
              <div className={styles.itemPercentage}>
                {calculatePercentage(amount, analyticsData.income.total)}% of total income
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExpenseBreakdown = () => {
    if (!analyticsData?.expenses?.by_category || Object.keys(analyticsData.expenses.by_category).length === 0) {
      return <div className={styles.noData}>No expense data for this period</div>;
    }

    return (
      <div className={styles.breakdown}>
        <div className={styles.breakdownHeader}>
          <h3>Expenses by Category</h3>
          <div className={styles.total}>
            Total: <span className={styles.totalAmount}>{formatCurrency(analyticsData.expenses.total)}</span>
          </div>
        </div>
        <div className={styles.itemsList}>
          {Object.entries(analyticsData.expenses.by_category).map(([category, amount]) => (
            <div key={category} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>{category}</span>
                <span className={styles.itemAmount}>{formatCurrency(amount)}</span>
              </div>
              <div className={styles.itemBar}>
                <div 
                  className={styles.itemBarFill}
                  style={{ 
                    width: `${calculatePercentage(amount, analyticsData.expenses.total)}%`,
                    background: 'linear-gradient(90deg, #ef4444, #dc2626)'
                  }}
                />
              </div>
              <div className={styles.itemPercentage}>
                {calculatePercentage(amount, analyticsData.expenses.total)}% of total expenses
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLoansBreakdown = () => {
    const hasLoansTaken = analyticsData?.loans?.taken?.by_lender && 
                          Object.keys(analyticsData.loans.taken.by_lender).length > 0;
    const hasRepayments = analyticsData?.loans?.repayments?.by_lender && 
                          Object.keys(analyticsData.loans.repayments.by_lender).length > 0;

    if (!hasLoansTaken && !hasRepayments) {
      return <div className={styles.noData}>No loan data for this period</div>;
    }

    return (
      <div className={styles.breakdown}>
        {hasLoansTaken && (
          <div className={styles.loanSection}>
            <div className={styles.breakdownHeader}>
              <h3>Loans Taken</h3>
              <div className={styles.total}>
                Total: <span className={styles.totalAmount}>{formatCurrency(analyticsData.loans.taken.total)}</span>
              </div>
            </div>
            <div className={styles.itemsList}>
              {Object.entries(analyticsData.loans.taken.by_lender).map(([lender, amount]) => (
                <div key={`taken-${lender}`} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemName}>{lender}</span>
                    <span className={styles.itemAmount}>{formatCurrency(amount)}</span>
                  </div>
                  <div className={styles.itemBar}>
                    <div 
                      className={styles.itemBarFill}
                      style={{ 
                        width: `${calculatePercentage(amount, analyticsData.loans.taken.total)}%`,
                        background: 'linear-gradient(90deg, #f59e0b, #d97706)'
                      }}
                    />
                  </div>
                  <div className={styles.itemPercentage}>
                    {calculatePercentage(amount, analyticsData.loans.taken.total)}% of total loans
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasRepayments && (
          <div className={styles.loanSection}>
            <div className={styles.breakdownHeader}>
              <h3>Loan Repayments</h3>
              <div className={styles.total}>
                Total: <span className={styles.totalAmount}>{formatCurrency(analyticsData.loans.repayments.total)}</span>
              </div>
            </div>
            <div className={styles.itemsList}>
              {Object.entries(analyticsData.loans.repayments.by_lender).map(([lender, amount]) => (
                <div key={`repay-${lender}`} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemName}>{lender}</span>
                    <span className={styles.itemAmount}>{formatCurrency(amount)}</span>
                  </div>
                  <div className={styles.itemBar}>
                    <div 
                      className={styles.itemBarFill}
                      style={{ 
                        width: `${calculatePercentage(amount, analyticsData.loans.repayments.total)}%`,
                        background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)'
                      }}
                    />
                  </div>
                  <div className={styles.itemPercentage}>
                    {calculatePercentage(amount, analyticsData.loans.repayments.total)}% of total repayments
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLimitsCheck = () => {
    if (!analyticsData?.expenses?.by_category || Object.keys(analyticsData.expenses.by_category).length === 0) {
      return <div className={styles.noData}>No expense data to compare with limits</div>;
    }

    if (!userLimits || Object.keys(userLimits).length === 0) {
      return <div className={styles.noData}>No spending limits set. Go to My Account to set limits.</div>;
    }

    const totalIncome = analyticsData.income.total;
    const expensesByCategory = analyticsData.expenses.by_category;

    // Calculate limit status for each category
    const limitStatuses = Object.entries(userLimits).map(([category, limitPercent]) => {
      const actualSpent = expensesByCategory[category] || 0;
      const limitAmount = (totalIncome * limitPercent) / 100;
      const usedPercent = totalIncome > 0 ? (actualSpent / limitAmount) * 100 : 0;
      const isBreached = actualSpent > limitAmount;
      const isWarning = usedPercent > 80 && !isBreached;

      return {
        category,
        limitPercent,
        limitAmount,
        actualSpent,
        usedPercent: Math.min(usedPercent, 200), // Cap at 200% for display
        isBreached,
        isWarning,
        difference: actualSpent - limitAmount
      };
    });

    // Sort: breached first, then warnings, then by usage percentage
    limitStatuses.sort((a, b) => {
      if (a.isBreached && !b.isBreached) return -1;
      if (!a.isBreached && b.isBreached) return 1;
      if (a.isWarning && !b.isWarning) return -1;
      if (!a.isWarning && b.isWarning) return 1;
      return b.usedPercent - a.usedPercent;
    });

    const breachedCount = limitStatuses.filter(s => s.isBreached).length;
    const warningCount = limitStatuses.filter(s => s.isWarning).length;

    return (
      <div className={styles.breakdown}>
        <div className={styles.breakdownHeader}>
          <h3>Budget Limits Status</h3>
          <div className={styles.limitsStats}>
            {breachedCount > 0 && (
              <span className={styles.breachedBadge}>
                {breachedCount} Breached
              </span>
            )}
            {warningCount > 0 && (
              <span className={styles.warningBadge}>
                {warningCount} Warning
              </span>
            )}
            {breachedCount === 0 && warningCount === 0 && (
              <span className={styles.goodBadge}>
                All Within Limits ✓
              </span>
            )}
          </div>
        </div>

        {totalIncome === 0 && (
          <div className={styles.infoBox}>
            <strong>Note:</strong> No income recorded for this period. Limits are calculated as percentage of income.
          </div>
        )}

        <div className={styles.itemsList}>
          {limitStatuses.map(({ category, limitPercent, limitAmount, actualSpent, usedPercent, isBreached, isWarning, difference }) => (
            <div 
              key={category} 
              className={`${styles.item} ${styles.limitItem} ${isBreached ? styles.breached : ''} ${isWarning ? styles.warning : ''}`}
            >
              <div className={styles.itemHeader}>
                <div className={styles.limitCategoryInfo}>
                  <span className={styles.itemName}>{category}</span>
                  <span className={styles.limitPercentLabel}>{limitPercent}% of income</span>
                </div>
                <div className={styles.limitAmounts}>
                  <div className={styles.limitColumn}>
                    <span className={styles.limitLabel}>Limit</span>
                    <span className={styles.limitValue}>{formatCurrency(limitAmount)}</span>
                  </div>
                  <div className={styles.limitColumn}>
                    <span className={styles.limitLabel}>Spent</span>
                    <span className={`${styles.limitValue} ${isBreached ? styles.breachedText : ''}`}>
                      {formatCurrency(actualSpent)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.limitBarContainer}>
                <div className={styles.itemBar}>
                  <div 
                    className={styles.itemBarFill}
                    style={{ 
                      width: `${Math.min(usedPercent, 100)}%`,
                      background: isBreached 
                        ? 'linear-gradient(90deg, #dc2626, #991b1b)'
                        : isWarning
                        ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                        : 'linear-gradient(90deg, #10b981, #059669)'
                    }}
                  />
                  {/* {usedPercent > 100 && (
                    // <div 
                    //   className={styles.overageBar}
                    //   style={{ 
                    //     width: `${Math.min(usedPercent - 100, 100)}%`
                    //   }}
                    // />
                  )} */}
                </div>
                <div className={styles.limitPercentage}>
                  <span className={isBreached ? styles.breachedText : isWarning ? styles.warningText : ''}>
                    {usedPercent.toFixed(1)}% used
                  </span>
                </div>
              </div>

              {isBreached && (
                <div className={styles.breachAlert}>
                  <strong>⚠️ Over budget by {formatCurrency(Math.abs(difference))}</strong>
                </div>
              )}
              {isWarning && !isBreached && (
                <div className={styles.warningAlert}>
                  <strong>⚡ Approaching limit - {formatCurrency(limitAmount - actualSpent)} remaining</strong>
                </div>
              )}
              {!isBreached && !isWarning && (
                <div className={styles.goodAlert}>
                  ✓ {formatCurrency(limitAmount - actualSpent)} remaining
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.limitsSummary}>
          <h4>Summary for {TIME_FRAMES.find(tf => tf.value === timeFrame)?.label || timeFrame}</h4>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Income:</span>
              <span className={styles.summaryValue}>{formatCurrency(totalIncome)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Expenses:</span>
              <span className={styles.summaryValue}>{formatCurrency(analyticsData.expenses.total)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Budget Allocated:</span>
              <span className={styles.summaryValue}>
                {formatCurrency(Object.values(userLimits).reduce((sum, percent) => sum + ((totalIncome * percent) / 100), 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !analyticsData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2>Financial Analytics</h2>
          <div className={styles.timeFrameSelector}>
            <label>Time Period:</label>
            <select 
              value={timeFrame} 
              onChange={(e) => setTimeFrame(e.target.value)}
              className={styles.timeFrameSelect}
            >
              {TIME_FRAMES.map(tf => (
                <option key={tf.value} value={tf.value}>{tf.label}</option>
              ))}
            </select>
          </div>
        </div>

        {analyticsData && (
          <div className={styles.dateRange}>
            {new Date(analyticsData.start_date).toLocaleDateString()} - {new Date(analyticsData.end_date).toLocaleDateString()}
          </div>
        )}
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {analyticsData && (
        <>
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard} style={{ borderColor: '#10b981' }}>
              <div className={styles.cardLabel}>Total Income</div>
              <div className={styles.cardValue} style={{ color: '#10b981' }}>
                {formatCurrency(analyticsData.income.total)}
              </div>
            </div>
            <div className={styles.summaryCard} style={{ borderColor: '#ef4444' }}>
              <div className={styles.cardLabel}>Total Expenses</div>
              <div className={styles.cardValue} style={{ color: '#ef4444' }}>
                {formatCurrency(analyticsData.expenses.total)}
              </div>
            </div>
            <div className={styles.summaryCard} style={{ borderColor: '#3b82f6' }}>
              <div className={styles.cardLabel}>Net Balance</div>
              <div className={styles.cardValue} style={{ 
                color: analyticsData.net_balance >= 0 ? '#10b981' : '#ef4444' 
              }}>
                {formatCurrency(analyticsData.net_balance)}
              </div>
            </div>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'income' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('income')}
            >
              Income Sources
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'expenses' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              Expense Categories
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'loans' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('loans')}
            >
              Loans
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'limits' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('limits')}
            >
              Budget Limits
            </button>
          </div>

          <div className={styles.content}>
            {loading ? (
              <div className={styles.contentLoading}>
                <div className={styles.spinner}></div>
                <p>Updating...</p>
              </div>
            ) : (
              <>
                {activeTab === 'income' && renderIncomeBreakdown()}
                {activeTab === 'expenses' && renderExpenseBreakdown()}
                {activeTab === 'loans' && renderLoansBreakdown()}
                {activeTab === 'limits' && renderLimitsCheck()}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
