import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HireFlowProvider } from './context/HireFlowContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Jobs } from './pages/Jobs';
import { Pipeline } from './pages/Pipeline';
import { Candidates } from './pages/Candidates';
import { Interviews } from './pages/Interviews';
import { Reports } from './pages/Reports';

export const App: React.FC = () => {
  return (
    <HireFlowProvider>
      <ToastProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vacantes" element={<Jobs />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/candidatos" element={<Candidates />} />
              <Route path="/entrevistas" element={<Interviews />} />
              <Route path="/reportes" element={<Reports />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider>
    </HireFlowProvider>
  );
};

export default App;
