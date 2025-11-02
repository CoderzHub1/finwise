import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import styles from '@/styles/AchievementBadges.module.css';

export default function AchievementBadges({ achievements }) {
  const content = useTranslatedContent({
    achievements: 'Achievements',
    unlocked: 'Unlocked',
    locked: 'Locked',
    progress: 'Progress'
  });

  if (!achievements || achievements.length === 0) {
    return null;
  }

  return (
    <div className={styles.achievementsContainer}>
      <h2 className={styles.achievementsTitle}>
        🏆 {content.achievements}
      </h2>
      
      <div className={styles.achievementGrid}>
        {achievements.map((achievement) => (
          <div 
            key={achievement.id} 
            className={`${styles.achievementCard} ${
              achievement.unlocked ? styles.unlocked : styles.locked
            }`}
          >
            <div className={styles.achievementIcon}>
              {achievement.icon}
            </div>
            
            <div className={styles.achievementContent}>
              <div className={styles.achievementHeader}>
                <h3 className={styles.achievementName}>
                  {achievement.name}
                </h3>
                {achievement.unlocked && (
                  <span className={styles.unlockedBadge}>✓</span>
                )}
              </div>
              
              <p className={styles.achievementDescription}>
                {achievement.description}
              </p>
              
              {!achievement.unlocked && (
                <div className={styles.progressSection}>
                  <div className={styles.progressText}>
                    {achievement.current} / {achievement.required}
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                  <div className={styles.progressPercentage}>
                    {achievement.progress}%
                  </div>
                </div>
              )}
              
              {achievement.unlocked && (
                <div className={styles.completedBadge}>
                  <span className={styles.completedIcon}>🎉</span>
                  <span className={styles.completedText}>
                    {content.unlocked}!
                  </span>
                </div>
              )}
            </div>
            
            {achievement.unlocked && (
              <div className={styles.shine}></div>
            )}
          </div>
        ))}
      </div>
      
      {/* Achievement summary */}
      <div className={styles.achievementSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryIcon}>🎯</span>
          <span className={styles.summaryText}>
            {achievements.filter(a => a.unlocked).length} / {achievements.length} {content.unlocked}
          </span>
        </div>
      </div>
    </div>
  );
}
