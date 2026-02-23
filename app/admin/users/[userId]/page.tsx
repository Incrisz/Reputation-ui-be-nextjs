'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getAuthUser, isAdminUser } from '@/lib/auth';
import { fetchAdminUserDetail, formatDateTime, formatPlanLabel, type AdminUserDetail } from '../../lib/adminApi';
import styles from '../../admin.module.css';

function statusBadgeClass(status: string): string {
  if (status === 'success') return 'bg-success-subtle text-success-emphasis';
  if (status === 'processing' || status === 'pending') return 'bg-info-subtle text-info-emphasis';
  if (status === 'selection_required') return 'bg-warning-subtle text-warning-emphasis';
  return 'bg-danger-subtle text-danger-emphasis';
}

export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const numericUserId = Number(params.userId);

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
        if (mounted) {
          setError('Invalid user id.');
          setIsLoading(false);
        }
        return;
      }

      const sessionUser = getAuthUser();
      if (!sessionUser || !isAdminUser(sessionUser)) {
        if (mounted) {
          setError('Only admins can access user details.');
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetchAdminUserDetail({
          admin_user_id: sessionUser.id,
          user_id: numericUserId,
          audits_limit: 100,
          auth_events_limit: 100,
          payments_limit: 50,
        });

        if (mounted) {
          setError(null);
          setUser(response.user);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load this user right now.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      mounted = false;
    };
  }, [numericUserId]);

  const usagePercent = useMemo(() => {
    if (!user?.usage) return 0;
    if (user.usage.audits_limit === null || user.usage.audits_limit <= 0) return 0;
    return Math.min(100, Math.round((user.usage.audits_used / user.usage.audits_limit) * 100));
  }, [user]);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (isLoading || !user) {
    return <div className={styles.muted}>Loading user details...</div>;
  }

  return (
    <div className="d-grid gap-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h2 className="h4 mb-1">{user.name}</h2>
          <p className={`${styles.muted} mb-0`}>{user.email}</p>
        </div>
        <Link href="/admin/users" className="btn btn-outline-secondary btn-sm">
          Back to Users
        </Link>
      </div>

      <section className="row g-3">
        <div className="col-lg-7">
          <article className={styles.panel}>
            <h3 className={styles.panelTitle}>Profile</h3>
            <div className={styles.tableWrap}>
              <table className="table mb-0">
                <tbody>
                  <tr>
                    <th scope="row">Role</th>
                    <td>{user.role}</td>
                  </tr>
                  <tr>
                    <th scope="row">Company</th>
                    <td>{user.company || '--'}</td>
                  </tr>
                  <tr>
                    <th scope="row">Industry</th>
                    <td>{user.industry || '--'}</td>
                  </tr>
                  <tr>
                    <th scope="row">Phone</th>
                    <td>{user.phone || '--'}</td>
                  </tr>
                  <tr>
                    <th scope="row">Website</th>
                    <td>{user.website || '--'}</td>
                  </tr>
                  <tr>
                    <th scope="row">Last Login</th>
                    <td>{formatDateTime(user.last_login_at)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Created</th>
                    <td>{formatDateTime(user.created_at)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <div className="col-lg-5">
          <article className={styles.panel}>
            <h3 className={styles.panelTitle}>Current Plan and Usage</h3>
            <p className="mb-1">
              <strong>Plan:</strong> {formatPlanLabel(user.current_subscription?.plan)}
            </p>
            <p className="mb-1">
              <strong>Billing:</strong> {user.current_subscription?.billing_interval || '--'}
            </p>
            <p className="mb-2">
              <strong>Cycle:</strong> {formatDateTime(user.usage.period_start)} - {formatDateTime(user.usage.period_end)}
            </p>
            <p className="mb-1">
              <strong>Audits Used:</strong> {user.usage.audits_used}
            </p>
            <p className="mb-2">
              <strong>Audits Remaining:</strong>{' '}
              {user.usage.audits_remaining === null ? 'Unlimited' : user.usage.audits_remaining}
            </p>
            {user.usage.audits_limit ? (
              <div className="progress mb-1" role="progressbar" aria-valuenow={usagePercent} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar" style={{ width: `${usagePercent}%` }} />
              </div>
            ) : null}
            <small className={styles.muted}>
              {user.usage.audits_limit ? `${usagePercent}% of plan usage consumed` : 'No fixed audit cap'}
            </small>
          </article>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Audit History</h3>
          <span className={styles.badgeSoft}>{user.audit_history.length} audits</span>
        </div>
        <div className={styles.tableWrap}>
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Business</th>
                <th>Status</th>
                <th>Score</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {user.audit_history.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.muted}>
                    No audits for this user yet.
                  </td>
                </tr>
              ) : null}
              {user.audit_history.map((audit) => (
                <tr key={audit.id}>
                  <td>
                    <div className="fw-semibold">{audit.business_name || '--'}</div>
                    <div className={styles.muted}>{audit.website || '--'}</div>
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass(audit.status)}`}>{audit.status}</span>
                  </td>
                  <td>{audit.reputation_score ?? '--'}</td>
                  <td>{formatDateTime(audit.created_at)}</td>
                  <td className="text-end">
                    <Link
                      href={`/admin/users/${user.id}/audits/${audit.id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      View Audit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Auth Event History</h3>
          <span className={styles.badgeSoft}>{user.auth_events.length} events</span>
        </div>
        <div className={styles.tableWrap}>
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Event</th>
                <th>Provider</th>
                <th>IP</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {user.auth_events.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.muted}>
                    No auth events recorded.
                  </td>
                </tr>
              ) : null}
              {user.auth_events.map((event) => (
                <tr key={event.id}>
                  <td className="fw-semibold">{event.event_type}</td>
                  <td>{event.provider || '--'}</td>
                  <td className={styles.mono}>{event.ip_address || '--'}</td>
                  <td>{formatDateTime(event.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
