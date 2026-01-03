'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSidebarToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const html = document.documentElement;
    const isMobile = window.innerWidth < 992;
    
    if (isMobile) {
      const hasDefaultMenuHandler = typeof (window as { toggleSidemenu?: () => void }).toggleSidemenu === 'function';
      if (hasDefaultMenuHandler) {
        return;
      }
      const currentState = html.getAttribute('data-toggled');
      // On mobile: toggle between 'open' (visible) and 'close' (hidden)
      html.setAttribute('data-toggled', currentState === 'open' ? 'close' : 'open');
    } else {
      const isCollapsed = html.getAttribute('data-sidebar') === 'collapsed';
      // On desktop: toggle data-sidebar for collapsed state
      if (isCollapsed) {
        html.removeAttribute('data-sidebar');
      } else {
        html.setAttribute('data-sidebar', 'collapsed');
      }
    }
  };

  return (
    <header className="app-header sticky">
      <div className="main-header-container container-fluid">
        {/* Left side: Logo and Hamburger */}
        <div className="header-content-left">
          <div className="header-element">
            <div className="horizontal-logo">
              <Link href="/dashboard" className="header-logo">
                <img src="/images/brand-logos/desktop-logo.png" alt="logo" className="desktop-logo" />
                <img src="/images/brand-logos/desktop-dark.png" alt="logo" className="desktop-dark" />
              </Link>
            </div>
          </div>
          <div className="header-element">
            <a
              aria-label="Hide Sidebar"
              className="sidemenu-toggle header-link animated-arrow hor-toggle horizontal-navtoggle"
              data-bs-toggle="sidebar"
              href="#"
              onClick={handleSidebarToggle}
            >
              <span></span>
            </a>
          </div>
        </div>

        {/* Right side: Icons and Profile */}
        <ul className="header-content-right">
          {/* Dark Mode Toggle */}
          <li className="header-element header-theme-mode">
            <a href="#" className="header-link layout-setting" onClick={(e) => { e.preventDefault(); toggleTheme(); }}>
              <span className={theme === 'light' ? 'light-layout' : 'd-none'}>
                <svg xmlns="http://www.w3.org/2000/svg" className="header-link-icon" viewBox="0 0 256 256" width="20" height="20">
                  <path d="M108.11,28.11A96.09,96.09,0,0,0,227.89,147.89,96,96,0,1,1,108.11,28.11Z" opacity="0.2" fill="currentColor"/>
                  <path d="M108.11,28.11A96.09,96.09,0,0,0,227.89,147.89,96,96,0,1,1,108.11,28.11Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                </svg>
              </span>
              <span className={theme === 'dark' ? 'dark-layout' : 'd-none'}>
                <svg xmlns="http://www.w3.org/2000/svg" className="header-link-icon" viewBox="0 0 256 256" width="20" height="20">
                  <circle cx="128" cy="128" r="56" opacity="0.2" fill="currentColor"/>
                  <circle cx="128" cy="128" r="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                  <line x1="128" y1="40" x2="128" y2="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                  <line x1="128" y1="216" x2="128" y2="224" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                  <line x1="40" y1="128" x2="32" y2="128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                  <line x1="216" y1="128" x2="224" y2="128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                </svg>
              </span>
            </a>
          </li>

          {/* Profile Dropdown */}
          <li ref={dropdownRef} className={`header-element dropdown ${profileOpen ? 'show' : ''}`}>
            <a
              href="#"
              className="header-link dropdown-toggle"
              onClick={(e) => { e.preventDefault(); setProfileOpen(!profileOpen); }}
            >
              <div>
                <img src="/images/faces/12.jpg" alt="profile" className="header-link-icon rounded-circle" width="32" height="32" />
              </div>
            </a>
            <div className={`main-header-dropdown dropdown-menu pt-0 overflow-hidden header-profile-dropdown dropdown-menu-end ${profileOpen ? 'show' : ''}`} style={{ position: 'absolute', right: 0, top: '100%' }}>
              <div className="p-3 bg-primary text-white">
                <div className="d-flex align-items-center justify-content-between">
                  <p className="mb-0 fs-16">Profile</p>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="p-3">
                <div className="d-flex align-items-start gap-2">
                  <div className="lh-1">
                    <span className="avatar avatar-sm bg-primary-transparent avatar-rounded">
                      <img src="/images/faces/12.jpg" alt="" width="32" height="32" className="rounded-circle" />
                    </span>
                  </div>
                  <div>
                    <span className="d-block fw-semibold lh-1">User Name</span>
                    <span className="text-muted fs-12">user@bizreputation.ai</span>
                  </div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <ul className="list-unstyled mb-0">
                <li>
                  <Link className="dropdown-item d-flex align-items-center" href="/profile" onClick={() => setProfileOpen(false)}>
                    <i className="ri-user-circle-line me-2"></i>View Profile
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center" href="/profile-settings" onClick={() => setProfileOpen(false)}>
                    <i className="ri-settings-gear-line me-2"></i>Account Settings
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center" href="/login" onClick={() => setProfileOpen(false)}>
                    <i className="ri-logout-box-line me-2"></i>Log Out
                  </Link>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </header>
  );
}
