import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import Head from 'next/head';
import styles from '@/styles/SplitExpenses.module.css';
import Navbar from '@/components/Navbar';

export default function SplitExpenses() {
  const { user } = useAuth();
  const router = useRouter();
  const content = useTranslatedContent({
    title: 'Split Expenses - FinWise',
    loading: 'Loading your expenses...',
    friends: 'Friends',
    splitExpenses: 'Split Expenses',
    addFriend: 'Add Friend',
    sendRequest: 'Send Request',
    createExpense: 'Create Split Expense',
    balanceSummary: 'Balance Summary'
  });
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'expenses'
  const [loading, setLoading] = useState(true);
  
  // Friends state
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ received: [], sent: [] });
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [friendMessage, setFriendMessage] = useState('');
  
  // Expenses state
  const [expenses, setExpenses] = useState({ created: [], involved: [] });
  const [balanceSummary, setBalanceSummary] = useState({ you_owe: {}, owed_to_you: {} });
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    split_with: []
  });
  const [expenseMessage, setExpenseMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchFriends();
    fetchFriendRequests();
    fetchExpenses();
  }, [user, router]);

  const fetchFriends = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.password
        })
      });
      const data = await response.json();
      if (response.ok) {
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-friend-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.password
        })
      });
      const data = await response.json();
      if (response.ok) {
        setFriendRequests(data);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-split-expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.password
        })
      });
      const data = await response.json();
      if (response.ok) {
        setExpenses({
          created: data.created_expenses || [],
          involved: data.involved_expenses || []
        });
        setBalanceSummary({
          you_owe: data.you_owe || {},
          owed_to_you: data.owed_to_you || {}
        });
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    if (!newFriendUsername.trim()) {
      setFriendMessage('Please enter a username');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/send-friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.password,
          recipient_username: newFriendUsername.trim()
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setFriendMessage('✅ Friend request sent!');
        setNewFriendUsername('');
        fetchFriendRequests();
      } else {
        setFriendMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setFriendMessage('❌ Error sending friend request');
    }
  };

  const respondToRequest = async (senderUsername, action) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/respond-friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.password,
          sender_username: senderUsername,
          action: action
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setFriendMessage(action === 'approve' ? '✅ Friend request approved!' : '✅ Friend request declined');
        fetchFriends();
        fetchFriendRequests();
      } else {
        setFriendMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setFriendMessage('❌ Error responding to friend request');
    }
  };

  const removeFriend = async (friendUsername) => {
    if (!confirm(`Remove ${friendUsername} from your friends?`)) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/remove-friend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.password,
          friend_username: friendUsername
        })
      });
      
      if (response.ok) {
        setFriendMessage('✅ Friend removed');
        fetchFriends();
      } else {
        const data = await response.json();
        setFriendMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setFriendMessage('❌ Error removing friend');
    }
  };

  const toggleFriendSelection = (friendUsername) => {
    setNewExpense(prev => {
      const split_with = prev.split_with.includes(friendUsername)
        ? prev.split_with.filter(f => f !== friendUsername)
        : [...prev.split_with, friendUsername];
      return { ...prev, split_with };
    });
  };

  const createExpense = async (e) => {
    e.preventDefault();
    
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      setExpenseMessage('❌ Please enter a valid amount');
      return;
    }
    
    if (newExpense.split_with.length === 0) {
      setExpenseMessage('❌ Please select at least one friend to split with');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/create-split-expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.password,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          split_with: newExpense.split_with
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setExpenseMessage(`✅ Expense created! Each person owes $${data.amount_per_person}`);
        setNewExpense({ amount: '', description: '', split_with: [] });
        setShowCreateExpense(false);
        fetchExpenses();
      } else {
        setExpenseMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setExpenseMessage('❌ Error creating expense');
    }
  };

  const settleExpense = async (expenseId) => {
    if (!confirm('Mark this expense as settled?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/settle-expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          password: user.password,
          expense_id: expenseId
        })
      });
      
      if (response.ok) {
        setExpenseMessage('✅ Expense settled!');
        fetchExpenses();
      } else {
        const data = await response.json();
        setExpenseMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setExpenseMessage('❌ Error settling expense');
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>{content.loading}</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{content.title}</title>
        <meta name="description" content="Split expenses with friends - FinWise" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        <Navbar currentPage="/split-expenses" />

        <main className={styles.main}>
          <div className={styles.content}>
            <header className={styles.header}>
              <h1 className={styles.title}>💰 {content.splitExpenses}</h1>
            </header>
            
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'friends' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                👥 {content.friends}
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'expenses' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('expenses')}
              >
                💸 {content.splitExpenses}
              </button>
            </div>

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className={styles.tabContent}>
            {friendMessage && (
              <div className={styles.message}>{friendMessage}</div>
            )}

            {/* Add Friend Form */}
            <div className={styles.card}>
              <h2>Add Friend</h2>
              <form onSubmit={sendFriendRequest} className={styles.form}>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={newFriendUsername}
                  onChange={(e) => setNewFriendUsername(e.target.value)}
                  className={styles.input}
                />
                <button type="submit" className={styles.button}>
                  Send Request
                </button>
              </form>
            </div>

            {/* Pending Friend Requests */}
            {friendRequests.received.length > 0 && (
              <div className={styles.card}>
                <h2>Splitting Requests ({friendRequests.received.length})</h2>
                <div className={styles.requestsList}>
                  {friendRequests.received.map((request, index) => (
                    <div key={index} className={styles.requestItem}>
                      <span className={styles.requestUsername}>
                        {request.sender}
                      </span>
                      <div className={styles.requestActions}>
                        <button
                          onClick={() => respondToRequest(request.sender, 'approve')}
                          className={styles.approveButton}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => respondToRequest(request.sender, 'decline')}
                          className={styles.declineButton}
                        >
                          ✗ Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {friendRequests.sent.length > 0 && (
              <div className={styles.card}>
                <h2>Sent Requests ({friendRequests.sent.length})</h2>
                <div className={styles.sentList}>
                  {friendRequests.sent.map((request, index) => (
                    <div key={index} className={styles.sentItem}>
                      <span>{request.recipient}</span>
                      <span className={styles.pendingBadge}>Pending</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className={styles.card}>
              <h2>My Friends ({friends.length})</h2>
              {friends.length === 0 ? (
                <p className={styles.emptyState}>No friends yet. Add some friends to start splitting expenses!</p>
              ) : (
                <div className={styles.friendsList}>
                  {friends.map((friend, index) => (
                    <div key={index} className={styles.friendItem}>
                      <span className={styles.friendUsername}>👤 {friend}</span>
                      <button
                        onClick={() => removeFriend(friend)}
                        className={styles.removeButton}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
              <div className={styles.tabContent}>
                {expenseMessage && (
                  <div className={styles.message}>{expenseMessage}</div>
                )}

                {/* Balance Summary */}
                <div className={styles.balanceCard}>
                  <h2>💰 {content.balanceSummary}</h2>
              <div className={styles.balanceGrid}>
                <div className={styles.balanceSection}>
                  <h3 className={styles.owedTitle}>You Owe</h3>
                  {Object.keys(balanceSummary.you_owe).length === 0 ? (
                    <p className={styles.noBalance}>Nothing to pay! 🎉</p>
                  ) : (
                    <div className={styles.balanceList}>
                      {Object.entries(balanceSummary.you_owe).map(([friend, amount]) => (
                        <div key={friend} className={styles.balanceItem}>
                          <span>{friend}</span>
                          <span className={styles.amountOwed}>${amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.balanceSection}>
                  <h3 className={styles.owedToTitle}>Owed to You</h3>
                  {Object.keys(balanceSummary.owed_to_you).length === 0 ? (
                    <p className={styles.noBalance}>Nobody owes you 💸</p>
                  ) : (
                    <div className={styles.balanceList}>
                      {Object.entries(balanceSummary.owed_to_you).map(([friend, amount]) => (
                        <div key={friend} className={styles.balanceItem}>
                          <span>{friend}</span>
                          <span className={styles.amountOwedToYou}>${amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Create Expense Button */}
            {friends.length > 0 && (
              <button
                onClick={() => setShowCreateExpense(!showCreateExpense)}
                className={styles.createButton}
              >
                {showCreateExpense ? '✗ Cancel' : '+ Create Split Expense'}
              </button>
            )}

            {/* Create Expense Form */}
            {showCreateExpense && (
              <div className={styles.card}>
                <h2>Create Split Expense</h2>
                <form onSubmit={createExpense} className={styles.expenseForm}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount ($)"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className={styles.input}
                  />
                  
                  <h3>Select Friends to Split With:</h3>
                  <div className={styles.friendsCheckboxList}>
                    {friends.map((friend, index) => (
                      <label key={index} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={newExpense.split_with.includes(friend)}
                          onChange={() => toggleFriendSelection(friend)}
                          className={styles.checkbox}
                        />
                        <span>{friend}</span>
                      </label>
                    ))}
                  </div>
                  
                  {newExpense.split_with.length > 0 && newExpense.amount > 0 && (
                    <div className={styles.splitPreview}>
                      <p>Total People: {newExpense.split_with.length + 1} (You + {newExpense.split_with.length} friends)</p>
                      <p>Each person pays: ${(parseFloat(newExpense.amount) / (newExpense.split_with.length + 1)).toFixed(2)}</p>
                    </div>
                  )}
                  
                  <button type="submit" className={styles.button}>
                    Create Expense
                  </button>
                </form>
              </div>
            )}

            {/* Expenses You Created */}
            <div className={styles.card}>
              <h2>Expenses You Created ({expenses.created.filter(e => !e.settled).length})</h2>
              {expenses.created.length === 0 ? (
                <p className={styles.emptyState}>You haven't created any expenses yet.</p>
              ) : (
                <div className={styles.expensesList}>
                  {expenses.created.map((expense) => (
                    <div key={expense.expense_id} className={`${styles.expenseItem} ${expense.settled ? styles.settledExpense : ''}`}>
                      <div className={styles.expenseHeader}>
                        <h3>{expense.description || 'Expense'}</h3>
                        <span className={styles.expenseAmount}>${expense.amount.toFixed(2)}</span>
                      </div>
                      <div className={styles.expenseDetails}>
                        <p>Date: {expense.dateCreated}</p>
                        <p>Split with: {expense.split_with.join(', ')}</p>
                        <p>Each person: ${expense.amount_per_person.toFixed(2)}</p>
                        {expense.settled && (
                          <span className={styles.settledBadge}>✓ Settled</span>
                        )}
                      </div>
                      {!expense.settled && (
                        <button
                          onClick={() => settleExpense(expense.expense_id)}
                          className={styles.settleButton}
                        >
                          Mark as Settled
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expenses You're Part Of */}
            <div className={styles.card}>
              <h2>Expenses You're Part Of ({expenses.involved.filter(e => !e.settled).length})</h2>
              {expenses.involved.length === 0 ? (
                <p className={styles.emptyState}>No expenses shared with you yet.</p>
              ) : (
                <div className={styles.expensesList}>
                  {expenses.involved.map((expense) => (
                    <div key={expense.expense_id} className={`${styles.expenseItem} ${expense.settled ? styles.settledExpense : ''}`}>
                      <div className={styles.expenseHeader}>
                        <h3>{expense.description || 'Expense'}</h3>
                        <span className={styles.expenseAmount}>${expense.amount.toFixed(2)}</span>
                      </div>
                      <div className={styles.expenseDetails}>
                        <p>Created by: {expense.created_by}</p>
                        <p>Date: {expense.dateCreated}</p>
                        <p>You owe: ${expense.balances[user.username].toFixed(2)}</p>
                        {expense.settled && (
                          <span className={styles.settledBadge}>✓ Settled</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        </main>
      </div>
    </>
  );
}
