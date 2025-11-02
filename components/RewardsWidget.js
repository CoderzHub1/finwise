import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import styles from '@/styles/RewardsWidget.module.css';

export default function RewardsWidget({ refreshTrigger }) {
  const { user } = useAuth();
  const router = useRouter();
  const content = useTranslatedContent({
    title: 'Rewards',
    points: 'Points',
    viewRewards: 'View Rewards',
    earnedPoints: 'earned',
    loading: 'Loading...'
  });
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [streakBonuses, setStreakBonuses] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pointsGained, setPointsGained] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const intervalRef = useRef(null);
  const previousPointsRef = useRef(0);

  // Fetch points function with useCallback to avoid recreating
  const fetchPoints = useCallback(async () => {
    if (!user) return;
    
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
        const newPoints = data.reward_points || 0;
        const prevPoints = previousPointsRef.current;
        
        setPoints(newPoints);
        setTransactionCount(data.transaction_count || 0);
        
        // Calculate points gained or lost since last check
        if (prevPoints > 0 && newPoints !== prevPoints) {
          const gained = newPoints - prevPoints;
          setPointsGained(gained);
          
          // Show celebration/penalty popup for point changes
          if (gained !== 0) {
            setShowCelebration(true);
            setTimeout(() => {
              setShowCelebration(false);
              setPointsGained(0);
            }, 5000);
          }
        }
        
        // Check for NEW bonuses using localStorage to prevent duplicates
        console.log('Bonus check:', {
          has_new_bonuses: data.has_new_bonuses,
          streak_bonuses: data.streak_bonuses,
          bonus_id: data.bonus_id
        });
        
        if (data.has_new_bonuses && data.streak_bonuses && data.streak_bonuses.length > 0 && data.bonus_id) {
          const shownBonuses = JSON.parse(localStorage.getItem('shownBonuses') || '[]');
          console.log('Shown bonuses:', shownBonuses);
          console.log('Current bonus_id:', data.bonus_id);
          
          // Only show if this bonus_id hasn't been shown before
          if (!shownBonuses.includes(data.bonus_id)) {
            console.log('🎉 Showing celebration!');
            // Calculate total bonus points
            const totalBonusPoints = data.streak_bonuses.reduce((sum, bonus) => sum + bonus.points, 0);
            setPointsGained(totalBonusPoints);
            setStreakBonuses(data.streak_bonuses);
            setShowCelebration(true);
            
            // Mark this bonus as shown
            shownBonuses.push(data.bonus_id);
            localStorage.setItem('shownBonuses', JSON.stringify(shownBonuses));
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
              setStreakBonuses([]);
              setShowCelebration(false);
              setPointsGained(0);
            }, 5000);
          } else {
            console.log('Bonus already shown');
          }
        } else {
          console.log('No new bonuses to show');
        }
        
        previousPointsRef.current = newPoints;
      }
    } catch (err) {
      console.error('Failed to fetch points:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch and setup polling
  useEffect(() => {
    if (user) {
      fetchPoints();
      
      // Set up polling every 60 seconds (1 minute)
      intervalRef.current = setInterval(() => {
        fetchPoints();
      }, 60000); // 60000ms = 1 minute
      
      // Cleanup interval on unmount
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [user, fetchPoints]);

  // Refresh when external trigger changes (from form submissions)
  useEffect(() => {
    if (refreshTrigger && user) {
      fetchPoints();
    }
  }, [refreshTrigger, user, fetchPoints]);

  if (!user || loading) {
    return null;
  }

  return (
    <>
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className={styles.celebrationOverlay}>
          <div className={styles.celebrationContent}>
            {streakBonuses.length > 0 ? (
              <>
                <div className={styles.celebrationEmoji}>🎉</div>
                <h2 className={styles.celebrationTitle}>Amazing!</h2>
                {streakBonuses.map((bonus, index) => (
                  <div key={index} className={styles.celebrationBonus}>
                    <div className={styles.celebrationMessage}>{bonus.message}</div>
                    <div className={styles.celebrationPoints}>+{bonus.points} points</div>
                  </div>
                ))}
              </>
            ) : pointsGained > 0 ? (
              <>
                <div className={styles.celebrationEmoji}>⭐</div>
                <h2 className={styles.celebrationTitle}>Points Earned!</h2>
                <div className={styles.celebrationPoints}>+{pointsGained}</div>
              </>
            ) : pointsGained < 0 ? (
              <>
                <div className={styles.celebrationEmoji}>⚠️</div>
                <h2 className={styles.celebrationTitle}>Limit Exceeded!</h2>
                <div className={styles.celebrationPenalty}>{pointsGained} points</div>
                <div className={styles.celebrationMessage}>You exceeded your category spending limit</div>
              </>
            ) : null}
          </div>
          <div className={styles.confetti}>
            {[...Array(20)].map((_, i) => (
              <div key={i} className={styles.confettiPiece} style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f093fb'][Math.floor(Math.random() * 5)]
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Main Widget */}
      <div 
        className={`${styles.widget} ${showCelebration ? styles.widgetPulse : ''}`} 
        onClick={() => router.push('/rewards')}
      >
        <div className={styles.iconContainer}>
          <span className={styles.icon}>⭐</span>
        </div>
        <div className={styles.content}>
          <div className={styles.label}>
            {content.points}
            {transactionCount < 5 && (
              <span className={styles.transactionHint}>
                ({transactionCount}/5 transactions)
              </span>
            )}
          </div>
          <div className={styles.points}>
            {points}
            {pointsGained > 0 && showCelebration && (
              <span className={styles.pointsIncrease}>+{pointsGained}</span>
            )}
          </div>
        </div>
        <div className={styles.arrow}>→</div>
        
        {/* Sparkles around the widget */}
        {showCelebration && (
          <div className={styles.sparkles}>
            <span className={styles.sparkle} style={{ top: '10%', left: '10%' }}>✨</span>
            <span className={styles.sparkle} style={{ top: '10%', right: '10%' }}>✨</span>
            <span className={styles.sparkle} style={{ bottom: '10%', left: '10%' }}>✨</span>
            <span className={styles.sparkle} style={{ bottom: '10%', right: '10%' }}>✨</span>
          </div>
        )}
      </div>
    </>
  );
}
