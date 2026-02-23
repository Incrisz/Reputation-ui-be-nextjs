'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthUser, isAdminUser, logoutUser } from '@/lib/auth';

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="side-menu__icon" viewBox="0 0 256 256" width="20" height="20">
        <path d="M133.66,34.34a8,8,0,0,0-11.32,0L40,116.69V216h64V152h48v64h64V116.69Z" opacity="0.2" fill="currentColor"/>
        <line x1="16" y1="216" x2="240" y2="216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <polyline points="152 216 152 152 104 152 104 216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <path d="M24,132.69l98.34-98.35a8,8,0,0,1,11.32,0L232,132.69" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
      </svg>
    ),
  },
  {
    href: '/start-audit',
    label: 'Start Audit',
    aiPowered: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="side-menu__icon" viewBox="0 0 256 256" width="20" height="20">
        <polygon points="216 216 80 216 160 24 216 216" opacity="0.2" fill="currentColor"/>
        <polyline points="16 216 80 40 160 24 240 216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
      </svg>
    ),
  },
  {
    href: '/audit-history',
    label: 'Audit History',
    aiPowered: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="side-menu__icon" viewBox="0 0 256 256" width="20" height="20">
        <circle cx="128" cy="128" r="96" opacity="0.2" fill="currentColor"/>
        <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <polyline points="128 72 128 128 176 168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
      </svg>
    ),
  },
  {
    href: '/pricing',
    label: 'My Plan',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="side-menu__icon" viewBox="0 0 256 256" width="20" height="20">
        <rect x="40" y="80" width="176" height="96" opacity="0.2" fill="currentColor"/>
        <line x1="80" y1="40" x2="80" y2="80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <line x1="128" y1="40" x2="128" y2="80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <line x1="176" y1="40" x2="176" y2="80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <rect x="40" y="80" width="176" height="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
      </svg>
    ),
  },
  {
    href: '/payment-history',
    label: 'Payment History',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="side-menu__icon" viewBox="0 0 256 256" width="20" height="20">
        <rect x="40" y="56" width="176" height="144" rx="8" opacity="0.2" fill="currentColor"/>
        <rect x="40" y="56" width="176" height="144" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <line x1="88" y1="104" x2="168" y2="104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <line x1="88" y1="152" x2="136" y2="152" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
      </svg>
    ),
  },
  {
    href: '/support',
    label: 'Support',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="side-menu__icon" viewBox="0 0 256 256" width="20" height="20">
        <circle cx="128" cy="128" r="96" opacity="0.2" fill="currentColor"/>
        <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <circle cx="128" cy="180" r="12" fill="currentColor"/>
        <path d="M128,144v-8a28,28,0,1,0-28-28" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
      </svg>
    ),
  },
];

const footerItems = [
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="side-menu__icon" viewBox="0 0 256 256" width="20" height="20">
        <path d="M128,32A96,96,0,0,0,63.8,199.38h0A72,72,0,0,1,128,160a40,40,0,1,1,40-40,40,40,0,0,1-40,40,72,72,0,0,1,64.2,39.37A96,96,0,0,0,128,32Z" opacity="0.2" fill="currentColor"/>
        <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <circle cx="128" cy="120" r="40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
      </svg>
    ),
  },
  {
    href: '/login',
    label: 'Sign Out',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="side-menu__icon" viewBox="0 0 256 256" width="20" height="20">
        <path d="M48,40H208a16,16,0,0,1,16,16V200a16,16,0,0,1-16,16H48a0,0,0,0,1,0,0V40A0,0,0,0,1,48,40Z" opacity="0.2" fill="currentColor"/>
        <polyline points="112 40 48 40 48 216 112 216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <line x1="112" y1="128" x2="224" y2="128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <polyline points="184 88 224 128 184 168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    const syncRoleState = () => {
      setHasAdminAccess(isAdminUser(getAuthUser()));
    };

    syncRoleState();
    window.addEventListener('storage', syncRoleState);
    window.addEventListener('focus', syncRoleState);

    return () => {
      window.removeEventListener('storage', syncRoleState);
      window.removeEventListener('focus', syncRoleState);
    };
  }, []);

  const dynamicMenuItems = hasAdminAccess
    ? [
        ...menuItems.filter((item) => item.href !== '/start-audit' && item.href !== '/audit-history'),
        {
          href: '/admin',
          label: 'Admin Portal',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="side-menu__icon" viewBox="0 0 256 256" width="20" height="20">
              <path d="M128,24l88,40v56c0,54-37.4,93.8-88,112-50.6-18.2-88-58-88-112V64Z" opacity="0.2" fill="currentColor"/>
              <path d="M128,24l88,40v56c0,54-37.4,93.8-88,112-50.6-18.2-88-58-88-112V64Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
              <polyline points="96 128 120 152 168 104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
            </svg>
          ),
        },
      ]
    : menuItems;

  const closeMobileSidebar = () => {
    if (typeof window === 'undefined' || window.innerWidth >= 992) {
      return;
    }

    const html = document.documentElement;
    const sidebar = document.querySelector('.app-sidebar');
    const overlay = document.getElementById('responsive-overlay');

    html.setAttribute('data-toggled', 'close');
    html.removeAttribute('data-icon-overlay');
    overlay?.classList.remove('active');
    sidebar?.classList.remove('open');
    sidebar?.classList.remove('active');
  };

  const handleSignOut = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    closeMobileSidebar();
    try {
      await logoutUser();
      // Force a small delay to ensure all storage events are processed
      await new Promise(resolve => setTimeout(resolve, 200));
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
      window.location.href = '/login';
    }
  };

  return (
    <aside className="app-sidebar sticky" id="sidebar">
      <div className="main-sidebar-header">
        <Link href="/dashboard" className="header-logo">
          <img src="/images/brand-logos/desktop-logo.png" alt="logo" className="desktop-logo" />
          <img src="/images/brand-logos/desktop-dark.png" alt="logo" className="desktop-dark" />
        </Link>
      </div>

      <div className="main-sidebar has-footer" id="sidebar-scroll">
        <nav className="main-menu-container nav nav-pills flex-column sub-open">
          <ul className="main-menu">
            {dynamicMenuItems.map((item) => (
              <li key={item.href} className="slide">
                <Link
                  href={item.href}
                  className={`side-menu__item ${pathname === item.href ? 'active' : ''}`}
                  onClick={closeMobileSidebar}
                >
                  {item.icon}
                  <span className="side-menu__label d-inline-flex align-items-center">
                    {item.label}
                    {item.aiPowered ? (
                      <span className="badge bg-primary-transparent text-primary ms-2">AI</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <ul className="main-menu">
            {footerItems.map((item) => {
              if (item.label === 'Sign Out') {
                return (
                  <li key={item.href} className="slide">
                    <Link
                      href="/login"
                      className={`side-menu__item`}
                      onClick={handleSignOut}
                    >
                      {item.icon}
                      <span className="side-menu__label">{item.label}</span>
                    </Link>
                  </li>
                );
              }
              return (
                <li key={item.href} className="slide">
                  <Link
                    href={item.href}
                    className={`side-menu__item ${pathname === item.href ? 'active' : ''}`}
                    onClick={closeMobileSidebar}
                  >
                    {item.icon}
                    <span className="side-menu__label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}
