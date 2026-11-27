import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Download, Filter, GripVertical, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHireFlow } from '../context/HireFlowContext';
import { useToast } from '../context/ToastContext';
import { Application, Job, PipelineStage, STAGE_COLORS, STAGE_LABELS } from '../types';
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

interface PipelineJobFilterDropdownProps {
  jobs: Job[];
  selectedJobId: string;
  onSelectJob: (jobId: string) => void;
}

const PipelineJobFilterDropdown: React.FC<PipelineJobFilterDropdownProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="relative z-40" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 bg-white hover:bg-[#FAF4EC]/60 border rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer shadow-xs ${
          isOpen ? 'border-[#EC623E] ring-1 ring-[#EC623E]' : 'border-[#EFE3D3]'
        }`}
      >
        <Filter className="w-4 h-4 text-[#1A446C]" />
        <span className="text-[#11314E] max-w-[200px] truncate">
          {selectedJobId === 'all' ? 'Todas las vacantes' : selectedJob?.title || 'Vacante'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#EC623E]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 min-w-[260px] max-h-64 overflow-y-auto bg-white border border-[#EFE3D3] rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={() => {
              onSelectJob('all');
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
              selectedJobId === 'all'
                ? 'bg-[#FAF4EC] text-[#EC623E] font-bold'
                : 'text-[#11314E] hover:bg-[#FAF4EC]/70 hover:text-[#EC623E]'
            }`}
          >
            <span>Todas las vacantes ({jobs.length})</span>
            {selectedJobId === 'all' && (
              <Check className="w-3.5 h-3.5 text-[#EC623E] shrink-0" />
            )}
          </button>

          {jobs.map((job) => {
            const isSelected = selectedJobId === job.id;
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => {
                  onSelectJob(job.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FAF4EC] text-[#EC623E] font-bold'
                    : 'text-[#11314E] hover:bg-[#FAF4EC]/70 hover:text-[#EC623E]'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold truncate">{job.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {job.department} · {job.location}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#EC623E] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface PipelineCardStageDropdownProps {
  currentStage: PipelineStage;
  canMove: boolean;
  onSelectStage: (stage: PipelineStage) => void;
}

const PipelineCardStageDropdown: React.FC<PipelineCardStageDropdownProps> = ({
  currentStage,
  canMove,
  onSelectStage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const STAGE_DOT_COLORS: Record<PipelineStage, string> = {
    applied: 'bg-blue-500',
    screening: 'bg-indigo-500',
    interview: 'bg-purple-500',
    offer: 'bg-amber-500',
    hired: 'bg-emerald-500',
    rejected: 'bg-rose-500',
  };

  return (
    <div
      className="relative pt-1"
      ref={ref}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={!canMove}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full text-xs border rounded-md px-2.5 py-1.5 flex items-center justify-between font-semibold transition-all cursor-pointer ${
          isOpen
            ? 'border-[#EC623E] ring-1 ring-[#EC623E] bg-white'
            : 'border-[#EFE3D3] bg-[#FAF4EC] hover:bg-[#F5EDE1] text-[#11314E]'
        } ${!canMove ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span className="truncate">Mover a: {STAGE_LABELS[currentStage]}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#EC623E]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#EFE3D3] rounded-xl shadow-xl py-1 z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {STAGES.map((st) => {
            const isSelected = currentStage === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  onSelectStage(st);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FAF4EC] text-[#EC623E] font-bold'
                    : 'text-[#11314E] hover:bg-[#FAF4EC]/70 hover:text-[#EC623E]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${STAGE_DOT_COLORS[st]}`}
                  />
                  <span>Mover a: {STAGE_LABELS[st]}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#EC623E] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

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
    <div className="space-y-8 pb-8">
      {/* Encabezado y Barra de Filtros (Stacking Context Superior) */}
      <ScrollReveal direction="down" duration={0.6} className="relative z-30">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#EFE3D3]/60">
          <div>
            <h2 className="text-2xl font-bold text-[#11314E]">Pipeline de Selección (ATS)</h2>
            <p className="text-sm text-slate-600 mt-1">
              Arrastrá y soltá candidatos entre columnas o hacé clic en una tarjeta para ver el análisis detallado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PipelineJobFilterDropdown
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
            />

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
                className="w-14 outline-none font-bold text-[#11314E] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
      <ScrollReveal staggerChildren className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3.5 items-start pt-1 relative z-10">
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

                      {/* Dropdown rápido accesible y estilizado */}
                      <PipelineCardStageDropdown
                        currentStage={app.stage}
                        canMove={permissions.canMoveStage}
                        onSelectStage={(newStage) => handleStageChange(app.id, newStage)}
                      />
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
