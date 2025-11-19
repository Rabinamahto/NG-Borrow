// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

/**
 * ProtectedRoute
 * - Renders children only when authenticated
 * - Shows a loading message while auth initializes
 * - Redirects to /login when unauthenticated
 *
 * Usage:
 * <ProtectedRoute>
 *   <SomeProtectedComponent />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // You can replace this with a spinner component
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;