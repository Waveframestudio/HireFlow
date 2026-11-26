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

const PIE_COLORS = ['#11314E', '#EC623E', '#1A446C', '#D89F62', '#10B981'];

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
        <h2 className="text-2xl font-bold text-[#11314E]">Reportes e Indicadores de Selección</h2>
        <p className="text-sm text-slate-600 mt-1">
          Métricas clave de RRHH para seguimiento de eficiencia, conversión y fuentes de talento.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tasa de Contratación</p>
          <p className="text-3xl font-bold text-[#EC623E] mt-1">{conversionRate}%</p>
          <p className="text-xs text-slate-500 mt-1">
            {hiredCount} contratados sobre {applications.length} postulaciones
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Vacantes Activas</p>
          <p className="text-3xl font-bold text-[#11314E] mt-1">
            {jobs.filter((j) => j.status === 'open').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">De {jobs.length} búsquedas creadas</p>
        </div>

        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Candidatos con ATS ≥ 80%
          </p>
          <p className="text-3xl font-bold text-[#11314E] mt-1">
            {applications.filter((a) => a.ats_score >= 80).length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Alta afinidad con el perfil buscado</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs">
          <h3 className="font-bold text-[#11314E] mb-4">Embudo de Selección por Etapa</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFE3D3" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#11314E' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#11314E' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF4EC',
                    borderColor: '#EFE3D3',
                    borderRadius: '8px',
                    color: '#11314E',
                  }}
                />
                <Bar dataKey="cantidad" fill="#11314E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs">
          <h3 className="font-bold text-[#11314E] mb-4">Fuentes de Reclutamiento</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF4EC',
                    borderColor: '#EFE3D3',
                    borderRadius: '8px',
                    color: '#11314E',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
