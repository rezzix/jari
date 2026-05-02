import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getPublicOrganization } from '@/api/organization';
import type { OrganizationConfig } from '@/types';
import Spinner from '@/components/common/Spinner';

const features = [
  { icon: '▸', label: 'Issue Tracking' },
  { icon: '▸', label: 'Kanban Boards' },
  { icon: '▸', label: 'Time Tracking' },
  { icon: '▸', label: 'Sprint Planning' },
  { icon: '▸', label: 'Wiki Docs' },
  { icon: '▸', label: 'RAID Logs' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [org, setOrg] = useState<OrganizationConfig | null>(null);
  const { login, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  useEffect(() => {
    getPublicOrganization().then(setOrg);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 flex">
        {/* Left branded panel — hidden on mobile */}
        <div className="hidden md:flex md:w-[40%] lg:w-[45%] bg-primary-600 flex-col justify-between p-10 lg:p-14">
          <div>
            <div className="flex items-center gap-3 mb-12">
              {org?.logo ? (
                <img src={org.logo} alt={org.name} className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center text-lg font-bold backdrop-blur-sm">
                  J
                </div>
              )}
              <span className="text-xl font-bold text-white tracking-tight">{org?.name ?? 'Jari'}</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
              Project Management<br />for your team
            </h2>
            <p className="text-primary-200 text-sm lg:text-base leading-relaxed max-w-xs">
              Manage issues, track time, plan sprints, and document your projects — all in one place.
            </p>
          </div>

          <ul className="space-y-2.5">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5 text-primary-100 text-sm lg:text-base">
                <span className="text-primary-300 font-medium">{f.icon}</span>
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-sm">
            {/* Mobile-only logo */}
            <div className="flex md:hidden items-center gap-2.5 mb-8 justify-center">
              {org?.logo ? (
                <img src={org.logo} alt={org.name} className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center text-lg font-bold">
                  J
                </div>
              )}
              <span className="text-xl font-bold text-gray-900 tracking-tight">{org?.name ?? 'Jari'}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500 mb-7">Sign in to your workspace</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearError(); }}
                  required
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {isLoading && <Spinner className="h-4 w-4" />}
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer with org info */}
      {org && (
        <footer className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-3">
              {org.logo && <img src={org.logo} alt={org.name} className="h-6 w-6 rounded object-cover" />}
              <span className="font-medium text-gray-700">{org.name}</span>
              {org.address && <span className="hidden sm:inline">· {org.address}</span>}
            </div>
            <div className="flex items-center gap-4">
              {org.website && (
                <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                  {org.website}
                </a>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}