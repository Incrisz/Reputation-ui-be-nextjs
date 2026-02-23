'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getAuthUser, isAdminUser } from '@/lib/auth';
import {
  createAdminPlan,
  deleteAdminPlan,
  fetchAdminPlans,
  updateAdminPlan,
} from '../lib/adminApi';
import type { UserPlan } from '@/lib/plans';
import styles from '../admin.module.css';

const FEATURE_MAX_AUDITS = 'max_audits_per_month';
const FEATURE_CONCURRENT = 'concurrent_audits_allowed';

interface PlanFormState {
  name: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  is_active: boolean;
  is_custom: boolean;
  contact_sales: boolean;
  max_audits_per_month: string;
  concurrent_audits_allowed: string;
}

const defaultFormState: PlanFormState = {
  name: '',
  description: '',
  price_monthly: '0',
  price_yearly: '0',
  is_active: true,
  is_custom: false,
  contact_sales: false,
  max_audits_per_month: '0',
  concurrent_audits_allowed: '1',
};

function toFormState(plan: UserPlan): PlanFormState {
  return {
    name: plan.name,
    description: plan.description || '',
    price_monthly: String(plan.price_monthly),
    price_yearly: String(plan.price_yearly),
    is_active: plan.is_active,
    is_custom: plan.is_custom,
    contact_sales: plan.contact_sales,
    max_audits_per_month: String(plan.features[FEATURE_MAX_AUDITS] ?? 0),
    concurrent_audits_allowed: String(plan.features[FEATURE_CONCURRENT] ?? 1),
  };
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [formState, setFormState] = useState<PlanFormState>(defaultFormState);

  const adminUser = getAuthUser();
  const adminUserId = adminUser?.id;

  const loadPlans = async () => {
    if (!adminUserId || !isAdminUser(adminUser)) {
      setError('Only admins can manage plans.');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetchAdminPlans({
        admin_user_id: adminUserId,
        show_inactive: true,
      });
      setPlans(response.plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load plans.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlanModalOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        setIsPlanModalOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isPlanModalOpen, isSubmitting]);

  const openCreateModal = () => {
    setEditingPlanId(null);
    setFormState(defaultFormState);
    setError(null);
    setIsPlanModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);

    if (!adminUserId || !isAdminUser(adminUser)) {
      setError('Only admins can manage plans.');
      return;
    }

    if (!formState.name.trim()) {
      setError('Plan name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        admin_user_id: adminUserId,
        name: formState.name.trim(),
        description: formState.description.trim() || null,
        price_monthly: Number(formState.price_monthly || 0),
        price_yearly: Number(formState.price_yearly || 0),
        is_active: formState.is_active,
        is_custom: formState.is_custom,
        contact_sales: formState.contact_sales,
        features: {
          [FEATURE_MAX_AUDITS]: Number(formState.max_audits_per_month || 0),
          [FEATURE_CONCURRENT]: Number(formState.concurrent_audits_allowed || 1),
        },
      };

      if (editingPlanId) {
        await updateAdminPlan({
          ...payload,
          plan_id: editingPlanId,
        });
        setSuccess('Plan updated successfully.');
      } else {
        await createAdminPlan(payload);
        setSuccess('Plan created successfully.');
      }

      setFormState(defaultFormState);
      setEditingPlanId(null);
      setIsPlanModalOpen(false);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (plan: UserPlan) => {
    setEditingPlanId(plan.id);
    setFormState(toFormState(plan));
    setSuccess(null);
    setError(null);
    setIsPlanModalOpen(true);
  };

  const handleDelete = async (planId: number) => {
    if (!adminUserId || !isAdminUser(adminUser)) return;
    if (!window.confirm('Delete this plan? This cannot be undone.')) return;

    try {
      setError(null);
      setSuccess(null);
      await deleteAdminPlan({ admin_user_id: adminUserId, plan_id: planId });
      setSuccess('Plan deleted successfully.');
      if (editingPlanId === planId) {
        setEditingPlanId(null);
        setFormState(defaultFormState);
      }
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this plan.');
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsPlanModalOpen(false);
  };

  const totalActivePlans = useMemo(
    () => plans.filter((plan) => plan.is_active).length,
    [plans]
  );

  return (
    <div className="d-grid gap-3">
      <section className={styles.statGrid}>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Total Plans</p>
          <p className={styles.statValue}>{isLoading ? '--' : plans.length}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Active Plans</p>
          <p className={styles.statValue}>{isLoading ? '--' : totalActivePlans}</p>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>All Plans</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
            Create Plan
          </button>
        </div>

        {error ? <div className="alert alert-danger py-2 mb-3">{error}</div> : null}
        {success ? <div className="alert alert-success py-2 mb-3">{success}</div> : null}

        <div className={styles.tableWrap}>
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Monthly</th>
                <th>Yearly</th>
                <th>Status</th>
                <th>Features</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.muted}>No plans found.</td>
                </tr>
              ) : null}

              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <div className="fw-semibold">{plan.name}</div>
                    <div className={styles.muted}>{plan.description || '--'}</div>
                  </td>
                  <td>${plan.price_monthly.toFixed(2)}</td>
                  <td>${plan.price_yearly.toFixed(2)}</td>
                  <td>
                    {plan.is_active ? (
                      <span className="badge bg-success-subtle text-success-emphasis">Active</span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary-emphasis">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.muted}>
                      Audits: {plan.features[FEATURE_MAX_AUDITS] ?? '--'}
                    </div>
                    <div className={styles.muted}>
                      Concurrent: {plan.features[FEATURE_CONCURRENT] ?? '--'}
                    </div>
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleEdit(plan)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(plan.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {isLoading ? (
                <tr>
                  <td colSpan={6} className={styles.muted}>Loading plans...</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {isPlanModalOpen ? (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-label={editingPlanId ? 'Edit plan' : 'Create plan'}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.panelTitle}>{editingPlanId ? 'Edit Plan' : 'Create Plan'}</h2>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeModal}>
                Close
              </button>
            </div>

            <form className={styles.modalBody} onSubmit={handleSubmit}>
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Plan Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Monthly Price</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step="0.01"
                    value={formState.price_monthly}
                    onChange={(event) => setFormState((prev) => ({ ...prev, price_monthly: event.target.value }))}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Yearly Price</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step="0.01"
                    value={formState.price_yearly}
                    onChange={(event) => setFormState((prev) => ({ ...prev, price_yearly: event.target.value }))}
                  />
                </div>

                <div className="col-md-8">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formState.description}
                    onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Max Audits / Month</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step="1"
                    value={formState.max_audits_per_month}
                    onChange={(event) => setFormState((prev) => ({ ...prev, max_audits_per_month: event.target.value }))}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Concurrent Audits</label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    step="1"
                    value={formState.concurrent_audits_allowed}
                    onChange={(event) => setFormState((prev) => ({ ...prev, concurrent_audits_allowed: event.target.value }))}
                  />
                </div>

                <div className="col-md-12 d-flex flex-wrap gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="plan-active"
                      checked={formState.is_active}
                      onChange={(event) => setFormState((prev) => ({ ...prev, is_active: event.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="plan-active">Active</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="plan-custom"
                      checked={formState.is_custom}
                      onChange={(event) => setFormState((prev) => ({ ...prev, is_custom: event.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="plan-custom">Custom</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="plan-contact-sales"
                      checked={formState.contact_sales}
                      onChange={(event) => setFormState((prev) => ({ ...prev, contact_sales: event.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="plan-contact-sales">Contact Sales</label>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Plan'}
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
