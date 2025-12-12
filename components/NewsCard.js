import styles from '@/styles/NewsCard.module.css';

export default function NewsCard({ article }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.newsCard}>
      {article.urlToImage && (
        <div className={styles.imageContainer}>
          <img 
            src={article.urlToImage} 
            alt={article.title}
            className={styles.newsImage}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className={styles.newsContent}>
        <div className={styles.newsHeader}>
          {article.source?.name && (
            <span className={styles.source}>{article.source.name}</span>
          )}
          {article.publishedAt && (
            <span className={styles.date}>{formatDate(article.publishedAt)}</span>
          )}
        </div>

        <h3 className={styles.title}>{article.title}</h3>
        
        {article.description && (
          <p className={styles.description}>{article.description}</p>
        )}

        {article.author && (
          <p className={styles.author}>By {article.author}</p>
        )}

        <a 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.readMore}
        >
          Read Full Article →
        </a>
      </div>
    </div>
  );
}
