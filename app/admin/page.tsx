'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getAuthUser, isAdminUser } from '@/lib/auth';
import {
  fetchAdminUsers,
  formatDateTime,
  formatPlanLabel,
  type AdminUserListItem,
} from './lib/adminApi';
import styles from './admin.module.css';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      const sessionUser = getAuthUser();
      if (!sessionUser || !isAdminUser(sessionUser)) {
        if (mounted) {
          setError('Only admins can access dashboard insights.');
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetchAdminUsers({
          admin_user_id: sessionUser.id,
          limit: 100,
          role: 'user',
        });

        if (mounted) {
          setUsers(response.users);
          setError(null);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load dashboard overview.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      mounted = false;
    };
  }, []);

  const overview = useMemo(() => {
    const totalUsers = users.length;
    const activePlans = users.filter((user) => Boolean(user.current_subscription?.plan)).length;
    const totalAudits = users.reduce((sum, user) => sum + user.audit_runs_count, 0);

    return {
      totalUsers,
      activePlans,
      totalAudits,
    };
  }, [users]);

  const recentUsers = useMemo(() => users.slice(0, 6), [users]);

  return (
    <div className="d-grid gap-3">
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Welcome to Admin Dashboard</h2>
        <p className={`${styles.muted} mb-0`}>
          Manage users, monitor subscriptions, and review audit activity from one place.
        </p>
      </section>

      <section className={styles.statGrid}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Total Users</p>
          <p className={styles.statValue}>{isLoading ? '--' : overview.totalUsers}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Users With Plans</p>
          <p className={styles.statValue}>{isLoading ? '--' : overview.activePlans}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Audits Recorded</p>
          <p className={styles.statValue}>{isLoading ? '--' : overview.totalAudits}</p>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Quick Actions</h3>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link href="/admin/users" className="btn btn-primary btn-sm">
            Open Users
          </Link>
          <Link href="/admin/plans" className="btn btn-outline-primary btn-sm">
            Open Plans
          </Link>
          <Link href="/admin/settings" className="btn btn-outline-primary btn-sm">
            Open Settings
          </Link>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Recently Registered Users</h3>
          <Link href="/admin/users" className="btn btn-outline-secondary btn-sm">
            View all users
          </Link>
        </div>

        {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

        <div className={styles.tableWrap}>
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Last Login</th>
                <th>Audits</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.muted}>
                    No users available.
                  </td>
                </tr>
              ) : null}

              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="fw-semibold">{user.name}</div>
                    <div className={styles.muted}>{user.email}</div>
                  </td>
                  <td>{formatPlanLabel(user.current_subscription?.plan)}</td>
                  <td>{formatDateTime(user.last_login_at)}</td>
                  <td>{user.audit_runs_count}</td>
                  <td className="text-end">
                    <Link href={`/admin/users/${user.id}`} className="btn btn-sm btn-outline-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {isLoading ? (
                <tr>
                  <td colSpan={5} className={styles.muted}>
                    Loading dashboard...
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
