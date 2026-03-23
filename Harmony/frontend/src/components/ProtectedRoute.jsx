import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check if the access token exists in localStorage
  const isAuthenticated = !!localStorage.getItem('access_token');

  // If authenticated, render the child routes (Outlet)
  // If not, redirect to the login page
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;