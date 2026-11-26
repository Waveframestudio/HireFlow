import React, { useMemo } from 'react';
import {
  Award,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import { usePermissions } from '../lib/permissions';

const PIE_COLORS = ['#11314E', '#EC623E', '#1A446C', '#D89F62', '#10B981'];

export const Reports: React.FC = () => {
  const { applications, candidates, jobs, interviews } = useHireFlow();
  const toast = useToast();
  const permissions = usePermissions();

  const stages: PipelineStage[] = [
    'applied',
    'screening',
    'interview',
    'offer',
    'hired',
    'rejected',
  ];

  // 1. Funnel de Selección
  const funnelData = stages.map((stage) => ({
    name: STAGE_LABELS[stage],
    cantidad: applications.filter((a) => a.stage === stage).length,
  }));

  // 2. Fuentes de Reclutamiento
  const sourceMap = candidates.reduce<Record<string, number>>((acc, c) => {
    acc[c.source] = (acc[c.source] || 0) + 1;
    return acc;
  }, {});

  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({
    name,
    value,
  }));

  // 3. Conversión y Contrataciones
  const totalApps = applications.length || 1;
  const hiredApps = applications.filter((a) => a.stage === 'hired');
  const hiredCount = hiredApps.length;
  const conversionRate = Math.round((hiredCount / totalApps) * 100);

  // 4. Time-to-Hire Promedio (días desde applied_at hasta updated_at para contratados)
  const timeToHireDays = useMemo(() => {
    if (hiredApps.length === 0) return 12; // Valor de referencia si no hay contratados
    const totalDays = hiredApps.reduce((acc, app) => {
      const start = new Date(app.applied_at).getTime();
      const end = new Date(app.updated_at).getTime();
      const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      return acc + diff;
    }, 0);
    return Math.round(totalDays / hiredApps.length);
  }, [hiredApps]);

  // 5. Tasa de Aceptación de Ofertas (hired vs total ofertas extendidas)
  const offerApps = applications.filter((a) => a.stage === 'offer');
  const totalOffers = hiredCount + offerApps.length;
  const offerAcceptanceRate = totalOffers > 0 ? Math.round((hiredCount / totalOffers) * 100) : 100;

  // 6. Score ATS Promedio General
  const avgAtsScore =
    applications.length > 0
      ? Math.round(applications.reduce((acc, a) => acc + a.ats_score, 0) / applications.length)
      : 0;

  // 7. Distribución por Departamento (Vacantes y Candidatos)
  const departmentData = useMemo(() => {
    const map: Record<string, { vacantes: number; postulados: number }> = {};
    jobs.forEach((j) => {
      if (!map[j.department]) {
        map[j.department] = { vacantes: 0, postulados: 0 };
      }
      map[j.department].vacantes += 1;
    });

    applications.forEach((a) => {
      const job = jobs.find((j) => j.id === a.job_id);
      if (job && map[job.department]) {
        map[job.department].postulados += 1;
      }
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      Vacantes: data.vacantes,
      Postulados: data.postulados,
    }));
  }, [jobs, applications]);

  // 8. Métricas de Entrevistas y Calificaciones
  const completedInterviews = interviews.filter((i) => i.status === 'completed');
  const scheduledInterviews = interviews.filter((i) => i.status === 'scheduled');
  const avgRating =
    completedInterviews.filter((i) => i.rating).length > 0
      ? (
          completedInterviews.reduce((acc, i) => acc + (i.rating || 0), 0) /
          completedInterviews.filter((i) => i.rating).length
        ).toFixed(1)
      : '5.0';

  const interviewTypeData = useMemo(() => {
    const types: Record<string, number> = {
      Screening: 0,
      Técnica: 0,
      RRHH: 0,
      Final: 0,
    };
    interviews.forEach((i) => {
      if (i.type === 'screening') types['Screening']++;
      else if (i.type === 'technical') types['Técnica']++;
      else if (i.type === 'hr') types['RRHH']++;
      else if (i.type === 'final') types['Final']++;
    });
    return Object.entries(types).map(([name, cantidad]) => ({ name, cantidad }));
  }, [interviews]);

  return (
    <div className="space-y-6">
      {/* Header y Descargas CSV */}
      <ScrollReveal direction="down" duration={0.6}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#11314E]">Reportes e Indicadores de Selección</h2>
            <p className="text-sm text-slate-600 mt-1">
              Métricas estratégicas de RRHH: Time-to-Hire, conversión de ofertas, funnel y afinidad ATS.
            </p>
          </div>

          {permissions.canExportData && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  exportPipelineToCsv(applications, candidates, jobs);
                  toast.success(
                    'Métricas exportadas',
                    'Se generó el reporte general en formato CSV para Excel.'
                  );
                }}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3] text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs hover:shadow-sm"
              >
                <Download className="w-4 h-4 text-[#1A446C]" />
                Exportar Métricas (CSV)
              </button>

              <button
                type="button"
                onClick={() => {
                  exportInterviewsToCsv(interviews, applications, candidates, jobs);
                  toast.success(
                    'Entrevistas exportadas',
                    'Se descargó el historial completo de entrevistas en CSV.'
                  );
                }}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3] text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs hover:shadow-sm"
              >
                <Download className="w-4 h-4 text-[#EC623E]" />
                Exportar Entrevistas (CSV)
              </button>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* 4 KPIs Clave de Reclutamiento */}
      <ScrollReveal staggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Time-to-Hire */}
        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Time-to-Hire
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF4EC] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#1A446C]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#11314E] mt-2 flex items-baseline gap-1">
            <AnimatedNumber value={timeToHireDays} />
            <span className="text-sm font-semibold text-slate-500">días prom.</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Desde postulación a oferta/alta</p>
        </div>

        {/* Tasa de Aceptación de Ofertas */}
        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Aceptación de Ofertas
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FDEEE9] flex items-center justify-center">
              <Award className="w-4 h-4 text-[#EC623E]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#EC623E] mt-2">
            <AnimatedNumber value={offerAcceptanceRate} suffix="%" />
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {hiredCount} aceptadas de {totalOffers} ofertas extendidas
          </p>
        </div>

        {/* Tasa de Contratación (Conversión Funnel) */}
        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Conversión General
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-800 mt-2">
            <AnimatedNumber value={conversionRate} suffix="%" />
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {hiredCount} contratados de {applications.length} postulados
          </p>
        </div>

        {/* Score ATS Promedio */}
        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Score ATS Medio
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF4EC] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#EC623E]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#11314E] mt-2">
            <AnimatedNumber value={avgAtsScore} suffix="%" />
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {applications.filter((a) => a.ats_score >= 80).length} candidatos con ATS ≥ 80%
          </p>
        </div>
      </ScrollReveal>

      {/* Fila 1 de Gráficos: Funnel & Fuentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Embudo de Selección */}
        <ScrollReveal delay={0.1}>
          <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-[#11314E]">Embudo de Selección por Etapa</h3>
                <span className="text-xs bg-[#FAF4EC] text-[#11314E] px-2 py-0.5 rounded font-medium border border-[#EFE3D3]">
                  {applications.length} postulaciones
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Volumen de candidatos que avanzaron en cada fase del pipeline.
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFE3D3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#11314E' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#11314E' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF4EC',
                      borderColor: '#EFE3D3',
                      borderRadius: '8px',
                      color: '#11314E',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="cantidad" fill="#11314E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>

        {/* Fuentes de Reclutamiento */}
        <ScrollReveal delay={0.2}>
          <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-[#11314E]">Fuentes de Reclutamiento</h3>
                <span className="text-xs bg-[#FAF4EC] text-[#11314E] px-2 py-0.5 rounded font-medium border border-[#EFE3D3]">
                  {candidates.length} perfiles
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Canales de atracción con mayor volumen de talento recibido.
              </p>
            </div>

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
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Fila 2 de Gráficos: Distribución por Área & Panel de Entrevistas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Departamento */}
        <ScrollReveal delay={0.25}>
          <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-[#11314E]">Vacantes vs. Candidatos por Área</h3>
                <span className="text-xs bg-[#FAF4EC] text-[#11314E] px-2 py-0.5 rounded font-medium border border-[#EFE3D3]">
                  {jobs.length} vacantes
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Comparativa de vacantes abiertas y postulantes registrados por departamento.
              </p>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFE3D3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#11314E' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#11314E' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF4EC',
                      borderColor: '#EFE3D3',
                      borderRadius: '8px',
                      color: '#11314E',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                  <Bar dataKey="Vacantes" fill="#11314E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Postulados" fill="#EC623E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>

        {/* Panel de Calidad de Entrevistas */}
        <ScrollReveal delay={0.3}>
          <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-[#11314E]">Calidad y Desglose de Entrevistas</h3>
                <span className="text-xs bg-[#FAF4EC] text-[#11314E] px-2 py-0.5 rounded font-medium border border-[#EFE3D3]">
                  {interviews.length} entrevistas
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Indicadores de satisfacción de hiring managers y tipos de evaluación.
              </p>
            </div>

            {/* Mini cards de métricas de entrevistas */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#FAF4EC]/70 rounded-lg p-3 border border-[#EFE3D3] text-center">
                <span className="text-[11px] text-slate-500 font-medium">Calificación Prom.</span>
                <p className="text-xl font-bold text-[#EC623E] mt-0.5 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-[#EC623E]" />
                  {avgRating}
                </p>
              </div>

              <div className="bg-[#FAF4EC]/70 rounded-lg p-3 border border-[#EFE3D3] text-center">
                <span className="text-[11px] text-slate-500 font-medium">Realizadas</span>
                <p className="text-xl font-bold text-emerald-700 mt-0.5 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {completedInterviews.length}
                </p>
              </div>

              <div className="bg-[#FAF4EC]/70 rounded-lg p-3 border border-[#EFE3D3] text-center">
                <span className="text-[11px] text-slate-500 font-medium">Pendientes</span>
                <p className="text-xl font-bold text-[#11314E] mt-0.5 flex items-center justify-center gap-1">
                  <CalendarCheck className="w-4 h-4" />
                  {scheduledInterviews.length}
                </p>
              </div>
            </div>

            {/* Gráfico de barras por tipo de entrevista */}
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interviewTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFE3D3" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#11314E' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#11314E' }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF4EC',
                      borderColor: '#EFE3D3',
                      borderRadius: '8px',
                      color: '#11314E',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="cantidad" fill="#1A446C" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};
