'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getAuthUser, isAdminUser } from '@/lib/auth';
import { fetchAdminUserAudit, formatDateTime, type AdminAuditDetail } from '../../../../lib/adminApi';
import styles from '../../../../admin.module.css';

interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

interface MentionItem {
  url: string;
  source: string;
  sentiment: string;
  summary: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSentimentBreakdown(raw: unknown): SentimentBreakdown {
  const payload = asRecord(raw);
  if (!payload) {
    return { positive: 0, neutral: 0, negative: 0 };
  }

  const directPositive = toNumber(payload.positive);
  const directNeutral = toNumber(payload.neutral);
  const directNegative = toNumber(payload.negative);

  if (directPositive || directNeutral || directNegative) {
    return {
      positive: Math.round(directPositive),
      neutral: Math.round(directNeutral),
      negative: Math.round(directNegative),
    };
  }

  const customer = asRecord(payload.customer);
  const employee = asRecord(payload.employee);
  if (!customer && !employee) {
    return { positive: 0, neutral: 0, negative: 0 };
  }

  const positive = toNumber(customer?.positive) + toNumber(employee?.positive);
  const neutral = toNumber(customer?.neutral) + toNumber(employee?.neutral);
  const negative = toNumber(customer?.negative) + toNumber(employee?.negative);
  const total = positive + neutral + negative;
  if (!total) return { positive: 0, neutral: 0, negative: 0 };

  return {
    positive: Math.round((positive / total) * 100),
    neutral: Math.round((neutral / total) * 100),
    negative: Math.round((negative / total) * 100),
  };
}

function normalizeThemes(results: Record<string, unknown> | null): string[] {
  if (!results) return [];
  const fromThemes = Array.isArray(results.top_themes) ? results.top_themes : [];
  const fromKeys = Array.isArray(results.key_themes) ? results.key_themes : [];
  const source = fromThemes.length > 0 ? fromThemes : fromKeys;

  return source
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      const asObj = asRecord(item);
      if (!asObj) return '';
      return String(asObj.theme || asObj.name || '').trim();
    })
    .filter((item) => item.length > 0)
    .slice(0, 8);
}

function normalizeMentions(results: Record<string, unknown> | null): MentionItem[] {
  if (!results) return [];
  const source = Array.isArray(results.top_mentions)
    ? results.top_mentions
    : Array.isArray(results.mentions)
      ? results.mentions
      : [];

  return source
    .map((item) => {
      const entry = asRecord(item);
      if (!entry) return null;
      return {
        url: String(entry.url || '').trim(),
        source: String(entry.source || entry.platform || '--').trim(),
        sentiment: String(entry.sentiment || 'neutral').trim(),
        summary: String(entry.summary || entry.title || '--').trim(),
      };
    })
    .filter((item): item is MentionItem => Boolean(item))
    .slice(0, 10);
}

function normalizeRecommendations(results: Record<string, unknown> | null): string[] {
  if (!results || !Array.isArray(results.recommendations)) return [];

  return results.recommendations
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      const asObj = asRecord(item);
      if (!asObj) return '';
      return String(asObj.recommendation || asObj.message || asObj.text || '').trim();
    })
    .filter((item) => item.length > 0)
    .slice(0, 8);
}

function normalizeNarrativeContent(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        const record = asRecord(item);
        if (!record) return '';
        return String(record.text || record.summary || record.title || '').trim();
      })
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    return value.trim() ? [value.trim()] : [];
  }

  const record = asRecord(value);
  if (!record) return [];

  return Object.values(record)
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

function renderNarrativeCell(value: unknown) {
  const items = normalizeNarrativeContent(value);
  if (items.length === 0) {
    return '--';
  }

  if (items.length === 1) {
    return items[0];
  }

  return (
    <ul className="mb-0 ps-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export default function AdminAuditDetailPage() {
  const params = useParams<{ userId: string; auditId: string }>();
  const userId = Number(params.userId);
  const auditId = Number(params.auditId);

  const [audit, setAudit] = useState<AdminAuditDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadAudit = async () => {
      if (!Number.isFinite(userId) || userId <= 0 || !Number.isFinite(auditId) || auditId <= 0) {
        if (mounted) {
          setError('Invalid user id or audit id.');
          setIsLoading(false);
        }
        return;
      }

      const sessionUser = getAuthUser();
      if (!sessionUser || !isAdminUser(sessionUser)) {
        if (mounted) {
          setError('Only admins can access this audit detail.');
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetchAdminUserAudit({
          admin_user_id: sessionUser.id,
          user_id: userId,
          audit_id: auditId,
        });

        if (mounted) {
          setError(null);
          setAudit(response.audit);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load this audit right now.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAudit();

    return () => {
      mounted = false;
    };
  }, [auditId, userId]);

  const resultPayload = useMemo(
    () => asRecord(audit?.scan_response ?? audit?.response_payload),
    [audit]
  );
  const results = useMemo(
    () => asRecord(resultPayload?.results ?? null),
    [resultPayload]
  );
  const sentiment = useMemo(
    () => normalizeSentimentBreakdown(results?.sentiment_breakdown ?? null),
    [results]
  );
  const themes = useMemo(() => normalizeThemes(results), [results]);
  const mentions = useMemo(() => normalizeMentions(results), [results]);
  const recommendations = useMemo(() => normalizeRecommendations(results), [results]);
  const auditNarrative = useMemo(() => asRecord(results?.audit ?? null), [results]);
  const score = useMemo(
    () => toNumber(results?.reputation_score ?? audit?.reputation_score ?? 0),
    [results, audit]
  );

  if (error) {
    return (
      <div className="d-grid gap-3">
        <Link href={`/admin/users/${userId}`} className="btn btn-outline-secondary btn-sm justify-self-start">
          Back to User
        </Link>
        <div className="alert alert-danger mb-0">{error}</div>
      </div>
    );
  }

  if (isLoading || !audit) {
    return <div className={styles.muted}>Loading audit details...</div>;
  }

  return (
    <div className="d-grid gap-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h2 className="h4 mb-1">Audit #{audit.id}</h2>
          <p className={`${styles.muted} mb-0`}>
            {audit.business_name || 'Unnamed Business'} | {formatDateTime(audit.created_at)}
          </p>
        </div>
        <Link href={`/admin/users/${userId}`} className="btn btn-outline-secondary btn-sm">
          Back to User
        </Link>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Audit Summary</h3>
          <span className={styles.badgeSoft}>Status: {audit.status}</span>
        </div>
        <div className={styles.tableWrap}>
          <table className="table mb-0">
            <tbody>
              <tr>
                <th scope="row">Business Name</th>
                <td>{audit.business_name || '--'}</td>
              </tr>
              <tr>
                <th scope="row">Website</th>
                <td>{audit.website || '--'}</td>
              </tr>
              <tr>
                <th scope="row">Location</th>
                <td>{audit.location || '--'}</td>
              </tr>
              <tr>
                <th scope="row">Industry</th>
                <td>{audit.industry || '--'}</td>
              </tr>
              <tr>
                <th scope="row">Reputation Score</th>
                <td>{score || '--'} / 100</td>
              </tr>
              <tr>
                <th scope="row">Scanned At</th>
                <td>{formatDateTime(audit.scan_date)}</td>
              </tr>
              <tr>
                <th scope="row">Error</th>
                <td>{audit.error_message || '--'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Sentiment Breakdown</h3>
        <div className="row g-3 mt-1">
          <div className="col-md-4">
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Positive</p>
              <p className={`${styles.statValue} text-success`}>{sentiment.positive}%</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Neutral</p>
              <p className={`${styles.statValue} text-warning`}>{sentiment.neutral}%</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Negative</p>
              <p className={`${styles.statValue} text-danger`}>{sentiment.negative}%</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Top Themes</h3>
        <div className="d-flex flex-wrap gap-2 mt-2">
          {themes.length > 0 ? (
            themes.map((theme) => (
              <span key={theme} className="badge bg-primary-subtle text-primary-emphasis">
                {theme}
              </span>
            ))
          ) : (
            <span className={styles.muted}>No theme data available for this audit.</span>
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Top Mentions</h3>
        <div className={styles.tableWrap}>
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Source</th>
                <th>Sentiment</th>
                <th>Summary</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              {mentions.length > 0 ? (
                mentions.map((mention, index) => (
                  <tr key={`${mention.url}-${index}`}>
                    <td>{mention.source}</td>
                    <td>{mention.sentiment}</td>
                    <td>{mention.summary}</td>
                    <td>
                      {mention.url ? (
                        <a href={mention.url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        '--'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.muted}>No mention data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Recommendations</h3>
        {recommendations.length > 0 ? (
          <ol className="mb-0">
            {recommendations.map((recommendation, index) => (
              <li key={`${recommendation}-${index}`} className="mb-2">
                {recommendation}
              </li>
            ))}
          </ol>
        ) : (
          <p className={`${styles.muted} mb-0`}>No recommendations were returned for this audit.</p>
        )}
      </section>

      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Audit Narrative</h3>
        <div className={styles.tableWrap}>
          <table className="table mb-0">
            <tbody>
              <tr>
                <th scope="row">Executive Summary</th>
                <td>{renderNarrativeCell(auditNarrative?.executive_summary)}</td>
              </tr>
              <tr>
                <th scope="row">Detailed Analysis</th>
                <td>{renderNarrativeCell(auditNarrative?.detailed_analysis)}</td>
              </tr>
              <tr>
                <th scope="row">Risk Factors</th>
                <td>{renderNarrativeCell(auditNarrative?.risk_factors)}</td>
              </tr>
              <tr>
                <th scope="row">Opportunities</th>
                <td>{renderNarrativeCell(auditNarrative?.opportunities)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
