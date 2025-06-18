import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/layout/Layout";
import AuthPage from "./components/auth/AuthPage";
import LoginPage from "./components/auth/LoginForm";
import StudentDashboard from "./components/student/StudentDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import Students from "./components/admin/Students";
import AnnouncementAdmin from "./components/admin/AnnouncementAdmin";
import AuditLogs from "./components/admin/AuditLogs";
import FinancialAdmin from "./components/admin/FinancialAdmin";
import SupportAdmin from "./components/admin/SupportAdmin";
import AnalyticsAdmin from "./components/admin/AnalyticsAdmin";
import Profile from "./components/student/Profile";
import Financial from "./components/student/Financial";
import AcademicRecords from "./components/student/AcademicRecords";
import EnrollmentStatus from "./components/student/EnrollmentStatus";
import GuestDashboard from "./components/guest/GuestDashboard";
import LoadingSpinner from "./components/shared/LoadingSpinner";
import Announcement from "./components/student/Announcement";
import Support from "./components/student/Support";
import { useNavigate } from "react-router-dom";

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  // const [showGuestDashboard, setShowGuestDashboard] = useState(false);
  const navigate = useNavigate();

  const handleGuestAccess = () => {
    navigate("/guest");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // if (!user && !showGuestDashboard) {
  //   return <AuthPage onGuestAccess={() => setShowGuestDashboard(true)} />;
  // }

  // if (showGuestDashboard && !user) {
  //   return (
  //     <Layout>
  //       <GuestDashboard />
  //     </Layout>
  //   );
  // }

  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          {user?.role === "student" && (
            <>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/academics" element={<AcademicRecords />} />
              <Route path="/enrollment" element={<EnrollmentStatus />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/announcement" element={<Announcement />} />
              <Route path="/support" element={<Support />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
          {user?.role === "admin" && (
            <>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<Students />} />
              <Route
                path="/admin/announcementAdmin"
                element={<AnnouncementAdmin />}
              />
              <Route path="/admin/auditLogs" element={<AuditLogs />} />
              <Route
                path="/admin/financialAdmin"
                element={<FinancialAdmin />}
              />
              <Route path="/admin/supportAdmin" element={<SupportAdmin />} />
              <Route
                path="/admin/analyticsAdmin"
                element={<AnalyticsAdmin />}
              />
              <Route
                path="/"
                element={<Navigate to="/admin/dashboard" replace />}
              />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/guest" element={<GuestDashboard />} />
          <Route
            path="/login"
            element={<AuthPage onGuestAccess={handleGuestAccess} />}
          />{" "}
          <Route
            path="/"
            element={<AuthPage onGuestAccess={handleGuestAccess} />}
          />{" "}
        </Routes>
      </Layout>
    </ThemeProvider>
  );
};
function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AppContent />
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
