import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import styles from '@/styles/RankDisplay.module.css';

export default function RankDisplay({ rankData }) {
  const content = useTranslatedContent({
    currentRank: 'Current Rank',
    points: 'Points',
    nextRank: 'Next Rank',
    pointsToGo: 'points to go',
    maxRank: 'Max Rank Achieved!'
  });

  if (!rankData || !rankData.rank) {
    return null;
  }

  const { rank, next_rank } = rankData;

  return (
    <div className={styles.rankContainer}>
      <div className={styles.currentRank}>
        <div className={styles.rankIcon}>{rank.icon}</div>
        <div className={styles.rankInfo}>
          <h2 className={styles.rankName}>{rank.name}</h2>
          <div className={styles.rankPoints}>
            {rank.current_points} {content.points}
          </div>
        </div>
      </div>

      {next_rank ? (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>
              {content.nextRank}: {next_rank.icon} {next_rank.name}
            </span>
            <span className={styles.progressPoints}>
              {next_rank.points_to_next} {content.pointsToGo}
            </span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${next_rank.progress_percentage}%` }}
            >
              <span className={styles.progressPercentage}>
                {next_rank.progress_percentage}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.maxRankBadge}>
          <span className={styles.maxRankIcon}>🌟</span>
          <span className={styles.maxRankText}>{content.maxRank}</span>
        </div>
      )}

      {/* Rank tiers display */}
      <div className={styles.rankTiers}>
        <div className={styles.rankTier}>
          <span className={styles.tierIcon}>🪙</span>
          <span className={styles.tierName}>Bronze Beginner</span>
          <span className={styles.tierRange}>0-499</span>
        </div>
        <div className={styles.rankTier}>
          <span className={styles.tierIcon}>💡</span>
          <span className={styles.tierName}>Silver Saver</span>
          <span className={styles.tierRange}>500-999</span>
        </div>
        <div className={styles.rankTier}>
          <span className={styles.tierIcon}>🏆</span>
          <span className={styles.tierName}>Gold Planner</span>
          <span className={styles.tierRange}>1K-1.9K</span>
        </div>
        <div className={styles.rankTier}>
          <span className={styles.tierIcon}>💳</span>
          <span className={styles.tierName}>Platinum Financier</span>
          <span className={styles.tierRange}>2K-3.4K</span>
        </div>
        <div className={styles.rankTier}>
          <span className={styles.tierIcon}>💎</span>
          <span className={styles.tierName}>Diamond Investor</span>
          <span className={styles.tierRange}>3.5K-5.4K</span>
        </div>
        <div className={styles.rankTier}>
          <span className={styles.tierIcon}>👑</span>
          <span className={styles.tierName}>Elite Wealth Master</span>
          <span className={styles.tierRange}>5.5K-7.9K</span>
        </div>
        <div className={styles.rankTier}>
          <span className={styles.tierIcon}>🌟</span>
          <span className={styles.tierName}>FinWise Legend</span>
          <span className={styles.tierRange}>8K+</span>
        </div>
      </div>
    </div>
  );
}
