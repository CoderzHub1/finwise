import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/Navbar.module.css';

export default function Navbar({ currentPage = '' }) {
  const router = useRouter();
  const { user, signout } = useAuth();

  const handleSignout = () => {
    signout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Analytics', path: '/analytics' },
    { label: 'Rewards', path: '/rewards' },
    { label: 'AI Suggestions', path: '/suggestions' },
    { label: 'Finance News', path: '/news' },
    { label: 'FinanceHub', path: '/community' },
    { label: 'My Account', path: '/myAccount' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.headerTitle}>FinWise</h1>
        <p className={styles.headerSubtitle}>
          Welcome back, {user?.name || user?.username}!
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
        <button onClick={handleSignout} className={styles.signoutBtn}>
          Sign Out
        </button>
      </div>
    </header>
  );
}
