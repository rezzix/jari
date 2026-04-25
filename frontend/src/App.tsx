import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AuthGuard from '@/components/guards/AuthGuard';
import AdminGuard from '@/components/guards/AdminGuard';
import GuestGuard from '@/components/guards/GuestGuard';
import AppLayout from '@/components/layout/AppLayout';
import LoadingScreen from '@/components/common/LoadingScreen';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPage from '@/pages/AdminPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import IssueDetailPage from '@/pages/IssueDetailPage';
import MyTimePage from '@/pages/MyTimePage';

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          }
        />
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectId/issues/:issueId" element={<IssueDetailPage />} />
          <Route path="/my-time" element={<MyTimePage />} />
          <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}