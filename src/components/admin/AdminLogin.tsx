import { useState, type SubmitEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle } from 'lucide-react';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      // Redirect to admin dashboard
      window.location.assign('/admin/dashboard/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-shell">
        <p className="admin-kicker">marioscorner / control</p>
        <div className="admin-login-card">
          <div className="admin-login-icon">
              <Lock className="w-6 h-6 text-primary" />
          </div>

          <h1 className="admin-login-title">Admin Panel</h1>
          <p className="admin-login-intro">
            Sign in to update copy, uploads, and the public status indicator.
          </p>

          {/* Error Alert */}
          {error && (
            <div className="admin-login-error">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="admin-login-form">
            <div>
              <label htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="admin-input"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input"
                placeholder="Enter password"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="admin-login-submit"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="admin-login-footer">
            This area is protected. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
