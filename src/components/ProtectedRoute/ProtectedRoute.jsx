import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../../contexts/AuthContext';

/**
 * ProtectedRoute — redirect to /dang-nhap if not authenticated.
 * If allowedRoles is provided, checks if the user's role is permitted.
 * If not permitted, redirects to their default home page based on role.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/dang-nhap" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // User does not have permission for this route, redirect to their home
    const homeRoute = ROLE_HOME[user.role] || '/';
    return <Navigate to={homeRoute} replace />;
  }

  return children;
};
