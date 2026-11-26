import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CalendarClock, CheckCircle2, Sparkles, Users } from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import { STAGE_COLORS, STAGE_LABELS } from '../types';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { ScrollReveal } from '../components/ScrollReveal';

export const Dashboard: React.FC = () => {
  const { jobs, candidates, applications, interviews } = useHireFlow();

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

      {/* Top ATS Matches */}
      <ScrollReveal delay={0.15}>
        <div className="bg-white rounded-xl border border-[#EFE3D3] overflow-hidden shadow-xs">
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
                  <div>
                    <p className="font-semibold text-sm text-[#11314E]">{candidate.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {job.title} · {job.department}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
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
    </div>
  );
};
