import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Auth.module.css';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signin } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signin(identifier, password);
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Financial Homie</title>
        <meta name="description" content="Login to your account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>Welcome Back!</h1>
          <p className={styles.subtitle}>Login to continue tracking your finances</p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="identifier">Username or Email</label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="Enter your username or email"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className={styles.input}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className={styles.switchAuth}>
            Don't have an account? <Link href="/signup">Sign up here</Link>
          </p>
        </div>
      </div>
    </>
  );
}
