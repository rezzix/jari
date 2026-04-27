import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getInitials } from '@/utils/format';

type NavItem = { to: string; label: string; icon: React.FC<{ className?: string }> };
type NavSection = { header?: string; items: NavItem[] };

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = user?.role;

  const sections: NavSection[] = [
    {
      items: [
        { to: '/', label: 'Dashboard', icon: DashboardIcon },
        { to: '/projects', label: 'Projects', icon: ProjectsIcon },
      ],
    },
    {
      header: 'Time',
      items: [
        { to: '/my-time', label: 'My Time', icon: TimeIcon },
        ...(role === 'ADMIN' || role === 'MANAGER'
          ? [{ to: '/timesheets', label: 'Timesheets', icon: TimesheetIcon }]
          : []),
      ],
    },
    {
      header: 'Insights',
      items: [
        ...(role === 'ADMIN' || role === 'MANAGER' || role === 'EXECUTIVE'
          ? [
              { to: '/reports', label: 'Reports', icon: ReportsIcon },
              { to: '/pmo', label: 'PMO', icon: PmoIcon },
            ]
          : []),
      ],
    },
    ...(role === 'ADMIN'
      ? [{ header: 'System', items: [{ to: '/admin', label: 'Admin', icon: AdminIcon }] }]
      : []),
  ].filter((s) => s.items.length > 0);

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

      <nav className="flex-1 py-4 px-2 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.header && !collapsed && (
              <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {section.header}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
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
            </div>
          </div>
        ))}
      </nav>

      {user && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3">
            <NavLink
              to="/profile"
              className="flex items-center gap-3 flex-1 min-w-0 group"
              title="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs font-medium shrink-0 group-hover:bg-primary-600 transition-colors">
                {getInitials(user.firstName, user.lastName)}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-white transition-colors">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{user.role}</p>
                </div>
              )}
            </NavLink>
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

function TimeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TimesheetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m7.5-12.75c0-.621-.504-1.125-1.125-1.125H5.625c-.621 0-1.125.504-1.125 1.125m13.5 0v1.5c0 .621-.504 1.125-1.125 1.125M5.625 4.5h12.75c.621 0 1.125.504 1.125 1.125M4.875 7.5h14.25M10.5 10.875h2.25M10.5 14.25h2.25" />
    </svg>
  );
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
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

function PmoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25A2.25 2.25 0 0010.5 14.25V3m-6.75 0h6.75M3.75 3h-1.5m1.5 0v11.25A2.25 2.25 0 006 16.5h2.25m4.5-13.5h6.75m-6.75 0V14.25A2.25 2.25 0 0013.5 16.5h2.25A2.25 2.25 0 0018 14.25V3m-4.5 0h6.75M10.5 16.5V21m0 0H6m4.5 0h7.5" />
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