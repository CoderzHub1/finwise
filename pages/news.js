import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import NewsCard from '@/components/NewsCard';
import axios from 'axios';
import styles from '@/styles/News.module.css';

export default function News() {
  const { user, signout } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setArticles([]);
      setPage(1);
      setHasMore(true);
      fetchFinanceNews(1);
    }
  }, [user]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore || error) return;

      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Load more when user is 300px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        loadMoreArticles();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, error, page]);

  const fetchFinanceNews = async (pageNum = 1, append = false) => {
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');
    
    try {
      const query = 'finance tips OR personal finance OR money management OR budgeting OR saving money';
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/finance-news`, {
        params: {
          query: query,
          page_size: 20,
          page: pageNum,
          sort_by: 'publishedAt'
        }
      });

      if (response.data.status === 'ok') {
        const newArticles = response.data.articles;
        
        if (append) {
          setArticles(prev => [...prev, ...newArticles]);
        } else {
          setArticles(newArticles);
        }
        
        setTotalResults(response.data.totalResults);
        
        // Check if there are more articles to load
        const totalLoaded = append ? articles.length + newArticles.length : newArticles.length;
        setHasMore(totalLoaded < response.data.totalResults && newArticles.length > 0);
      } else {
        setError('Failed to fetch finance news');
      }
    } catch (err) {
      console.error('Error fetching finance news:', err);
      setError(err.response?.data?.error || 'Failed to load finance news. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreArticles = () => {
    if (loadingMore || !hasMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFinanceNews(nextPage, true);
  };

  const handleSignout = () => {
    signout();
    router.push('/login');
  };

  if (loading && articles.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading finance news...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Finance News - FinWise</title>
        <meta name="description" content="Stay updated with latest finance news and tips" />
      </Head>

      <div className={styles.container}>
        <Navbar currentPage="/news" />

        <main className={styles.main}>
          <div className={styles.pageTitle}>
            <h2>Finance Tips & Guides</h2>
          </div>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={() => fetchFinanceNews()} className={styles.retryButton}>
                Retry
              </button>
            </div>
          )}

          {!error && articles.length > 0 && (
            <>
              <div className={styles.resultsInfo}>
                <p>Showing {articles.length} of {totalResults} articles</p>
              </div>

              <div className={styles.newsGrid}>
                {articles.map((article, index) => (
                  <NewsCard key={`${article.url}-${index}`} article={article} />
                ))}
              </div>

              {loadingMore && (
                <div className={styles.loadingMore}>
                  <div className={styles.spinner}></div>
                  <p>Loading more articles...</p>
                </div>
              )}

              {!loadingMore && !hasMore && articles.length > 0 && (
                <div className={styles.endMessage}>
                  <p>You've reached the end! No more articles to load.</p>
                </div>
              )}
            </>
          )}

          {!error && !loading && articles.length === 0 && (
            <div className={styles.noResults}>
              <p>No articles found. Try a different search query.</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
