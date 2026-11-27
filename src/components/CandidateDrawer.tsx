import React, { useState } from 'react';
import {
  Briefcase,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  History,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Star,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { Application, Candidate, Interview, Job, PipelineStage, STAGE_COLORS, STAGE_LABELS } from '../types';
import { useToast } from '../context/ToastContext';
import { useHireFlow } from '../context/HireFlowContext';
import { downloadIcsFile, generateGoogleCalendarUrl } from '../lib/calendar';
import { formatFullDateTime, formatRelativeTime } from '../lib/formatTime';
import { usePermissions } from '../lib/permissions';
import { EmailModal } from './EmailModal';
import { EmailTemplateContext, EmailTemplateKey } from '../lib/emailTemplates';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface CandidateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  candidate: Candidate | null;
  job: Job | null;
  interviews: Interview[];
  onMoveStage: (stage: PipelineStage) => void;
  onScheduleInterview?: () => void;
}

const STAGES: PipelineStage[] = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
];

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  isOpen,
  onClose,
  application,
  candidate,
  job,
  interviews,
  onMoveStage,
  onScheduleInterview,
}) => {
  const toast = useToast();
  const permissions = usePermissions();
  const { activityLogs } = useHireFlow();
  const [activeTab, setActiveTab] = useState<'overview' | 'cv' | 'interviews' | 'history'>('overview');
  const { shouldRender, backdropClass, drawerClass } = useModalAnimation(isOpen, 220);

  if (!shouldRender || !application || !candidate || !job) return null;

  const appInterviews = interviews.filter((i) => i.application_id === application.id);
  const candidateLogs = activityLogs.filter((a) => a.candidate_id === candidate.id);

  const handleCopyCvText = () => {
    if (candidate.cv_text) {
      navigator.clipboard.writeText(candidate.cv_text);
      toast.success('Texto copiado', 'El contenido del CV se copió al portapapeles.');
    }
  };

  const expMatch = candidate.years_experience >= job.min_experience_years;

  const [emailModalData, setEmailModalData] = useState<{
    isOpen: boolean;
    template: EmailTemplateKey;
    context: EmailTemplateContext;
  } | null>(null);

  const handleOpenEmail = (template: EmailTemplateKey = 'interview_invitation') => {
    setEmailModalData({
      isOpen: true,
      template,
      context: {
        candidateName: candidate.full_name,
        candidateEmail: candidate.email,
        jobTitle: job.title,
        rejectionReason: application.rejection_reason || undefined,
      },
    });
  };

  const handleOpenGoogleCal = (int: Interview) => {
    const url = generateGoogleCalendarUrl({
      title: `Entrevista ${int.type.toUpperCase()} - ${candidate.full_name} (${job.title})`,
      description: `Entrevista de selección para ${job.title}.\nCandidato: ${candidate.full_name} (${candidate.email}).\nEntrevistador: ${int.interviewer}.\nModalidad / Enlace: ${int.location_or_link}`,
      location: int.location_or_link,
      startDate: int.scheduled_at,
      durationMinutes: 45,
    });
    window.open(url, '_blank');
    toast.info('Google Calendar', 'Se abrió la pestaña para sincronizar la cita.');
  };

  const handleDownloadIcs = (int: Interview) => {
    downloadIcsFile(
      {
        title: `Entrevista ${int.type.toUpperCase()} - ${candidate.full_name}`,
        description: `Entrevista para ${job.title} en HireFlow ATS.\nEntrevistador: ${int.interviewer}\nLugar / Enlace: ${int.location_or_link}`,
        location: int.location_or_link,
        startDate: int.scheduled_at,
        durationMinutes: 45,
      },
      `Entrevista_${candidate.full_name.replace(/\s+/g, '_')}.ics`
    );
    toast.success('Archivo .ics descargado', 'Compatible con Outlook, Apple Calendar y Google.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[#11314E]/50 backdrop-blur-xs ${backdropClass}`}
      />

      {/* Drawer Panel */}
      <div className={`fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl flex flex-col z-50 border-l border-[#EFE3D3] ${drawerClass}`}>
        {/* Header */}
        <div className="p-6 bg-[#FAF4EC]/70 border-b border-[#EFE3D3] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#11314E] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {candidate.full_name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-xl text-[#11314E]">{candidate.full_name}</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                    STAGE_COLORS[application.stage]
                  }`}
                >
                  {STAGE_LABELS[application.stage]}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                Postulado a: <strong className="text-[#11314E]">{job.title}</strong> ({job.department})
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#1A446C]" /> {candidate.email}
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#1A446C]" /> {candidate.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-[#1A446C]" /> {candidate.years_experience} años exp.
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEmail('interview_invitation')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#EC623E] bg-[#FDEEE9] hover:bg-[#FCD5CA] border border-[#FCD5CA] px-2 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs"
                >
                  <Mail className="w-3 h-3" />
                  Redactar Email
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#11314E] p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stage Fast Switcher Bar */}
        <div className="px-6 py-2.5 bg-white border-b border-[#EFE3D3] flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium shrink-0">Etapa:</span>
          {STAGES.map((stage) => (
            <button
              key={stage}
              onClick={() => {
                if (permissions.canMoveStage) {
                  onMoveStage(stage);
                } else {
                  toast.info(
                    'Modo Evaluador',
                    'Como Hiring Manager podés evaluar entrevistas y revisar perfiles; el cambio de etapas lo realiza RRHH.'
                  );
                }
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 cursor-pointer ${
                application.stage === stage
                  ? 'bg-[#11314E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-[#FAF4EC] hover:text-[#11314E]'
              }`}
            >
              {STAGE_LABELS[stage]}
            </button>
          ))}
        </div>

        {/* Tab Selector */}
        <div className="px-6 border-b border-[#EFE3D3] flex gap-6 text-sm font-semibold text-slate-500">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#EC623E] text-[#11314E]'
                : 'border-transparent hover:text-[#11314E]'
            }`}
          >
            Afinidad ATS & Perfil
          </button>
          <button
            onClick={() => setActiveTab('cv')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'cv'
                ? 'border-[#EC623E] text-[#11314E]'
                : 'border-transparent hover:text-[#11314E]'
            }`}
          >
            Texto del CV ({candidate.cv_filename || 'Extraído'})
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'interviews'
                ? 'border-[#EC623E] text-[#11314E]'
                : 'border-transparent hover:text-[#11314E]'
            }`}
          >
            Entrevistas
            <span className="text-xs bg-[#FAF4EC] text-[#11314E] px-1.5 py-0.2 rounded-full border border-[#EFE3D3]">
              {appInterviews.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#EC623E] text-[#11314E]'
                : 'border-transparent hover:text-[#11314E]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historial & Auditoría
            <span className="text-xs bg-[#FAF4EC] text-[#11314E] px-1.5 py-0.2 rounded-full border border-[#EFE3D3]">
              {candidateLogs.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* ATS Score Card */}
              <div className="bg-[#FAF4EC] rounded-xl border border-[#EFE3D3] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FDEEE9] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#EC623E]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#11314E]">Puntaje de Compatibilidad ATS</h4>
                      <p className="text-[11px] text-slate-500">
                        Basado en requerimientos del puesto vs. texto del CV
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-2xl font-black px-3 py-1 rounded-xl border ${
                      application.ats_score >= 80
                        ? 'bg-[#FDEEE9] text-[#EC623E] border-[#FCD5CA]'
                        : application.ats_score >= 60
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {application.ats_score}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white rounded-full h-2.5 overflow-hidden border border-[#EFE3D3] mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-[#1A446C] to-[#EC623E] transition-all duration-700"
                    style={{ width: `${application.ats_score}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-white rounded-lg p-3 border border-[#EFE3D3]">
                    <span className="text-slate-500 text-[11px]">Match de Experiencia</span>
                    <p className={`font-bold mt-1 flex items-center gap-1.5 ${expMatch ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {expMatch ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {candidate.years_experience} años (Req: {job.min_experience_years}+)
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-[#EFE3D3]">
                    <span className="text-slate-500 text-[11px]">Skills Obligatorias</span>
                    <p className="font-bold text-[#11314E] mt-1">
                      {application.matched_skills.length} de {job.required_skills.length} cumplidas
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills Breakdown */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[#11314E] uppercase tracking-wide mb-2">
                    Skills Requeridas Cumplidas
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {application.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {s}
                      </span>
                    ))}
                    {application.matched_skills.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No se detectaron skills obligatorias coincidentes.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#11314E] uppercase tracking-wide mb-2">
                    Skills Requeridas No Detectadas
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {application.missing_skills.map((s) => (
                      <span
                        key={s}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        {s}
                      </span>
                    ))}
                    {application.missing_skills.length === 0 && (
                      <p className="text-xs text-emerald-600 font-medium">✓ Cumple con el 100% de los requisitos clave.</p>
                    )}
                  </div>
                </div>

                {candidate.skills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#11314E] uppercase tracking-wide mb-2">
                      Otras Competencias del Candidato
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.map((s) => (
                        <span
                          key={s}
                          className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rejection notice if present */}
              {application.rejection_reason && (
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                  <p className="font-bold">Motivo de descarte registrado:</p>
                  <p className="mt-0.5 text-rose-700">{application.rejection_reason}</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'cv' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {candidate.cv_filename ? `Archivo: ${candidate.cv_filename}` : 'Texto sin archivo adjunto'}
                </span>
                <button
                  onClick={handleCopyCvText}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#11314E] bg-[#FAF4EC] hover:bg-[#EFE3D3] border border-[#EFE3D3] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar texto completo
                </button>
              </div>

              <div className="p-4 bg-[#FAF4EC]/40 rounded-xl border border-[#EFE3D3] text-xs font-mono text-slate-700 leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap">
                {candidate.cv_text || 'No se cargó texto para este candidato.'}
              </div>
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="space-y-3">
              {appInterviews.length === 0 ? (
                <div className="text-center py-10 bg-[#FAF4EC]/30 rounded-xl border border-dashed border-[#EFE3D3]">
                  <CalendarClock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#11314E]">No hay entrevistas programadas todavía</p>
                  <p className="text-[11px] text-slate-500 mt-1">Podés agendar una citación directamente desde el botón inferior.</p>
                </div>
              ) : (
                appInterviews.map((int) => (
                  <div
                    key={int.id}
                    className="p-4 bg-white rounded-xl border border-[#EFE3D3] shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#11314E] capitalize">{int.type}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          int.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-[#FDEEE9] text-[#EC623E] border border-[#FCD5CA]'
                        }`}
                      >
                        {int.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Fecha: {new Date(int.scheduled_at).toLocaleString('es-AR')}
                    </p>
                    <p className="text-xs text-slate-600">Entrevistador: {int.interviewer}</p>
                    {int.rating && (
                      <div className="flex items-center gap-1 text-[#EC623E] text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-[#EC623E]" />
                        {int.rating}/5 estrellas
                      </div>
                    )}
                    {int.feedback && (
                      <div className="mt-2 p-2 bg-[#FAF4EC] rounded-lg text-xs text-slate-700">
                        {int.feedback}
                      </div>
                    )}

                    {/* Sincronización de calendario y correo */}
                    <div className="pt-2 border-t border-[#EFE3D3]/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenGoogleCal(int)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#11314E] bg-[#FAF4EC] hover:bg-[#EFE3D3] border border-[#EFE3D3] px-2 py-1 rounded cursor-pointer transition-colors"
                        >
                          <Calendar className="w-3 h-3 text-[#1A446C]" />
                          Google Cal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadIcs(int)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#11314E] bg-[#FAF4EC] hover:bg-[#EFE3D3] border border-[#EFE3D3] px-2 py-1 rounded cursor-pointer transition-colors"
                        >
                          <Download className="w-3 h-3 text-[#1A446C]" />
                          .ICS
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEmail('interview_invitation')}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#EC623E] hover:underline cursor-pointer"
                      >
                        <Mail className="w-3 h-3" />
                        Reenviar Invitación
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#11314E]">Historial & Trazabilidad de Auditoría</h4>
                  <p className="text-xs text-slate-500">
                    Registro inmutable de movimientos de etapa, agendamientos y evaluaciones.
                  </p>
                </div>
                <span className="text-xs bg-[#FAF4EC] text-[#11314E] px-2.5 py-1 rounded-full border border-[#EFE3D3] font-medium">
                  {candidateLogs.length} {candidateLogs.length === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              {candidateLogs.length === 0 ? (
                <div className="text-center py-12 bg-[#FAF4EC]/40 rounded-xl border border-dashed border-[#EFE3D3]">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#11314E]">Sin actividad registrada aún</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Los cambios de etapa y notas aparecerán aquí automáticamente en tiempo real.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EFE3D3]">
                  {candidateLogs.map((log) => (
                    <div key={log.id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#EC623E] group-hover:scale-125 transition-transform" />

                      <div className="bg-white rounded-xl border border-[#EFE3D3] p-4 shadow-2xs hover:shadow-xs transition-shadow space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#11314E] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {log.user_name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-[#11314E]">
                              {log.user_name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({log.user_role})
                            </span>
                          </div>

                          <span
                            className="text-[11px] text-slate-500 font-medium"
                            title={formatFullDateTime(log.created_at)}
                          >
                            {formatRelativeTime(log.created_at)}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-[#11314E]">
                          {log.title}
                        </p>

                        {log.details && (
                          <p className="text-xs text-slate-600 bg-[#FAF4EC]/60 p-2.5 rounded-lg border border-[#EFE3D3]/60 leading-relaxed">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF4EC]/80 border-t border-[#EFE3D3] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {permissions.canMoveStage && (
              <button
                onClick={() => onMoveStage('rejected')}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                Descartar
              </button>
            )}
            <button
              onClick={() =>
                handleOpenEmail(
                  application.stage === 'offer'
                    ? 'job_offer'
                    : application.stage === 'rejected'
                    ? 'rejection'
                    : 'interview_invitation'
                )
              }
              className="px-3 py-2 text-xs font-semibold text-[#11314E] bg-white hover:bg-[#FAF4EC] border border-[#EFE3D3] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-[#EC623E]" />
              Enviar Email
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onScheduleInterview && (
              <button
                onClick={onScheduleInterview}
                className="px-3.5 py-2 text-xs font-semibold text-[#11314E] bg-white hover:bg-[#FAF4EC] border border-[#EFE3D3] rounded-lg transition-colors cursor-pointer"
              >
                Agendar Entrevista
              </button>
            )}
            {permissions.canMoveStage ? (
              <button
                onClick={() => onMoveStage(application.stage === 'screening' ? 'interview' : application.stage === 'interview' ? 'offer' : 'hired')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#EC623E] hover:bg-[#D95330] rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Avanzar Siguiente Etapa →
              </button>
            ) : (
              <span className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-[#EFE3D3]">
                Modo Evaluación (Hiring Manager)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Comunicación por Email */}
      {emailModalData && (
        <EmailModal
          isOpen={emailModalData.isOpen}
          onClose={() => setEmailModalData(null)}
          initialTemplate={emailModalData.template}
          context={emailModalData.context}
        />
      )}
    </div>
  );
};
