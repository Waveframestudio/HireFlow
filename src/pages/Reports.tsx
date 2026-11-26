import React from 'react';
import { Download } from 'lucide-react';
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
import { useToast } from '../context/ToastContext';
import { PipelineStage, STAGE_LABELS } from '../types';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { ScrollReveal } from '../components/ScrollReveal';
import { exportInterviewsToCsv, exportPipelineToCsv } from '../lib/exportCsv';

const PIE_COLORS = ['#11314E', '#EC623E', '#1A446C', '#D89F62', '#10B981'];

export const Reports: React.FC = () => {
  const { applications, candidates, jobs, interviews } = useHireFlow();
  const toast = useToast();

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
      <ScrollReveal direction="down" duration={0.6}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#11314E]">Reportes e Indicadores de Selección</h2>
            <p className="text-sm text-slate-600 mt-1">
              Métricas clave de RRHH para seguimiento de eficiencia, conversión y fuentes de talento.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                exportPipelineToCsv(applications, candidates, jobs);
                toast.success('Métricas exportadas', 'Se generó el reporte general en formato CSV para Excel.');
              }}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3] text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-[#1A446C]" />
              Exportar Métricas (CSV)
            </button>

            <button
              type="button"
              onClick={() => {
                exportInterviewsToCsv(interviews, applications, candidates, jobs);
                toast.success('Entrevistas exportadas', 'Se descargó el historial completo de entrevistas en CSV.');
              }}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3] text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-[#EC623E]" />
              Exportar Entrevistas (CSV)
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Summary KPIs */}
      <ScrollReveal staggerChildren className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tasa de Contratación</p>
          <p className="text-3xl font-bold text-[#EC623E] mt-1">
            <AnimatedNumber value={conversionRate} suffix="%" />
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {hiredCount} contratados sobre {applications.length} postulaciones
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Vacantes Activas</p>
          <p className="text-3xl font-bold text-[#11314E] mt-1">
            <AnimatedNumber value={jobs.filter((j) => j.status === 'open').length} />
          </p>
          <p className="text-xs text-slate-500 mt-1">De {jobs.length} búsquedas creadas</p>
        </div>

        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Candidatos con ATS ≥ 80%
          </p>
          <p className="text-3xl font-bold text-[#11314E] mt-1">
            <AnimatedNumber value={applications.filter((a) => a.ats_score >= 80).length} />
          </p>
          <p className="text-xs text-slate-500 mt-1">Alta afinidad con el perfil buscado</p>
        </div>
      </ScrollReveal>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScrollReveal delay={0.1}>
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
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
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
        </ScrollReveal>
      </div>
    </div>
  );
};
