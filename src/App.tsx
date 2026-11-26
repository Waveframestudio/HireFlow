import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HireFlowProvider } from './context/HireFlowContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Jobs } from './pages/Jobs';
import { Pipeline } from './pages/Pipeline';
import { Candidates } from './pages/Candidates';
import { Interviews } from './pages/Interviews';
import { Reports } from './pages/Reports';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <HireFlowProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Ruta pública de acceso */}
              <Route path="/login" element={<Login />} />

              {/* Rutas protegidas */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vacantes"
                element={
                  <ProtectedRoute>
                    <Jobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pipeline"
                element={
                  <ProtectedRoute>
                    <Pipeline />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidatos"
                element={
                  <ProtectedRoute>
                    <Candidates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/entrevistas"
                element={
                  <ProtectedRoute>
                    <Interviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </HireFlowProvider>
    </AuthProvider>
  );
};

export default App;
