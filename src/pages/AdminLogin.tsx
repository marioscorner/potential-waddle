import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle, Sparkles } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(255,71,147,0.22),transparent_28rem),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_22rem),#0d0d0f] px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gray-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Portfolio Control
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gray-950/70 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {/* Header */}
          <div className="flex justify-center mb-8">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 shadow-lg shadow-primary/10">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>

          <h1 className="mb-2 text-center text-3xl font-bold text-white">
            Admin Panel
          </h1>
          <p className="mb-8 text-center text-sm leading-6 text-gray-400">
            Sign in to update copy, uploads, and the public status indicator.
          </p>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-primary"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-primary"
                placeholder="Enter password"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-8">
            This area is protected. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
