import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
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
  const content = useTranslatedContent({
    title: 'Welcome Back!',
    subtitle: 'Login to continue tracking your finances',
    identifierLabel: 'Username or Email',
    passwordLabel: 'Password',
    loginButton: 'Login',
    loggingIn: 'Logging in...',
    noAccount: "Don't have an account?",
    signUpLink: 'Sign up here',
    pageTitle: 'Login - FinWise',
    pageDescription: 'Login to your account'
  });

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
        <title>{content.pageTitle}</title>
        <meta name="description" content={content.pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>{content.title}</h1>
          <p className={styles.subtitle}>{content.subtitle}</p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="identifier">{content.identifierLabel}</label>
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
              <label htmlFor="password">{content.passwordLabel}</label>
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
              {loading ? content.loggingIn : content.loginButton}
            </button>
          </form>

          <p className={styles.switchAuth}>
            {content.noAccount} <Link href="/signup">{content.signUpLink}</Link>
          </p>
        </div>
      </div>
    </>
  );
}
