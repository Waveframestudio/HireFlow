import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useHireFlow } from '../context/HireFlowContext';
import { PipelineStage, STAGE_LABELS } from '../types';

const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'];

export const Reports: React.FC = () => {
  const { applications, candidates, jobs } = useHireFlow();

  const stages: PipelineStage[] = [
    'applied',
    'screening',
    'interview',
    'offer',
    'hired',
    'rejected',
  ];

  const funnelData = stages.map((stage) => ({
    name: STAGE_LABELS[stage],
    cantidad: applications.filter((a) => a.stage === stage).length,
  }));

  const sourceMap = candidates.reduce<Record<string, number>>((acc, c) => {
    acc[c.source] = (acc[c.source] || 0) + 1;
    return acc;
  }, {});

  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({
    name,
    value,
  }));

  const totalApps = applications.length || 1;
  const hiredCount = applications.filter((a) => a.stage === 'hired').length;
  const conversionRate = Math.round((hiredCount / totalApps) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Reportes e Indicadores de Selección</h2>
        <p className="text-sm text-slate-500 mt-1">
          Métricas clave de RRHH para seguimiento de eficiencia, conversión y fuentes de talento.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase">Tasa de Contratación</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{conversionRate}%</p>
          <p className="text-xs text-slate-400 mt-1">
            {hiredCount} contratados sobre {applications.length} postulaciones
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase">Vacantes Activas</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {jobs.filter((j) => j.status === 'open').length}
          </p>
          <p className="text-xs text-slate-400 mt-1">De {jobs.length} búsquedas creadas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Candidatos con ATS ≥ 80%
          </p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {applications.filter((a) => a.ats_score >= 80).length}
          </p>
          <p className="text-xs text-slate-400 mt-1">Alta afinidad con el perfil buscado</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Embudo de Selección por Etapa</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Origen de Candidatos (Fuentes)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {sourceData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
