'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getAuthUser, isAdminUser } from '@/lib/auth';
import {
  fetchAdminUsers,
  formatDateTime,
  formatPlanLabel,
  type AdminUserListItem,
} from '../lib/adminApi';
import styles from '../admin.module.css';

function roleBadgeClass(role: string): string {
  return role === 'admin' ? 'bg-primary-subtle text-primary-emphasis' : 'bg-light text-dark';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      const sessionUser = getAuthUser();
      if (!sessionUser || !isAdminUser(sessionUser)) {
        if (mounted) {
          setError('Only admins can access user management.');
          setIsLoading(false);
        }
        return;
      }

      try {
        if (mounted) {
          setError(null);
        }
        const response = await fetchAdminUsers({
          admin_user_id: sessionUser.id,
          limit: 200,
          search: activeSearch || undefined,
          role: 'user',
        });

        if (mounted) {
          setUsers(response.users);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load users right now.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      mounted = false;
    };
  }, [activeSearch]);

  const summary = useMemo(() => {
    const totalUsers = users.length;
    const withPlanCount = users.filter((user) => Boolean(user.current_subscription?.plan)).length;

    return {
      totalUsers,
      withPlanCount,
    };
  }, [users]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setActiveSearch(searchValue.trim());
  };

  return (
    <div className="d-grid gap-3">
      <section className={styles.statGrid}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Total Users</p>
          <p className={styles.statValue}>{summary.totalUsers}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Users With Plans</p>
          <p className={styles.statValue}>{summary.withPlanCount}</p>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Users and Plans</h2>
          <span className={styles.badgeSoft}>{users.length} records</span>
        </div>

        <form className="row g-2 mb-3" onSubmit={handleSearch}>
          <div className="col-sm-9 col-lg-10">
            <input
              type="text"
              className="form-control"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by name, email, or company"
            />
          </div>
          <div className="col-sm-3 col-lg-2 d-grid">
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </form>

        {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

        <div className={styles.tableWrap}>
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Audits</th>
                <th>Last Login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.muted}>
                    No users found.
                  </td>
                </tr>
              ) : null}

              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="fw-semibold">{user.name}</div>
                    <div className={styles.muted}>{user.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${roleBadgeClass(user.role)}`}>{user.role}</span>
                  </td>
                  <td>
                    <div>{formatPlanLabel(user.current_subscription?.plan)}</div>
                    <div className={styles.muted}>
                      {user.current_subscription?.billing_interval
                        ? `${user.current_subscription.billing_interval} billing`
                        : 'No active billing'}
                    </div>
                  </td>
                  <td>
                    <div className="fw-semibold">{user.audit_runs_count}</div>
                    <div className={styles.muted}>{formatDateTime(user.latest_audit_at)}</div>
                  </td>
                  <td>{formatDateTime(user.last_login_at)}</td>
                  <td className="text-end">
                    <Link href={`/admin/users/${user.id}`} className="btn btn-sm btn-outline-primary">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}

              {isLoading ? (
                <tr>
                  <td colSpan={6} className={styles.muted}>
                    Loading users...
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
