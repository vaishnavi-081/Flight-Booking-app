import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthProtector = ({ children }) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token || !userType) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default AuthProtector;