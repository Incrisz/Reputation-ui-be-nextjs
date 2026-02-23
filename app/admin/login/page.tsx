'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthUser, isAdminUser, loginUser, logoutUser } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncSession = async () => {
      const currentUser = getAuthUser();
      if (!currentUser) return;

      if (isAdminUser(currentUser)) {
        router.replace('/admin');
        return;
      }

      await logoutUser();
    };

    void syncSession();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter your admin email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await loginUser({ email, password });

      if (!isAdminUser(user)) {
        await logoutUser();
        setError('This account does not have admin access.');
        return;
      }

      router.replace('/admin');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to sign in right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="row align-items-center justify-content-center min-vh-100">
          <div className="col-xl-4 col-lg-5 col-md-6 col-sm-8">
            <div className="card custom-card border-0 shadow-lg">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <span className="badge bg-dark-subtle text-dark mb-2">Admin Portal</span>
                  <h3 className="fw-semibold mb-1">Admin Sign In</h3>
                  <p className="text-muted fs-14 mb-0">
                    Use your admin account to access user and audit management.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger py-2" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="admin-email" className="form-label fw-medium">Admin Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="admin-email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="admin-password" className="form-label fw-medium">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="admin-password"
                      placeholder="Enter Password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-wave w-100 mb-3" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in...' : 'Sign In to Admin'}
                  </button>
                </form>

                <div className="text-center">
                  <p className="text-muted mb-0">
                    Regular user? <Link href="/login" className="text-primary fw-medium">Go to user login</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
