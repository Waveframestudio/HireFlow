import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CalendarClock, CheckCircle2, Sparkles, Users } from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import { STAGE_COLORS, STAGE_LABELS } from '../types';

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
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Panel de Reclutamiento</h2>
        <p className="text-sm text-slate-500 mt-1">
          Vista general de búsquedas activas, filtrado ATS y próximos pasos de selección.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Vacantes Abiertas</span>
            <Briefcase className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold mt-2">{openJobs}</p>
          <p className="text-xs text-slate-400 mt-1">{jobs.length} totales registradas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Base de Candidatos</span>
            <Users className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-3xl font-bold mt-2">{candidates.length}</p>
          <p className="text-xs text-slate-400 mt-1">{activeApps} en proceso activo</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Entrevistas Pendientes</span>
            <CalendarClock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold mt-2">{scheduledInterviews}</p>
          <p className="text-xs text-slate-400 mt-1">{interviews.length} registradas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Score ATS Promedio</span>
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold mt-2">{avgAts}%</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {hiredCount} contratados
          </p>
        </div>
      </div>

      {/* Top ATS Matches */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Mejores Matches ATS</h3>
            <p className="text-xs text-slate-500">
              Candidatos con mayor afinidad automática según requisitos de cada vacante
            </p>
          </div>
          <Link
            to="/pipeline"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Ver Pipeline →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {topApplications.map((app) => {
            const candidate = candidates.find((c) => c.id === app.candidate_id);
            const job = jobs.find((j) => j.id === app.job_id);
            if (!candidate || !job) return null;

            return (
              <div
                key={app.id}
                className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-sm text-slate-900">{candidate.full_name}</p>
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
                          ? 'text-emerald-600'
                          : app.ats_score >= 60
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {app.ats_score}%
                    </span>
                    <p className="text-[10px] text-slate-400">ATS Match</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
