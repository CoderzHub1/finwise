import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import styles from '@/styles/Rewards.module.css';

export default function Rewards() {
  const { user } = useAuth();
  const router = useRouter();
  const [rewardsData, setRewardsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      fetchRewards();
    }
  }, [user, router]);

  const fetchRewards = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/get-rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          password: user.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRewardsData(data);
      } else {
        setError(data.error || 'Failed to fetch rewards');
      }
    } catch (err) {
      setError('An error occurred while fetching rewards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Rewards - FinWise</title>
        </Head>
        <div className={styles.pageContainer}>
          <Navbar currentPage="/rewards" />
          <main className={styles.mainContent}>
            <div className={styles.loading}>Loading rewards...</div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Rewards - FinWise</title>
        <meta name="description" content="Your reward points and achievements" />
      </Head>
      <div className={styles.pageContainer}>
        <Navbar currentPage="/rewards" />
        
        <main className={styles.mainContent}>
          <div className={styles.rewardsContainer}>
            <h1 className={styles.title}>🏆 Your Rewards</h1>
            
            {error && <div className={styles.error}>{error}</div>}
            
            {rewardsData && (
              <>
                <div className={styles.pointsCard}>
                  <div className={styles.pointsDisplay}>
                    <div className={styles.pointsIcon}>⭐</div>
                    <div className={styles.pointsInfo}>
                      <h2 className={styles.pointsTitle}>Total Points</h2>
                      <div className={styles.pointsValue}>{rewardsData.reward_points}</div>
                      {rewardsData.transaction_count !== undefined && (
                        <div className={styles.transactionProgress}>
                          {rewardsData.transaction_count < 5 ? (
                            <>
                              <span className={styles.progressText}>
                                {rewardsData.transaction_count}/5 transactions
                              </span>
                              <span className={styles.progressHint}>
                                ({5 - rewardsData.transaction_count} more for full bonus!)
                              </span>
                            </>
                          ) : (
                            <span className={styles.progressComplete}>
                              ✓ All 5 transaction bonuses earned!
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {rewardsData.has_new_bonuses && rewardsData.streak_bonuses && (
                  <div className={styles.bonusAlert}>
                    <h2 className={styles.bonusTitle}>🎉 Congratulations!</h2>
                    {rewardsData.streak_bonuses.map((bonus, index) => (
                      <div key={index} className={styles.bonusItem}>
                        <span className={styles.bonusMessage}>{bonus.message}</span>
                        <span className={styles.bonusPoints}>+{bonus.points} points</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.achievementsSection}>
                  <h2 className={styles.sectionTitle}>🎯 How to Earn Points</h2>
                  
                  <div className={styles.achievementsList}>
                    <div className={styles.achievementCard}>
                      <div className={styles.achievementIcon}>💰</div>
                      <div className={styles.achievementInfo}>
                        <h4>Add Income</h4>
                        <p>+10 points (first 5 only)</p>
                      </div>
                    </div>

                    <div className={styles.achievementCard}>
                      <div className={styles.achievementIcon}>💸</div>
                      <div className={styles.achievementInfo}>
                        <h4>Add Expense</h4>
                        <p>+10 points (first 5, if within limit)</p>
                      </div>
                    </div>

                    <div className={styles.achievementCard}>
                      <div className={styles.achievementIcon}>⚠️</div>
                      <div className={styles.achievementInfo}>
                        <h4>Expense Over Limit</h4>
                        <p>-30 points penalty (always applied!)</p>
                      </div>
                    </div>

                    <div className={styles.achievementCard}>
                      <div className={styles.achievementIcon}>💳</div>
                      <div className={styles.achievementInfo}>
                        <h4>Add Loan</h4>
                        <p>+10 points (first 5 only)</p>
                      </div>
                    </div>

                    <div className={styles.achievementCard}>
                      <div className={styles.achievementIcon}>✅</div>
                      <div className={styles.achievementInfo}>
                        <h4>Timely Loan Repayment</h4>
                        <p>+50 bonus (always!) + 10 base (first 5)</p>
                      </div>
                    </div>

                    <div className={styles.achievementCard}>
                      <div className={styles.achievementIcon}>🔥</div>
                      <div className={styles.achievementInfo}>
                        <h4>Weekly Limit Streak</h4>
                        <p>+25 points for no limit overflow</p>
                      </div>
                    </div>

                    <div className={styles.achievementCard}>
                      <div className={styles.achievementIcon}>🏅</div>
                      <div className={styles.achievementInfo}>
                        <h4>Monthly Compliance</h4>
                        <p>Up to +100 points based on limits</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.rulesLink}>
                  <button 
                    className={styles.rulesButton}
                    onClick={() => router.push('/game-rules')}
                  >
                    📖 View Detailed Game Rules
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
