import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import styles from '@/styles/Suggestions.module.css';

export default function Suggestions() {
  const { user, signout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      fetchSuggestions();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:5000/gemini-suggestions', {
        username: user.username,
        password: user.password
      });

      if (response.data.praise && response.data.suggestions) {
        setSuggestions({
          praise: response.data.praise,
          suggestions: response.data.suggestions
        });
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setError(error.response?.data?.error || 'Failed to load suggestions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignout = () => {
    signout();
    router.push('/login');
  };

  const navigateToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Generating AI-powered suggestions...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>AI Suggestions - FinWise</title>
        <meta name="description" content="Get AI-powered financial suggestions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        <Navbar currentPage="/suggestions" />

        <main className={styles.main}>
          {error ? (
            <section className={styles.errorSection}>
              <div className={styles.errorIcon}>⚠️</div>
              <h2 className={styles.errorTitle}>Oops!</h2>
              <p className={styles.errorMessage}>{error}</p>
              <button onClick={fetchSuggestions} className={styles.retryBtn}>
                Try Again
              </button>
            </section>
          ) : suggestions ? (
            <>
              <section className={styles.praiseSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.iconWrapper}>
                    <span className={styles.icon}>🌟</span>
                  </div>
                  <h2 className={styles.sectionTitle}>What You're Doing Great</h2>
                </div>
                <div className={styles.praiseContent}>
                  <p className={styles.praiseText}>{suggestions.praise}</p>
                </div>
              </section>

              <section className={styles.suggestionsSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.iconWrapper}>
                    <span className={styles.icon}>💡</span>
                  </div>
                  <h2 className={styles.sectionTitle}>Personalized Recommendations</h2>
                </div>
                <div className={styles.suggestionsContent}>
                  <p className={styles.suggestionsText}>{suggestions.suggestions}</p>
                </div>
              </section>

              <section className={styles.refreshSection}>
                <button onClick={fetchSuggestions} className={styles.refreshBtn}>
                  <span className={styles.refreshIcon}>🔄</span>
                  Refresh Suggestions
                </button>
                <p className={styles.refreshNote}>
                  Suggestions are generated based on your latest transaction data
                </p>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </>
  );
}
