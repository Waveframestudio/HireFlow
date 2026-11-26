import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  Star,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import { STAGE_COLORS, STAGE_LABELS, ActivityActionType } from '../types';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { ScrollReveal } from '../components/ScrollReveal';
import { formatRelativeTime } from '../lib/formatTime';

const ACTION_ICONS: Record<ActivityActionType, React.ReactNode> = {
  stage_changed: <ArrowRight className="w-3.5 h-3.5 text-blue-600" />,
  interview_scheduled: <CalendarClock className="w-3.5 h-3.5 text-[#EC623E]" />,
  interview_completed: <Star className="w-3.5 h-3.5 text-emerald-600" />,
  candidate_created: <UserPlus className="w-3.5 h-3.5 text-indigo-600" />,
  candidate_rejected: <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />,
};

const ACTION_BADGES: Record<ActivityActionType, { label: string; className: string }> = {
  stage_changed: { label: 'Movimiento de Etapa', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  interview_scheduled: { label: 'Entrevista Agendada', className: 'bg-[#FDEEE9] text-[#EC623E] border-[#FCD5CA]' },
  interview_completed: { label: 'Entrevista Evaluada', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  candidate_created: { label: 'Nuevo Candidato', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  candidate_rejected: { label: 'Descarte', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const Dashboard: React.FC = () => {
  const { jobs, candidates, applications, interviews, activityLogs } = useHireFlow();

  const openJobs = jobs.filter((j) => j.status === 'open').length;
  const activeApps = applications.filter(
    (a) => a.stage !== 'hired' && a.stage !== 'rejected'
  ).length;
  const scheduledInterviews = interviews.filter((i) => i.status === 'scheduled').length;
  const hiredCount = applications.filter((a) => a.stage === 'hired').length;

  const avgAts =
    applications.length > 0
      ? Math.round(
          applications.reduce((acc, a) => acc + a.ats_score, 0) / applications.length
        )
      : 0;

  const topApplications = [...applications]
    .sort((a, b) => b.ats_score - a.ats_score)
    .slice(0, 5);

  const recentActivities = activityLogs.slice(0, 6);

  return (
    <div className="space-y-6">
      <ScrollReveal direction="down" duration={0.6}>
        <div>
          <h2 className="text-2xl font-bold text-[#11314E]">Panel de Reclutamiento</h2>
          <p className="text-sm text-slate-600 mt-1">
            Vista general de búsquedas activas, filtrado ATS y próximos pasos de selección.
          </p>
        </div>
      </ScrollReveal>

      {/* KPI Cards */}
      <ScrollReveal staggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">Vacantes Abiertas</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF4EC] flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-[#11314E]" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2 text-[#11314E]">
            <AnimatedNumber value={openJobs} />
          </p>
          <p className="text-xs text-slate-500 mt-1">{jobs.length} totales registradas</p>
        </div>

        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">Base de Candidatos</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF4EC] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#1A446C]" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2 text-[#11314E]">
            <AnimatedNumber value={candidates.length} />
          </p>
          <p className="text-xs text-slate-500 mt-1">{activeApps} en proceso activo</p>
        </div>

        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">Entrevistas Pendientes</span>
            <div className="w-8 h-8 rounded-lg bg-[#FDEEE9] flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-[#EC623E]" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2 text-[#11314E]">
            <AnimatedNumber value={scheduledInterviews} />
          </p>
          <p className="text-xs text-slate-500 mt-1">{interviews.length} registradas</p>
        </div>

        <div className="bg-white rounded-xl border border-[#EFE3D3] p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">Score ATS Promedio</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF4EC] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#EC623E]" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2 text-[#11314E]">
            <AnimatedNumber value={avgAts} suffix="%" />
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />{' '}
            <AnimatedNumber value={hiredCount} /> contratados
          </p>
        </div>
      </ScrollReveal>

      {/* Grid: Matches ATS & Bitácora de Actividad del Equipo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top ATS Matches */}
        <ScrollReveal delay={0.15} className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-[#EFE3D3] overflow-hidden shadow-xs h-full">
            <div className="px-5 py-4 border-b border-[#EFE3D3] bg-[#FCF2E4]/40 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#11314E]">Mejores Matches ATS</h3>
                <p className="text-xs text-slate-600">
                  Candidatos con mayor afinidad automática según requisitos de cada vacante
                </p>
              </div>
              <Link
                to="/pipeline"
                className="text-sm font-semibold text-[#EC623E] hover:text-[#D95330] transition-colors"
              >
                Ver Pipeline →
              </Link>
            </div>

            <div className="divide-y divide-[#EFE3D3]/60">
              {topApplications.map((app) => {
                const candidate = candidates.find((c) => c.id === app.candidate_id);
                const job = jobs.find((j) => j.id === app.job_id);
                if (!candidate || !job) return null;

                return (
                  <div
                    key={app.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#FCF2E4]/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#11314E] truncate">{candidate.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {job.title} · {job.department}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                          STAGE_COLORS[app.stage]
                        }`}
                      >
                        {STAGE_LABELS[app.stage]}
                      </span>
                      <div className="text-right w-16">
                        <span
                          className={`text-sm font-bold ${
                            app.ats_score >= 80
                              ? 'text-[#EC623E]'
                              : app.ats_score >= 60
                              ? 'text-[#1A446C]'
                              : 'text-slate-500'
                          }`}
                        >
                          <AnimatedNumber value={app.ats_score} suffix="%" />
                        </span>
                        <p className="text-[10px] text-slate-400">ATS Match</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Actividad Reciente del Equipo */}
        <ScrollReveal delay={0.25} className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-[#EFE3D3] overflow-hidden shadow-xs h-full flex flex-col">
            <div className="px-5 py-4 border-b border-[#EFE3D3] bg-[#FCF2E4]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="font-semibold text-[#11314E] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#EC623E]" />
                    Actividad Reciente del Equipo
                  </h3>
                  <p className="text-xs text-slate-600">
                    Trazabilidad de cambios, avances y entrevistas en vivo
                  </p>
                </div>
              </div>
              <span className="text-xs bg-[#FAF4EC] text-[#11314E] px-2 py-0.5 rounded-full border border-[#EFE3D3] font-medium">
                {activityLogs.length} eventos
              </span>
            </div>

            <div className="divide-y divide-[#EFE3D3]/60 flex-1">
              {recentActivities.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aún no hay actividad registrada.
                </div>
              ) : (
                recentActivities.map((act) => {
                  const badge = ACTION_BADGES[act.action_type] || {
                    label: 'Acción',
                    className: 'bg-slate-50 text-slate-700 border-slate-200',
                  };
                  const icon = ACTION_ICONS[act.action_type] || (
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                  );

                  return (
                    <div
                      key={act.id}
                      className="p-4 hover:bg-[#FCF2E4]/25 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Mini Avatar / Icon */}
                          <div className="w-6 h-6 rounded-full bg-[#11314E] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {act.user_name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0 truncate">
                            <span className="text-xs font-semibold text-[#11314E]">
                              {act.user_name}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-1.5 hidden sm:inline">
                              · {act.user_role}
                            </span>
                          </div>
                        </div>

                        {/* Relative time */}
                        <span className="text-[11px] text-slate-600 flex items-center gap-1 shrink-0 font-medium">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatRelativeTime(act.created_at)}
                        </span>
                      </div>

                      {/* Title & Badge */}
                      <div className="pl-8">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${badge.className}`}
                          >
                            {icon}
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#11314E] leading-relaxed">
                          {act.title}
                        </p>
                        {act.details && (
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {act.details}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-[#FAF4EC]/60 border-t border-[#EFE3D3] text-center">
              <span className="text-[11px] text-slate-600">
                Registrando automáticamente cada movimiento, agendamiento y cambio de estado
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};
