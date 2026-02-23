import type { UserPlan, UserSubscription, UserUsageStats, PaymentHistoryRecord } from '@/lib/plans';

interface AdminApiErrorResponse {
  status: 'error';
  message?: string;
  errors?: Record<string, string[]>;
}

interface AdminApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
}

export interface AdminEnvSettings {
  mail: Record<string, string>;
  stripe: Record<string, string>;
  serper: Record<string, string>;
  google_places: Record<string, string>;
  ai: Record<string, string>;
  google_auth: Record<string, string>;
}

export interface AdminAuditSummary {
  id: number;
  status: string;
  business_name: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  reputation_score: number | null;
  scan_date: string | null;
  created_at: string | null;
  error_code: string | null;
  error_message: string | null;
}

export interface AdminUserListItem {
  id: number;
  name: string;
  email: string;
  role: string;
  company: string | null;
  industry: string | null;
  created_at: string | null;
  last_login_at: string | null;
  audit_runs_count: number;
  latest_audit_at: string | null;
  current_subscription: UserSubscription | null;
}

export interface AdminUsersResponse {
  status: 'success';
  total: number;
  users: AdminUserListItem[];
}

export interface AdminAuthEvent {
  id: number;
  event_type: string;
  provider: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface AdminUserDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  registration_provider: string | null;
  avatar_url: string | null;
  phone: string | null;
  company: string | null;
  industry: string | null;
  company_size: string | null;
  website: string | null;
  location: string | null;
  notification_preferences: Record<string, boolean> | null;
  last_login_at: string | null;
  last_login_provider: string | null;
  created_at: string | null;
  current_subscription: UserSubscription | null;
  usage: UserUsageStats;
  subscription_history: UserSubscription[];
  audit_history: AdminAuditSummary[];
  auth_events: AdminAuthEvent[];
  payment_history: PaymentHistoryRecord[];
}

export interface AdminUserDetailResponse {
  status: 'success';
  user: AdminUserDetail;
}

export interface AdminAuditDetail extends AdminAuditSummary {
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  scan_response: Record<string, unknown> | null;
}

export interface AdminAuditDetailResponse {
  status: 'success';
  user_id: number;
  audit: AdminAuditDetail;
}

export interface AdminPlansResponse {
  status: 'success';
  total: number;
  plans: UserPlan[];
}

export interface AdminPlanResponse {
  status: 'success';
  message: string;
  plan: UserPlan;
}

export interface AdminDeletePlanResponse {
  status: 'success';
  message: string;
}

export interface AdminEnvSettingsResponse {
  status: 'success';
  settings: AdminEnvSettings;
}

export interface AdminUpdateEnvSettingsResponse {
  status: 'success';
  message: string;
  settings: AdminEnvSettings;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000/api'
).replace(/\/$/, '');

function buildErrorMessage(data: AdminApiErrorResponse | null, fallback: string): string {
  if (data?.errors && typeof data.errors === 'object') {
    const firstField = Object.values(data.errors)[0];
    if (Array.isArray(firstField) && firstField.length > 0) {
      return String(firstField[0]);
    }
  }

  return data?.message || fallback;
}

async function requestAdmin<TSuccess>(
  path: string,
  fallbackErrorMessage: string,
  options: AdminApiRequestOptions = {}
): Promise<TSuccess> {
  const method = options.method ?? 'GET';
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      Accept: 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: (TSuccess & { status?: string }) | AdminApiErrorResponse | null = null;
  try {
    data = (await response.json()) as (TSuccess & { status?: string }) | AdminApiErrorResponse;
  } catch {
    throw new Error(fallbackErrorMessage);
  }

  if (
    !response.ok ||
    !data ||
    (typeof data === 'object' && 'status' in data && data.status === 'error')
  ) {
    throw new Error(buildErrorMessage((data as AdminApiErrorResponse) || null, fallbackErrorMessage));
  }

  return data as TSuccess;
}

export async function fetchAdminUsers(payload: {
  admin_user_id: number;
  limit?: number;
  search?: string;
  role?: 'user';
}): Promise<AdminUsersResponse> {
  const params = new URLSearchParams({
    admin_user_id: String(payload.admin_user_id),
  });

  if (payload.limit) params.set('limit', String(payload.limit));
  if (payload.search) params.set('search', payload.search);
  if (payload.role) params.set('role', payload.role);

  return requestAdmin<AdminUsersResponse>(
    `/admin/users?${params.toString()}`,
    'Unable to load admin users right now.'
  );
}

export async function fetchAdminUserDetail(payload: {
  admin_user_id: number;
  user_id: number;
  audits_limit?: number;
  auth_events_limit?: number;
  payments_limit?: number;
}): Promise<AdminUserDetailResponse> {
  const params = new URLSearchParams({
    admin_user_id: String(payload.admin_user_id),
  });

  if (payload.audits_limit) params.set('audits_limit', String(payload.audits_limit));
  if (payload.auth_events_limit) params.set('auth_events_limit', String(payload.auth_events_limit));
  if (payload.payments_limit) params.set('payments_limit', String(payload.payments_limit));

  return requestAdmin<AdminUserDetailResponse>(
    `/admin/users/${payload.user_id}?${params.toString()}`,
    'Unable to load admin user details right now.'
  );
}

export async function fetchAdminUserAudit(payload: {
  admin_user_id: number;
  user_id: number;
  audit_id: number;
}): Promise<AdminAuditDetailResponse> {
  const params = new URLSearchParams({
    admin_user_id: String(payload.admin_user_id),
  });

  return requestAdmin<AdminAuditDetailResponse>(
    `/admin/users/${payload.user_id}/audits/${payload.audit_id}?${params.toString()}`,
    'Unable to load this audit result right now.'
  );
}

export async function fetchAdminPlans(payload: {
  admin_user_id: number;
  show_inactive?: boolean;
}): Promise<AdminPlansResponse> {
  const params = new URLSearchParams({
    admin_user_id: String(payload.admin_user_id),
  });

  if (payload.show_inactive) {
    params.set('show_inactive', '1');
  }

  return requestAdmin<AdminPlansResponse>(
    `/admin/plans?${params.toString()}`,
    'Unable to load plans right now.'
  );
}

export async function createAdminPlan(payload: {
  admin_user_id: number;
  name: string;
  description?: string | null;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  is_custom: boolean;
  contact_sales: boolean;
  features: Record<string, number | null>;
}): Promise<AdminPlanResponse> {
  return requestAdmin<AdminPlanResponse>(
    '/admin/plans',
    'Unable to create plan right now.',
    {
      method: 'POST',
      body: payload,
    }
  );
}

export async function updateAdminPlan(payload: {
  admin_user_id: number;
  plan_id: number;
  name: string;
  description?: string | null;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  is_custom: boolean;
  contact_sales: boolean;
  features: Record<string, number | null>;
}): Promise<AdminPlanResponse> {
  return requestAdmin<AdminPlanResponse>(
    `/admin/plans/${payload.plan_id}`,
    'Unable to update plan right now.',
    {
      method: 'PUT',
      body: {
        admin_user_id: payload.admin_user_id,
        name: payload.name,
        description: payload.description,
        price_monthly: payload.price_monthly,
        price_yearly: payload.price_yearly,
        is_active: payload.is_active,
        is_custom: payload.is_custom,
        contact_sales: payload.contact_sales,
        features: payload.features,
      },
    }
  );
}

export async function deleteAdminPlan(payload: {
  admin_user_id: number;
  plan_id: number;
}): Promise<AdminDeletePlanResponse> {
  return requestAdmin<AdminDeletePlanResponse>(
    `/admin/plans/${payload.plan_id}?admin_user_id=${encodeURIComponent(String(payload.admin_user_id))}`,
    'Unable to delete plan right now.',
    {
      method: 'DELETE',
    }
  );
}

export async function fetchAdminEnvSettings(payload: {
  admin_user_id: number;
}): Promise<AdminEnvSettingsResponse> {
  const params = new URLSearchParams({
    admin_user_id: String(payload.admin_user_id),
  });

  return requestAdmin<AdminEnvSettingsResponse>(
    `/admin/settings/env?${params.toString()}`,
    'Unable to load admin settings right now.'
  );
}

export async function updateAdminEnvSettings(payload: {
  admin_user_id: number;
  settings: Partial<AdminEnvSettings>;
}): Promise<AdminUpdateEnvSettingsResponse> {
  return requestAdmin<AdminUpdateEnvSettingsResponse>(
    '/admin/settings/env',
    'Unable to save admin settings right now.',
    {
      method: 'PUT',
      body: {
        admin_user_id: payload.admin_user_id,
        ...payload.settings,
      },
    }
  );
}

export function formatDateTime(value: string | null): string {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatPlanLabel(plan: UserPlan | null | undefined): string {
  if (!plan) return 'No plan';
  return plan.contact_sales ? `${plan.name} (Contact Sales)` : plan.name;
}
