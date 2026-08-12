import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSocket } from './hooks/useSocket';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { VolunteerPage } from './pages/VolunteerPage';
import { LeaderOverviewPage } from './pages/LeaderOverviewPage';
import { LeaderUsersPage } from './pages/LeaderUsersPage';
import { LeaderRequestsPage } from './pages/LeaderRequestsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UserRole } from './types/enums';

export default function App() {
  useSocket();

  return (
    <>
      <Toaster position="bottom-right" />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute role={UserRole.VOLUNTEER}>
                <VolunteerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader"
            element={
              <ProtectedRoute role={UserRole.LEADER}>
                <LeaderOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader/users"
            element={
              <ProtectedRoute role={UserRole.LEADER}>
                <LeaderUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader/requests"
            element={
              <ProtectedRoute role={UserRole.LEADER}>
                <LeaderRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
