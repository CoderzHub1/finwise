import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import styles from '@/styles/GameRules.module.css';

export default function GameRules() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Game Rules - FinWise</title>
        <meta name="description" content="Learn how to earn points and rewards" />
      </Head>
      <div className={styles.pageContainer}>
        <Navbar currentPage="/game-rules" />
        
        <main className={styles.mainContent}>
          <div className={styles.rulesContainer}>
            <div className={styles.header}>
              <h1 className={styles.title}>🎮 FinWise Rewards Game</h1>
              <p className={styles.subtitle}>
                Build healthy financial habits and earn rewards!
              </p>
            </div>

            <div className={styles.introSection}>
              <div className={styles.introCard}>
                <div className={styles.introIcon}>🎯</div>
                <h2>Your Mission</h2>
                <p>
                  The FinWise Rewards Game is designed to encourage you to stay within your 
                  budget limits and actively track your finances. Every action you take 
                  earns you points automatically - the more consistent you are, the more you earn! 
                  All bonuses and streaks are tracked and awarded automatically.
                </p>
              </div>
            </div>

            <div className={styles.rulesSection}>
              <h2 className={styles.sectionTitle}>📜 How to Earn Points</h2>
              
              <div className={styles.rulesList}>
                <div className={styles.ruleCard}>
                  <div className={styles.ruleNumber}>1</div>
                  <div className={styles.ruleContent}>
                    <div className={styles.ruleHeader}>
                      <div className={styles.ruleIcon}>💰💸💳</div>
                      <h3>Track Your Finances</h3>
                      <div className={styles.rulePoints}>+10 points</div>
                    </div>
                    <p>
                      Earn <strong>10 points</strong> for each of your <strong>first 20 transactions</strong>:
                    </p>
                    <ul>
                      <li>An income entry (salary, freelance, etc.)</li>
                      <li>An expense/transaction</li>
                      <li>A loan taken</li>
                      <li>A loan repayment</li>
                    </ul>
                    <div className={styles.ruleTip}>
                      💡 <strong>Important:</strong> Only the first 20 transactions earn points to encourage early adoption!
                    </div>
                  </div>
                </div>

                <div className={styles.ruleCard}>
                  <div className={styles.ruleNumber}>2</div>
                  <div className={styles.ruleContent}>
                    <div className={styles.ruleHeader}>
                      <div className={styles.ruleIcon}>✅</div>
                      <h3>Timely Loan Repayment</h3>
                      <div className={styles.rulePoints}>+60 points</div>
                    </div>
                    <p>
                      Pay your loans on time and earn <strong>up to 60 points</strong>:
                    </p>
                    <ul>
                      <li>10 points for recording the repayment (first 20 transactions only)</li>
                      <li>50 bonus points for paying on time (always awarded!)</li>
                    </ul>
                    <div className={styles.ruleTip}>
                      💡 <strong>Tip:</strong> The 50-point bonus is always available, even after 20 transactions!
                    </div>
                  </div>
                </div>

                <div className={styles.ruleCard}>
                  <div className={styles.ruleNumber}>3</div>
                  <div className={styles.ruleContent}>
                    <div className={styles.ruleHeader}>
                      <div className={styles.ruleIcon}>🔥</div>
                      <h3>Weekly Limit Streak</h3>
                      <div className={styles.rulePoints}>+25 points</div>
                    </div>
                    <p>
                      Stay within your budget limits for an entire week (Monday to Sunday) 
                      and earn <strong>25 points</strong>!
                    </p>
                    <div className={styles.weekExample}>
                      <div className={styles.weekLabel}>Week starts:</div>
                      <div className={styles.weekDays}>Monday</div>
                    </div>
                    <p>
                      If you don't exceed any of your category spending limits throughout 
                      the week, you'll automatically earn the bonus when you next log in 
                      or view your dashboard.
                    </p>
                    <div className={styles.ruleTip}>
                      💡 <strong>Tip:</strong> Streaks are checked automatically - just stay within your limits!
                    </div>
                  </div>
                </div>

                <div className={styles.ruleCard}>
                  <div className={styles.ruleNumber}>4</div>
                  <div className={styles.ruleContent}>
                    <div className={styles.ruleHeader}>
                      <div className={styles.ruleIcon}>🏅</div>
                      <h3>Monthly Compliance Bonus</h3>
                      <div className={styles.rulePoints}>Up to +100 points</div>
                    </div>
                    <p>
                      At the end of each month, earn points based on how many category 
                      limits you stayed within:
                    </p>
                    <div className={styles.formula}>
                      <div className={styles.formulaTitle}>Formula:</div>
                      <div className={styles.formulaBox}>
                        Points = 100 × (Total Limits - Exceeded Limits) ÷ Total Limits
                      </div>
                    </div>
                    <div className={styles.exampleBox}>
                      <div className={styles.exampleTitle}>Examples:</div>
                      <ul>
                        <li>✅ 0 limits exceeded out of 9 = <strong>100 points</strong></li>
                        <li>⚠️ 1 limit exceeded out of 9 = <strong>89 points</strong></li>
                        <li>⚠️ 3 limits exceeded out of 9 = <strong>67 points</strong></li>
                        <li>❌ All limits exceeded = <strong>0 points</strong></li>
                      </ul>
                    </div>
                    <div className={styles.ruleTip}>
                      💡 <strong>Tip:</strong> The better you manage your spending, the more points you earn!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.strategiesSection}>
              <h2 className={styles.sectionTitle}>🎯 Winning Strategies</h2>
              
              <div className={styles.strategiesGrid}>
                <div className={styles.strategyCard}>
                  <div className={styles.strategyIcon}>📊</div>
                  <h3>Track Consistently</h3>
                  <p>
                    Add every income and expense as it happens. This not only earns you 
                    points but also gives you better financial insights.
                  </p>
                </div>

                <div className={styles.strategyCard}>
                  <div className={styles.strategyIcon}>⚖️</div>
                  <h3>Set Realistic Limits</h3>
                  <p>
                    Configure category limits that match your lifestyle. Too strict limits 
                    are hard to maintain; too loose won't help you save.
                  </p>
                </div>

                <div className={styles.strategyCard}>
                  <div className={styles.strategyIcon}>📅</div>
                  <h3>Pay Loans on Time</h3>
                  <p>
                    Set reminders for loan due dates. The 50-point bonus for timely 
                    repayment is significant!
                  </p>
                </div>

                <div className={styles.strategyCard}>
                  <div className={styles.strategyIcon}>🔍</div>
                  <h3>Monitor Your Progress</h3>
                  <p>
                    Check the Analytics page regularly to see where you stand with 
                    your limits before the week or month ends.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.ctaSection}>
              <h2>Ready to Start Earning? 🚀</h2>
              <p>Head to your dashboard and start tracking your finances to earn points!</p>
              <div className={styles.ctaButtons}>
                <button 
                  className={styles.primaryButton}
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                </button>
                <button 
                  className={styles.secondaryButton}
                  onClick={() => router.push('/rewards')}
                >
                  View My Rewards
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
