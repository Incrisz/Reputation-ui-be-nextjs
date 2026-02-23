'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  fetchProfile,
  getAuthUser,
  isAdminUser,
  logoutUser,
  type AuthUser,
} from '@/lib/auth';
import styles from '../admin.module.css';

interface AdminShellProps {
  children: ReactNode;
}

const navItems = [
  {
    href: '/admin',
    label: 'Dashboard',
  },
  {
    href: '/admin/users',
    label: 'Users',
  },
  {
    href: '/admin/plans',
    label: 'Plans',
  },
  {
    href: '/admin/settings',
    label: 'Settings',
  },
];

export default function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminLoginRoute = pathname === '/admin/login';
  const [adminUser, setAdminUser] = useState<AuthUser | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verifyAdminAccess = async () => {
      if (isAdminLoginRoute) {
        const currentUser = getAuthUser();
        if (currentUser && isAdminUser(currentUser)) {
          router.replace('/admin');
          return;
        }

        if (mounted) {
          setAdminUser(currentUser);
          setIsCheckingAccess(false);
        }
        return;
      }

      const currentUser = getAuthUser();
      if (!currentUser) {
        router.replace('/admin/login');
        return;
      }

      if (isAdminUser(currentUser)) {
        if (mounted) {
          setAdminUser(currentUser);
          setIsCheckingAccess(false);
        }
        return;
      }

      try {
        const refreshedUser = await fetchProfile(currentUser.id);
        if (!mounted) return;

        if (!isAdminUser(refreshedUser)) {
          router.replace('/dashboard');
          return;
        }

        setAdminUser(refreshedUser);
      } catch {
        if (mounted) {
          router.replace('/admin/login');
        }
      } finally {
        if (mounted) {
          setIsCheckingAccess(false);
        }
      }
    };

    void verifyAdminAccess();

    return () => {
      mounted = false;
    };
  }, [isAdminLoginRoute, router]);

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_open');
    if (saved === null) return;
    setIsSidebarOpen(saved === '1');
  }, []);

  const pageTitle = useMemo(() => {
    if (pathname?.includes('/audits/')) return 'Audit Result';
    if (pathname?.match(/^\/admin\/users\/[^/]+$/)) return 'User Details';
    if (pathname?.startsWith('/admin/users')) return 'Users';
    if (pathname?.startsWith('/admin/plans')) return 'Plans';
    if (pathname?.startsWith('/admin/settings')) return 'Settings';
    return 'Dashboard';
  }, [pathname]);

  const handleSignOut = async () => {
    await logoutUser();
    router.replace('/admin/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((current) => {
      const nextValue = !current;
      localStorage.setItem('admin_sidebar_open', nextValue ? '1' : '0');
      return nextValue;
    });
  };

  if (isCheckingAccess) {
    return <div className={styles.loading}>Checking admin access...</div>;
  }

  if (isAdminLoginRoute) {
    return <>{children}</>;
  }

  if (!adminUser || !isAdminUser(adminUser)) {
    return null;
  }

  return (
    <div className={styles.adminRoot}>
      {isSidebarOpen ? (
        <aside className={styles.sidebar}>
          <div>
            <p className={styles.subTitle}>Reputation AI</p>
            <Link href="/admin" className={styles.brand}>
              Admin Portal
            </Link>
          </div>

          <nav className={styles.nav}>
            {navItems.map((item) => {
              const isActive = item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <p className={styles.adminMeta}>
              Signed in as
              <br />
              <strong>{adminUser.name}</strong>
            </p>
            <button type="button" className="btn btn-outline-light btn-sm w-100" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </aside>
      ) : null}

      <div className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button type="button" className={styles.sidebarToggle} onClick={toggleSidebar}>
              <span className="visually-hidden">Toggle sidebar</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="18" height="18" fill="none">
                <line x1="40" y1="64" x2="216" y2="64" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                <line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                <line x1="40" y1="192" x2="216" y2="192" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
              </svg>
            </button>
            <h1 className={styles.topBarTitle}>{pageTitle}</h1>
          </div>
          <span className={styles.badgeSoft}>Role: admin</span>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
