import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import styles from '@/styles/Analytics.module.css';

export default function Analytics() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Analytics - FinWise</title>
        <meta name="description" content="Financial Analytics and Insights" />
      </Head>
      <div className={styles.pageContainer}>
        <Navbar currentPage="/analytics" />
        
        <main className={styles.mainContent}>
          <AnalyticsTracker />
        </main>
      </div>
    </>
  );
}
