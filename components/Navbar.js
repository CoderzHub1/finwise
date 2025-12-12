import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useTranslatedContent } from '@/hooks/useTranslatedContent';
// import LanguageSelector from '@/components/LanguageSelector';
import styles from '@/styles/Navbar.module.css';

export default function Navbar({ currentPage = '' }) {
  const router = useRouter();
  const { user, signout } = useAuth();
  const content = useTranslatedContent({
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    rewards: 'Rewards',
    aiSuggestions: 'AI Suggestions',
    financeNews: 'Finance News',
    financeHub: 'FinanceHub',
    splitExpenses: 'Split Expenses',
    myAccount: 'My Account',
    welcomeBack: 'Welcome back',
    signOut: 'Sign Out'
  });

  const handleSignout = () => {
    signout();
    router.push('/login');
  };

  const navItems = [
    { label: content.dashboard, path: '/dashboard' },
    { label: content.analytics, path: '/analytics' },
    { label: content.rewards, path: '/rewards' },
    { label: content.aiSuggestions, path: '/suggestions' },
    { label: content.financeNews, path: '/news' },
    { label: content.financeHub, path: '/community' },
    { label: content.splitExpenses, path: '/split-expenses' },
    { label: content.myAccount, path: '/myAccount' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.headerTitle}>FinWise</h1>
        <p className={styles.headerSubtitle}>
          {content.welcomeBack}, {user?.name || user?.username}!
        </p>
      </div>
      <div className={styles.headerActions}>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`${styles.navBtn} ${
                currentPage === item.path ? styles.navBtnActive : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        {/* <LanguageSelector /> */}
        <button onClick={handleSignout} className={styles.signoutBtn}>
          {content.signOut}
        </button>
      </div>
    </header>
  );
}
