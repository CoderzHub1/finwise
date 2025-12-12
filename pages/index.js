import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
import Head from "next/head";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const content = useTranslatedContent({
    title: 'FinWise',
    description: 'Track your finances with gamification',
    loading: 'Loading...'
  });

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <>
      <Head>
        <title>{content.title}</title>
        <meta name="description" content={content.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        color: '#000000'
      }}>
        <div>
          <div style={{
            border: '4px solid #e5e5e5',
            borderTop: '4px solid #000000',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '20px', fontSize: '1.2rem' }}>{content.loading}</p>
        </div>
      </div>
    </>
  );
}
