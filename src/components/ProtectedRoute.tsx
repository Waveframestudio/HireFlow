import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from './Layout';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF4EC] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#11314E] flex items-center justify-center text-white shadow-xl animate-pulse mb-3">
          <span className="font-extrabold text-lg tracking-wider text-[#EC623E]">HF</span>
        </div>
        <p className="text-xs font-bold text-[#11314E] animate-pulse">
          Cargando sesión...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};
