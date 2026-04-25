import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getInitials } from '@/utils/format';

export default function TopBar({ title }: { title: string }) {
  const user = useAuthStore((s) => s.user);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.firstName} {user.lastName}</span>
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
            {getInitials(user.firstName, user.lastName)}
          </div>
        </div>
      )}
    </header>
  );
}