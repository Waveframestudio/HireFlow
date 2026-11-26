import React, { useState } from 'react';
import { Download, Filter, GripVertical, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHireFlow } from '../context/HireFlowContext';
import { useToast } from '../context/ToastContext';
import { Application, PipelineStage, STAGE_COLORS, STAGE_LABELS } from '../types';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { ScrollReveal } from '../components/ScrollReveal';
import { RejectCandidateModal } from '../components/RejectCandidateModal';
import { CandidateDrawer } from '../components/CandidateDrawer';
import { exportPipelineToCsv } from '../lib/exportCsv';
import { usePermissions } from '../lib/permissions';

const STAGES: PipelineStage[] = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
];

export const Pipeline: React.FC = () => {
  const { jobs, candidates, applications, interviews, moveApplicationStage } = useHireFlow();
  const toast = useToast();
  const permissions = usePermissions();
  const navigate = useNavigate();

  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(0);

  // Drag and Drop State
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  // Drawer Lateral de Detalle del Candidato
  const [drawerAppId, setDrawerAppId] = useState<string | null>(null);

  // Estado para el modal de descarte
  const [rejectingApp, setRejectingApp] = useState<{
    id: string;
    candidateName: string;
    jobTitle: string;
  } | null>(null);

  const filteredApps = applications
    .filter((a) => (selectedJobId === 'all' ? true : a.job_id === selectedJobId))
    .filter((a) => a.ats_score >= minScore)
    .sort((a, b) => b.ats_score - a.ats_score);

  const handleStageChange = async (appId: string, newStage: PipelineStage) => {
    if (!permissions.canMoveStage) {
      toast.info(
        'Acción restringida',
        'Tu rol de Hiring Manager permite revisar candidatos y evaluar entrevistas; el avance de etapas en el Pipeline lo realiza RRHH.'
      );
      return;
    }

    const app = applications.find((a) => a.id === appId);
    const candidate = candidates.find((c) => c.id === app?.candidate_id);
    const job = jobs.find((j) => j.id === app?.job_id);

    if (newStage === 'rejected') {
      setRejectingApp({
        id: appId,
        candidateName: candidate?.full_name || 'Candidato',
        jobTitle: job?.title || 'Vacante',
      });
      return;
    }

    await moveApplicationStage(appId, newStage);
    toast.success(
      'Etapa actualizada',
      `${candidate?.full_name || 'El candidato'} avanzó a ${STAGE_LABELS[newStage]}.`
    );
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingApp) return;
    await moveApplicationStage(rejectingApp.id, 'rejected', reason);
    toast.info('Candidato descartado', `${rejectingApp.candidateName}: ${reason}`);
    setRejectingApp(null);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    if (!permissions.canMoveStage) {
      e.preventDefault();
      toast.info(
        'Modo Evaluador',
        'Tu rol de Hiring Manager permite revisar candidatos y evaluar entrevistas; el avance de etapas en el Pipeline lo realiza RRHH.'
      );
      return;
    }
    e.dataTransfer.setData('text/plain', appId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAppId(appId);
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    setDraggedAppId(null);

    if (!appId) return;

    const currentApp = applications.find((a) => a.id === appId);
    if (currentApp && currentApp.stage !== targetStage) {
      await handleStageChange(appId, targetStage);
    }
  };

  // Datos para el Drawer activo
  const activeDrawerApp = applications.find((a) => a.id === drawerAppId) || null;
  const activeDrawerCandidate = activeDrawerApp
    ? candidates.find((c) => c.id === activeDrawerApp.candidate_id) || null
    : null;
  const activeDrawerJob = activeDrawerApp
    ? jobs.find((j) => j.id === activeDrawerApp.job_id) || null
    : null;

  return (
    <div className="space-y-6">
      <ScrollReveal direction="down" duration={0.6}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#11314E]">Pipeline de Selección (ATS)</h2>
            <p className="text-sm text-slate-600 mt-1">
              Arrastrá y soltá candidatos entre columnas o hacé clic en una tarjeta para ver el análisis detallado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-[#EFE3D3] rounded-lg px-3 py-2 shadow-xs">
              <Filter className="w-4 h-4 text-[#1A446C]" />
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="text-sm bg-transparent outline-none text-[#11314E] font-medium"
              >
                <option value="all">Todas las vacantes</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white border border-[#EFE3D3] rounded-lg px-3 py-2 text-sm shadow-xs">
              <Sparkles className="w-4 h-4 text-[#EC623E]" />
              <span className="text-slate-500 font-medium">ATS ≥</span>
              <input
                type="number"
                min={0}
                max={100}
                step={10}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-14 outline-none font-bold text-[#11314E]"
              />
              <span className="text-slate-400 font-medium">%</span>
            </div>

            {permissions.canExportData && (
              <button
                type="button"
                onClick={() => {
                  exportPipelineToCsv(applications, candidates, jobs);
                  toast.success('Pipeline exportado', 'Se descargó el estado completo del tablero en CSV.');
                }}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3] text-sm font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
                title="Descargar pipeline completo en formato CSV para Excel"
              >
                <Download className="w-4 h-4 text-[#1A446C]" />
                Exportar CSV
              </button>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Kanban Board con Drag & Drop */}
      <ScrollReveal staggerChildren className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-start">
        {STAGES.map((stage) => {
          const items = filteredApps.filter((a) => a.stage === stage);
          const isOver = dragOverStage === stage;

          return (
            <div
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
              className={`rounded-xl p-3 border min-h-[380px] transition-all duration-200 ${
                isOver
                  ? 'bg-[#FDEEE9]/70 border-[#EC623E] ring-2 ring-[#EC623E]/30 scale-[1.01]'
                  : 'bg-[#F5EDE1]/60 border-[#EFE3D3]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STAGE_COLORS[stage]}`}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-xs font-bold text-[#11314E] bg-white/70 px-2 py-0.5 rounded-full border border-[#EFE3D3]">
                  <AnimatedNumber value={items.length} />
                </span>
              </div>

              {/* Indicador visual cuando se arrastra sobre la columna */}
              {isOver && (
                <div className="p-3 mb-2 rounded-lg border-2 border-dashed border-[#EC623E] bg-white/80 text-center text-xs font-bold text-[#EC623E] animate-pulse">
                  Soltar para mover a {STAGE_LABELS[stage]}
                </div>
              )}

              <div className="space-y-2.5">
                {items.map((app) => {
                  const candidate = candidates.find((c) => c.id === app.candidate_id);
                  const job = jobs.find((j) => j.id === app.job_id);
                  if (!candidate || !job) return null;

                  const isBeingDragged = draggedAppId === app.id;

                  return (
                    <div
                      key={app.id}
                      draggable={permissions.canMoveStage}
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setDrawerAppId(app.id)}
                      className={`bg-white rounded-lg border border-[#EFE3D3] p-3 shadow-xs space-y-2 hover:shadow-md hover:border-[#E2D1BD] transition-all cursor-pointer group ${
                        isBeingDragged
                          ? 'opacity-40 scale-95 border-[#EC623E] shadow-lg'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[#11314E] leading-snug group-hover:text-[#EC623E] transition-colors truncate">
                            {candidate.full_name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{job.title}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              app.ats_score >= 80
                                ? 'bg-[#FDEEE9] text-[#EC623E] border border-[#FCD5CA]'
                                : app.ats_score >= 60
                                ? 'bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3]'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <AnimatedNumber value={app.ats_score} suffix="%" />
                          </span>
                          {permissions.canMoveStage && (
                            <span className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing p-0.5">
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      {app.matched_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {app.matched_skills.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3]/80 px-1.5 py-0.5 rounded font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {app.rejection_reason && (
                        <p className="text-[11px] text-rose-600 italic line-clamp-1">
                          Motivo: {app.rejection_reason}
                        </p>
                      )}

                      {/* Dropdown rápido accesible si el usuario no quiere arrastrar */}
                      <div onClick={(e) => e.stopPropagation()} className="pt-1">
                        <select
                          value={app.stage}
                          onChange={(e) =>
                            handleStageChange(app.id, e.target.value as PipelineStage)
                          }
                          className="w-full text-xs border border-[#EFE3D3] rounded-md px-2 py-1 bg-[#FAF4EC] text-[#11314E] font-medium cursor-pointer"
                        >
                          {STAGES.map((st) => (
                            <option key={st} value={st}>
                              Mover a: {STAGE_LABELS[st]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </ScrollReveal>

      {/* Drawer Lateral de Detalle del Candidato */}
      <CandidateDrawer
        isOpen={drawerAppId !== null}
        onClose={() => setDrawerAppId(null)}
        application={activeDrawerApp}
        candidate={activeDrawerCandidate}
        job={activeDrawerJob}
        interviews={interviews}
        onMoveStage={(newStage) => {
          if (drawerAppId) {
            handleStageChange(drawerAppId, newStage);
          }
        }}
        onScheduleInterview={() => {
          setDrawerAppId(null);
          navigate('/entrevistas');
        }}
      />

      {/* Modal Descartar Candidato */}
      <RejectCandidateModal
        isOpen={rejectingApp !== null}
        onClose={() => setRejectingApp(null)}
        candidateName={rejectingApp?.candidateName || ''}
        jobTitle={rejectingApp?.jobTitle || ''}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
};
