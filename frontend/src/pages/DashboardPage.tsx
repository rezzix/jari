import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import ManagerDashboard from '@/pages/dashboard/ManagerDashboard';
import ExecutiveDashboard from '@/pages/dashboard/ExecutiveDashboard';
import ContributorDashboard from '@/pages/dashboard/ContributorDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'EXECUTIVE':
      return <ExecutiveDashboard />;
    default:
      return <ContributorDashboard />;
  }
}