import React, { useState } from 'react';
import { Filter, Sparkles } from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import { PipelineStage, STAGE_COLORS, STAGE_LABELS } from '../types';

const STAGES: PipelineStage[] = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
];

export const Pipeline: React.FC = () => {
  const { jobs, candidates, applications, moveApplicationStage } = useHireFlow();
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(0);

  const filteredApps = applications
    .filter((a) => (selectedJobId === 'all' ? true : a.job_id === selectedJobId))
    .filter((a) => a.ats_score >= minScore)
    .sort((a, b) => b.ats_score - a.ats_score);

  const handleStageChange = async (appId: string, newStage: PipelineStage) => {
    let reason: string | undefined;
    if (newStage === 'rejected') {
      reason = window.prompt('Motivo de descarte (opcional):') || undefined;
    }
    await moveApplicationStage(appId, newStage, reason);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pipeline de Selección (ATS)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Seguimiento de candidatos por etapa con clasificación automática por puntaje ATS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-sm bg-transparent outline-none text-slate-700"
            >
              <option value="all">Todas las vacantes</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-slate-500">ATS ≥</span>
            <input
              type="number"
              min={0}
              max={100}
              step={10}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-14 outline-none font-medium text-slate-800"
            />
            <span className="text-slate-400">%</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-start">
        {STAGES.map((stage) => {
          const items = filteredApps.filter((a) => a.stage === stage);
          return (
            <div
              key={stage}
              className="bg-slate-100/80 rounded-xl p-3 border border-slate-200 min-h-[340px]"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STAGE_COLORS[stage]}`}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-xs font-semibold text-slate-500">{items.length}</span>
              </div>

              <div className="space-y-2.5">
                {items.map((app) => {
                  const candidate = candidates.find((c) => c.id === app.candidate_id);
                  const job = jobs.find((j) => j.id === app.job_id);
                  if (!candidate || !job) return null;

                  return (
                    <div
                      key={app.id}
                      className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-slate-900 leading-snug">
                            {candidate.full_name}
                          </p>
                          <p className="text-[11px] text-slate-500">{job.title}</p>
                        </div>
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            app.ats_score >= 80
                              ? 'bg-emerald-50 text-emerald-700'
                              : app.ats_score >= 60
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {app.ats_score}%
                        </span>
                      </div>

                      {app.matched_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {app.matched_skills.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {app.rejection_reason && (
                        <p className="text-[11px] text-rose-600 italic">
                          Motivo: {app.rejection_reason}
                        </p>
                      )}

                      <select
                        value={app.stage}
                        onChange={(e) =>
                          handleStageChange(app.id, e.target.value as PipelineStage)
                        }
                        className="w-full text-xs border border-slate-200 rounded-md px-2 py-1 bg-slate-50 text-slate-700"
                      >
                        {STAGES.map((st) => (
                          <option key={st} value={st}>
                            Mover a: {STAGE_LABELS[st]}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
