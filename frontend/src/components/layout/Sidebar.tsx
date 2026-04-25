import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getInitials } from '@/utils/format';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: DashboardIcon },
    { to: '/projects', label: 'Projects', icon: ProjectsIcon },
    { to: '/my-time', label: 'My Time', icon: TimeIcon },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin', icon: AdminIcon }] : []),
    { to: '/profile', label: 'Profile', icon: ProfileIcon },
  ];

  return (
    <aside
      className={`bg-sidebar text-white flex flex-col transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-bold text-sm">
          J
        </div>
        {!collapsed && <span className="font-semibold text-lg">Jari</span>}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs font-medium shrink-0">
              {getInitials(user.firstName, user.lastName)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{user.role}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function ProjectsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-18 0A2.25 2.25 0 004.5 15.75h15a2.25 2.25 0 002.25-2.25V12m-18 0V6A2.25 2.25 0 014.5 3.75h15A2.25 2.25 0 0121.75 6v6" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.215-.585-7.499-1.632z" />
    </svg>
  );
}

function TimeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AdminIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.297-1.06.562-1.54.375-.68.945-1.28 1.844-1.28.9 0 1.47.6 1.844 1.28.265.48.472 1 .562 1.54.292.025.574.072.84.14.72.18 1.35.51 1.86.94.52.44.9.99 1.15 1.6.25.61.34 1.29.26 1.97-.08.67-.32 1.31-.69 1.87-.37.56-.87 1.03-1.47 1.38.1.57.1 1.16 0 1.73-.1.67-.35 1.3-.74 1.84-.39.54-.9.97-1.5 1.26-.6.29-1.27.43-1.95.41-.68-.02-1.34-.2-1.93-.54l-.22-.13-.22.13c-.59.34-1.25.52-1.93.54-.68.02-1.35-.12-1.95-.41-.6-.29-1.11-.72-1.5-1.26-.39-.54-.64-1.17-.74-1.84-.1-.57-.1-1.16 0-1.73-.6-.35-1.1-.82-1.47-1.38-.37-.56-.61-1.2-.69-1.87-.08-.68.01-1.36.26-1.97.25-.61.63-1.16 1.15-1.6.51-.43 1.14-.76 1.86-.94.266-.068.548-.115.84-.14z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 0h.008v.008H12v-.008zm0 0H9m3 0h3" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}