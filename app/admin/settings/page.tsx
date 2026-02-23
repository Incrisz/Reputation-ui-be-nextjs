'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAuthUser, isAdminUser } from '@/lib/auth';
import {
  fetchAdminEnvSettings,
  updateAdminEnvSettings,
  type AdminEnvSettings,
} from '../lib/adminApi';
import styles from '../admin.module.css';

const SIDEBAR_KEY = 'admin_sidebar_open';

interface SettingsField {
  key: string;
  label: string;
  type?: 'text' | 'password' | 'number';
  placeholder?: string;
}

interface SettingsSection {
  group: keyof AdminEnvSettings;
  title: string;
  description: string;
  fields: SettingsField[];
}

const settingsSections: SettingsSection[] = [
  {
    group: 'mail',
    title: 'Mail',
    description: 'SMTP and sender details.',
    fields: [
      { key: 'MAIL_MAILER', label: 'Mailer', placeholder: 'smtp' },
      { key: 'MAIL_SCHEME', label: 'Scheme', placeholder: 'smtp / smtps' },
      { key: 'MAIL_ENCRYPTION', label: 'Encryption', placeholder: 'tls / ssl' },
      { key: 'MAIL_HOST', label: 'Host', placeholder: 'mail.example.com' },
      { key: 'MAIL_PORT', label: 'Port', type: 'number', placeholder: '465' },
      { key: 'MAIL_USERNAME', label: 'Username' },
      { key: 'MAIL_PASSWORD', label: 'Password', type: 'password' },
      { key: 'MAIL_FROM_ADDRESS', label: 'From Address', placeholder: 'no-reply@example.com' },
      { key: 'MAIL_FROM_NAME', label: 'From Name', placeholder: 'BizReputation AI' },
    ],
  },
  {
    group: 'stripe',
    title: 'Stripe',
    description: 'Payment processing keys and redirect URLs.',
    fields: [
      { key: 'STRIPE_SECRET_KEY', label: 'Secret Key', type: 'password' },
      { key: 'STRIPE_PUBLISHABLE_KEY', label: 'Publishable Key' },
      { key: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook Secret', type: 'password' },
      { key: 'STRIPE_SUCCESS_URL', label: 'Success URL' },
      { key: 'STRIPE_CANCEL_URL', label: 'Cancel URL' },
    ],
  },
  {
    group: 'serper',
    title: 'Serper',
    description: 'Search fallback provider settings.',
    fields: [
      { key: 'SERPER_API_KEY', label: 'Serper API Key', type: 'password' },
      { key: 'SEARCH_LLM_FALLBACK_TO_SERPER', label: 'LLM Fallback Enabled', placeholder: 'true / false' },
    ],
  },
  {
    group: 'google_places',
    title: 'Google Places',
    description: 'Places API key used in audits and enrichment.',
    fields: [
      { key: 'GOOGLE_PLACES_API_KEY', label: 'Google Places API Key', type: 'password' },
    ],
  },
  {
    group: 'ai',
    title: 'AI',
    description: 'LLM provider and model credentials.',
    fields: [
      { key: 'LLM_PROVIDER', label: 'LLM Provider', placeholder: 'openai / openrouter' },
      { key: 'SEARCH_PROVIDER', label: 'Search Provider', placeholder: 'llm / serper' },
      { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', type: 'password' },
      { key: 'OPENAI_MODEL', label: 'OpenAI Model', placeholder: 'gpt-5-nano' },
      { key: 'OPENAI_BASE_URL', label: 'OpenAI Base URL' },
      { key: 'OPENROUTER_API_KEY', label: 'OpenRouter API Key', type: 'password' },
      { key: 'OPENROUTER_MODEL', label: 'OpenRouter Model' },
      { key: 'OPENROUTER_BASE_URL', label: 'OpenRouter Base URL' },
      { key: 'OPENROUTER_SITE_URL', label: 'OpenRouter Site URL' },
      { key: 'OPENROUTER_APP_TITLE', label: 'OpenRouter App Title' },
    ],
  },
  {
    group: 'google_auth',
    title: 'Google Auth',
    description: 'OAuth client credentials.',
    fields: [
      { key: 'GOOGLE_CLIENT_ID', label: 'Google Client ID' },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'Google Client Secret', type: 'password' },
    ],
  },
];

function buildEmptySettings(): AdminEnvSettings {
  const settings: AdminEnvSettings = {
    mail: {},
    stripe: {},
    serper: {},
    google_places: {},
    ai: {},
    google_auth: {},
  };

  settingsSections.forEach((section) => {
    section.fields.forEach((field) => {
      settings[section.group][field.key] = '';
    });
  });

  return settings;
}

export default function AdminSettingsPage() {
  const authUser = getAuthUser();
  const adminName = authUser && isAdminUser(authUser) ? authUser.name || '--' : '--';
  const adminEmail = authUser && isAdminUser(authUser) ? authUser.email || '--' : '--';
  const adminUserId = authUser && isAdminUser(authUser) ? authUser.id : null;
  const [sidebarOpenByDefault, setSidebarOpenByDefault] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const sidebarValue = localStorage.getItem(SIDEBAR_KEY);
    return sidebarValue === null ? true : sidebarValue === '1';
  });
  const [settings, setSettings] = useState<AdminEnvSettings>(buildEmptySettings());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedPreferences, setSavedPreferences] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [isSavingSection, setIsSavingSection] = useState<keyof AdminEnvSettings | null>(null);
  const [sectionSavedState, setSectionSavedState] = useState<Record<string, boolean>>({});
  const [sectionErrors, setSectionErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const loadSettings = async () => {
      if (!adminUserId) {
        setError('Only admins can access settings.');
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const response = await fetchAdminEnvSettings({
          admin_user_id: adminUserId,
        });

        setSettings((prev) => {
          const nextSettings = {
            ...prev,
          };

          settingsSections.forEach((section) => {
            const groupValues = {
              ...nextSettings[section.group],
            };
            section.fields.forEach((field) => {
              groupValues[field.key] = response.settings[section.group]?.[field.key] ?? '';
            });
            nextSettings[section.group] = groupValues;
          });

          return nextSettings;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load admin settings.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadSettings();
  }, [adminUserId]);

  const handleSavePreferences = () => {
    localStorage.setItem(SIDEBAR_KEY, sidebarOpenByDefault ? '1' : '0');
    setSavedPreferences(true);
    window.setTimeout(() => setSavedPreferences(false), 1500);
  };

  const handleSettingChange = (group: keyof AdminEnvSettings, key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }));
  };

  const toggleSecretVisibility = (fieldId: string) => {
    setVisibleSecrets((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const handleSaveSection = async (group: keyof AdminEnvSettings) => {
    if (!adminUserId) {
      setError('Only admins can update settings.');
      return;
    }

    try {
      setError(null);
      setSectionErrors((prev) => ({
        ...prev,
        [group]: null,
      }));
      setIsSavingSection(group);

      const response = await updateAdminEnvSettings({
        admin_user_id: adminUserId,
        settings: {
          [group]: settings[group],
        } as Partial<AdminEnvSettings>,
      });

      setSettings((prev) => ({
        ...prev,
        [group]: response.settings[group],
      }));
      setSectionSavedState((prev) => ({
        ...prev,
        [group]: true,
      }));
      window.setTimeout(() => {
        setSectionSavedState((prev) => ({
          ...prev,
          [group]: false,
        }));
      }, 1500);
    } catch (err) {
      setSectionErrors((prev) => ({
        ...prev,
        [group]: err instanceof Error ? err.message : 'Unable to save this section.',
      }));
    } finally {
      setIsSavingSection(null);
    }
  };

  const totalKeys = useMemo(
    () => settingsSections.reduce((count, section) => count + section.fields.length, 0),
    []
  );

  return (
    <div className="d-grid gap-3">
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Portal Settings</h2>
        <p className={`${styles.muted} mb-0`}>
          Update integration keys and service configuration from one place.
        </p>
      </section>

      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Admin Account</h3>
        <div className={styles.tableWrap}>
          <table className="table mb-0">
            <tbody>
              <tr>
                <th scope="row">Name</th>
                <td>{adminName}</td>
              </tr>
              <tr>
                <th scope="row">Email</th>
                <td>{adminEmail}</td>
              </tr>
              <tr>
                <th scope="row">Role</th>
                <td>admin</td>
              </tr>
              <tr>
                <th scope="row">Managed Keys</th>
                <td>{totalKeys}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Interface</h3>
        <div className="form-check form-switch mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="sidebarDefault"
            checked={sidebarOpenByDefault}
            onChange={(event) => setSidebarOpenByDefault(event.target.checked)}
          />
          <label className="form-check-label" htmlFor="sidebarDefault">
            Keep sidebar open by default
          </label>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleSavePreferences}>
          Save Preferences
        </button>
        {savedPreferences ? <span className="text-success ms-3">Saved</span> : null}
      </section>

      <section className="d-grid gap-3">
        {settingsSections.map((section) => (
          <section className={styles.panel} key={section.group}>
            <div className={styles.panelHeader}>
              <div>
                <h3 className={styles.panelTitle}>{section.title}</h3>
                <p className={`${styles.muted} mb-0`}>{section.description}</p>
              </div>
            </div>

            <div className="row g-3">
              {section.fields.map((field) => (
                <div className="col-lg-6" key={`${section.group}-${field.key}`}>
                  {(() => {
                    const fieldId = `${section.group}-${field.key}`;
                    const isSecretField = field.type === 'password';
                    const isVisible = Boolean(visibleSecrets[fieldId]);
                    const inputType = isSecretField
                      ? (isVisible ? 'text' : 'password')
                      : (field.type || 'text');

                    return (
                      <>
                        <label htmlFor={fieldId} className="form-label">
                          {field.label}
                        </label>
                        <div className={isSecretField ? 'input-group' : undefined}>
                          <input
                            id={fieldId}
                            type={inputType}
                            className="form-control"
                            value={settings[section.group][field.key] ?? ''}
                            placeholder={field.placeholder}
                            onChange={(event) => handleSettingChange(section.group, field.key, event.target.value)}
                            autoComplete="off"
                          />
                          {isSecretField ? (
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => toggleSecretVisibility(fieldId)}
                              aria-label={isVisible ? 'Hide value' : 'Show value'}
                              title={isVisible ? 'Hide value' : 'Show value'}
                            >
                              {isVisible ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="none" aria-hidden="true">
                                  <path d="M32 128s34-64 96-64 96 64 96 64-34 64-96 64-96-64-96-64Z" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                                  <circle cx="128" cy="128" r="40" stroke="currentColor" strokeWidth="16" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="none" aria-hidden="true">
                                  <path d="M32 128s34-64 96-64c22 0 40 6 55 15" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M224 128s-34 64-96 64c-22 0-40-6-55-15" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                                  <line x1="40" y1="40" x2="216" y2="216" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
                                </svg>
                              )}
                            </button>
                          ) : null}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>

            <div className="d-flex flex-wrap gap-2 align-items-center mt-3">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={isLoading || isSavingSection === section.group}
                onClick={() => void handleSaveSection(section.group)}
              >
                {isSavingSection === section.group ? 'Saving...' : `Save ${section.title}`}
              </button>
              {sectionSavedState[section.group] ? <span className="text-success">Saved</span> : null}
            </div>
            {sectionErrors[section.group] ? (
              <div className="alert alert-danger py-2 mt-3 mb-0">{sectionErrors[section.group]}</div>
            ) : null}
          </section>
        ))}

        {error ? (
          <section className={styles.panel}>
            <div className="alert alert-danger py-2 mb-0">{error}</div>
          </section>
        ) : null}
      </section>
    </div>
  );
}
