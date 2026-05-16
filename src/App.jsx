import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout/MainLayout';
import { LandingLayout } from './components/layout/LandingLayout/LandingLayout';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard/AdminDashboard';
import { AdminCoursesPage } from './pages/AdminCoursesPage/AdminCoursesPage';
import { AdminCourseDetail } from './pages/AdminCourseDetail/AdminCourseDetail';
import { AdminAssignmentEditor } from './pages/AdminAssignmentEditor/AdminAssignmentEditor';
import { AdminAssignmentOverview } from './pages/AdminAssignmentOverview/AdminAssignmentOverview';
import { AdminStudentsPage } from './pages/AdminStudentsPage/AdminStudentsPage';
import { AdminStudentDetail } from './pages/AdminStudentDetail/AdminStudentDetail';
import { AdminGradingQueue } from './pages/AdminGradingQueue/AdminGradingQueue';
import { AdminGradingDetail } from './pages/AdminGradingDetail/AdminGradingDetail';
import { AdminUserManagement } from './pages/AdminUserManagement/AdminUserManagement';
import { DesignSystem } from './pages/DesignSystem/DesignSystem';
import { LandingPage } from './pages/LandingPage/LandingPage';
import { SchedulePage } from './pages/SchedulePage/SchedulePage';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { HomeworkPage } from './pages/HomeworkPage/HomeworkPage';
import { HomeworkAttempt } from './pages/HomeworkAttempt/HomeworkAttempt';
import { HomeworkResult } from './pages/HomeworkResult/HomeworkResult';
import { SettingsPage } from './pages/SettingsPage/SettingsPage';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Routes>
      {/* Design System reference */}
      <Route path="/design-system" element={<DesignSystem />} />

      {/* Auth */}
      <Route path="/dang-nhap" element={<LoginPage />} />

      {/* Landing + public */}
      <Route path="/" element={<LandingLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="lich-khai-giang" element={<SchedulePage />} />
      </Route>

      {/* Protected app routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Shared */}
        <Route path="dashboard" element={isAdmin ? <AdminDashboard /> : <Dashboard />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Student routes */}
        <Route path="homework" element={<ProtectedRoute allowedRoles={['student']}><HomeworkPage /></ProtectedRoute>} />
        <Route path="homework/:id/attempt" element={<ProtectedRoute allowedRoles={['student']}><HomeworkAttempt /></ProtectedRoute>} />
        <Route path="homework/:id/result" element={<ProtectedRoute allowedRoles={['student']}><HomeworkResult /></ProtectedRoute>} />
        <Route path="homework/:id" element={<ProtectedRoute allowedRoles={['student']}><HomeworkResult /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="courses" element={<ProtectedRoute allowedRoles={['admin']}><AdminCoursesPage /></ProtectedRoute>} />
        <Route path="courses/:courseId" element={<ProtectedRoute allowedRoles={['admin']}><AdminCourseDetail /></ProtectedRoute>} />
        <Route path="courses/:courseId/assignments/:assignmentId" element={<ProtectedRoute allowedRoles={['admin']}><AdminAssignmentOverview /></ProtectedRoute>} />
        <Route path="courses/:courseId/assignments/:assignmentId/edit" element={<ProtectedRoute allowedRoles={['admin']}><AdminAssignmentEditor /></ProtectedRoute>} />
        <Route path="students" element={<ProtectedRoute allowedRoles={['admin']}><AdminStudentsPage /></ProtectedRoute>} />
        <Route path="students/:studentId" element={<ProtectedRoute allowedRoles={['admin']}><AdminStudentDetail /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUserManagement /></ProtectedRoute>} />
        <Route path="grading/:classId/:assignmentId" element={<ProtectedRoute allowedRoles={['admin']}><AdminGradingQueue /></ProtectedRoute>} />
        <Route path="grading/:classId/:assignmentId/:studentId" element={<ProtectedRoute allowedRoles={['admin']}><AdminGradingDetail /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

