import React, { useState } from 'react';
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Download,
  Mail,
  Plus,
  Star,
  Video,
  X,
} from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import { useToast } from '../context/ToastContext';
import { Interview, InterviewType } from '../types';
import { ScrollReveal } from '../components/ScrollReveal';
import { CompleteInterviewModal } from '../components/CompleteInterviewModal';
import { EmailModal } from '../components/EmailModal';
import { EmailTemplateContext, EmailTemplateKey } from '../lib/emailTemplates';
import { downloadIcsFile, generateGoogleCalendarUrl } from '../lib/calendar';
import { ROLE_LABELS, useAuth } from '../context/AuthContext';

const TYPE_LABELS: Record<InterviewType, string> = {
  screening: 'Screening Telefónico',
  technical: 'Entrevista Técnica',
  hr: 'Entrevista RRHH',
  final: 'Entrevista Final',
};

export const Interviews: React.FC = () => {
  const { interviews, applications, candidates, jobs, addInterview, updateInterview } =
    useHireFlow();
  const { user } = useAuth();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);

  const [applicationId, setApplicationId] = useState('');
  const [type, setType] = useState<InterviewType>('screening');
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewer, setInterviewer] = useState(
    user ? `${user.name} (${ROLE_LABELS[user.role]})` : 'Sofía Lilén Seal (RRHH)'
  );
  const [locationOrLink, setLocationOrLink] = useState('');

  // Estado para el modal de calificación y feedback
  const [completingInterview, setCompletingInterview] = useState<Interview | null>(null);

  // Estado para el modal de plantillas de email
  const [emailModalData, setEmailModalData] = useState<{
    isOpen: boolean;
    template: EmailTemplateKey;
    context: EmailTemplateContext;
  } | null>(null);

  const handleOpenGoogleCalendar = (
    int: Interview,
    candidate: { full_name: string; email: string; phone?: string },
    job: { title: string }
  ) => {
    const url = generateGoogleCalendarUrl({
      title: `Entrevista ${TYPE_LABELS[int.type]} - ${candidate.full_name} (${job.title})`,
      description: `Entrevista de selección para ${job.title}.\nCandidato: ${candidate.full_name} (${candidate.email}, ${candidate.phone || 's/n'}).\nEntrevistador: ${int.interviewer}.\nModalidad / Enlace: ${int.location_or_link}`,
      location: int.location_or_link,
      startDate: int.scheduled_at,
      durationMinutes: 45,
    });
    window.open(url, '_blank');
    toast.info('Google Calendar', 'Se abrió la pestaña para sincronizar la cita.');
  };

  const handleDownloadIcs = (
    int: Interview,
    candidate: { full_name: string },
    job: { title: string }
  ) => {
    downloadIcsFile(
      {
        title: `Entrevista ${TYPE_LABELS[int.type]} - ${candidate.full_name}`,
        description: `Entrevista para la posición ${job.title} en HireFlow ATS.\nEntrevistador: ${int.interviewer}\nLugar / Enlace: ${int.location_or_link}`,
        location: int.location_or_link,
        startDate: int.scheduled_at,
        durationMinutes: 45,
      },
      `Entrevista_${candidate.full_name.replace(/\s+/g, '_')}.ics`
    );
    toast.success(
      'Archivo .ics descargado',
      'Listo para importar en Outlook, Apple Calendar o tu gestor local.'
    );
  };

  const handleOpenEmailModal = (
    int: Interview,
    candidate: { full_name: string; email: string },
    job: { title: string },
    template: EmailTemplateKey = 'interview_invitation'
  ) => {
    setEmailModalData({
      isOpen: true,
      template,
      context: {
        candidateName: candidate.full_name,
        candidateEmail: candidate.email,
        jobTitle: job.title,
        interviewType: TYPE_LABELS[int.type],
        scheduledDate: new Date(int.scheduled_at).toLocaleString('es-AR', {
          dateStyle: 'full',
          timeStyle: 'short',
        }),
        locationOrLink: int.location_or_link,
        interviewer: int.interviewer,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !scheduledAt) return;

    await addInterview({
      application_id: applicationId,
      type,
      scheduled_at: new Date(scheduledAt).toISOString(),
      interviewer: interviewer.trim(),
      location_or_link: locationOrLink.trim() || 'Por confirmar',
      status: 'scheduled',
    });

    const app = applications.find((a) => a.id === applicationId);
    const candidate = candidates.find((c) => c.id === app?.candidate_id);

    toast.success(
      'Citación agendada con éxito',
      `Se coordinó la instancia con ${candidate?.full_name || 'el candidato'}.`
    );

    setApplicationId('');
    setScheduledAt('');
    setLocationOrLink('');
    setShowModal(false);
  };

  const handleConfirmComplete = async (feedback: string, rating: number) => {
    if (!completingInterview) return;

    await updateInterview(completingInterview.id, {
      status: 'completed',
      feedback,
      rating,
    });

    const app = applications.find((a) => a.id === completingInterview.application_id);
    const candidate = candidates.find((c) => c.id === app?.candidate_id);

    toast.success(
      'Entrevista completada y calificada',
      `${candidate?.full_name || 'El candidato'} recibió una valoración de ${rating}/5 estrellas.`
    );
  };

  // Datos del candidato que se está calificando
  const completingApp = completingInterview
    ? applications.find((a) => a.id === completingInterview.application_id)
    : null;
  const completingCandidate = completingApp
    ? candidates.find((c) => c.id === completingApp.candidate_id)
    : null;
  const completingJob = completingApp
    ? jobs.find((j) => j.id === completingApp.job_id)
    : null;

  return (
    <div className="space-y-6">
      <ScrollReveal direction="down" duration={0.6}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#11314E]">Screening, Entrevistas y Citaciones</h2>
            <p className="text-sm text-slate-600 mt-1">
              Coordiná entrevistas con candidatos y registrá devoluciones de cada instancia.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-[#EC623E] hover:bg-[#D95330] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Agendar Citación
          </button>
        </div>
      </ScrollReveal>

      <ScrollReveal staggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {interviews.map((int) => {
          const app = applications.find((a) => a.id === int.application_id);
          const candidate = candidates.find((c) => c.id === app?.candidate_id);
          const job = jobs.find((j) => j.id === app?.job_id);
          if (!candidate || !job) return null;

          return (
            <div
              key={int.id}
              className="bg-white rounded-xl border border-[#EFE3D3] p-5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md hover:border-[#E2D1BD] transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-[#11314E] bg-[#FAF4EC] border border-[#EFE3D3] px-2.5 py-0.5 rounded-md">
                      {TYPE_LABELS[int.type]}
                    </span>
                    <h3 className="font-semibold text-base text-[#11314E] mt-2">
                      {candidate.full_name}
                    </h3>
                    <p className="text-xs text-slate-500">{job.title}</p>
                  </div>

                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      int.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : int.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-[#FDEEE9] text-[#EC623E] border-[#FCD5CA]'
                    }`}
                  >
                    {int.status === 'completed'
                      ? 'Completada'
                      : int.status === 'cancelled'
                      ? 'Cancelada'
                      : 'Agendada'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-[#11314E]">
                  <p className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-[#1A446C]" />
                    {new Date(int.scheduled_at).toLocaleString('es-AR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#1A446C]" />
                    {int.location_or_link}
                  </p>
                  <p className="text-slate-500">Entrevistador: {int.interviewer}</p>
                </div>

                {int.feedback && (
                  <div className="mt-3 p-3 bg-[#FAF4EC] rounded-lg border border-[#EFE3D3] text-xs text-[#11314E]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">Feedback:</span>
                      {int.rating && (
                        <span className="inline-flex items-center gap-1 text-[#EC623E] font-bold">
                          <Star className="w-3.5 h-3.5 fill-[#EC623E] text-[#EC623E]" />
                          {int.rating}/5
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700">{int.feedback}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#EFE3D3]/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenGoogleCalendar(int, candidate, job)}
                    title="Añadir a Google Calendar"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#11314E] bg-[#FAF4EC] hover:bg-[#EFE3D3] border border-[#EFE3D3] px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#1A446C]" />
                    <span>Google Cal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadIcs(int, candidate, job)}
                    title="Descargar archivo universal .ics (Outlook/Apple Calendar)"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#11314E] bg-[#FAF4EC] hover:bg-[#EFE3D3] border border-[#EFE3D3] px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#1A446C]" />
                    <span>.ICS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEmailModal(int, candidate, job)}
                    title="Enviar citación / recordatorio por correo"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#EC623E] bg-[#FDEEE9] hover:bg-[#FCD5CA] border border-[#FCD5CA] px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>
                </div>

                {int.status === 'scheduled' ? (
                  <button
                    onClick={() => setCompletingInterview(int)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Calificar
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ✓ Finalizada
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </ScrollReveal>

      {/* Modal Comunicación por Email */}
      {emailModalData && (
        <EmailModal
          isOpen={emailModalData.isOpen}
          onClose={() => setEmailModalData(null)}
          initialTemplate={emailModalData.template}
          context={emailModalData.context}
        />
      )}

      {/* Modal Calificar Entrevista */}
      <CompleteInterviewModal
        isOpen={completingInterview !== null}
        onClose={() => setCompletingInterview(null)}
        candidateName={completingCandidate?.full_name || 'Candidato'}
        jobTitle={completingJob?.title || 'Vacante'}
        interviewType={completingInterview ? TYPE_LABELS[completingInterview.type] : ''}
        onConfirm={handleConfirmComplete}
      />

      {/* Modal Agendar Entrevista */}
      {showModal && (
        <div className="fixed inset-0 bg-[#11314E]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-[#EFE3D3] max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-[#EFE3D3]/70 pb-3">
              <h3 className="font-bold text-lg text-[#11314E]">Agendar Citación / Entrevista</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-[#11314E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Postulación (Candidato - Vacante) *
                </label>
                <select
                  required
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm text-[#11314E]"
                >
                  <option value="">Seleccionar...</option>
                  {applications.map((a) => {
                    const c = candidates.find((x) => x.id === a.candidate_id);
                    const j = jobs.find((x) => x.id === a.job_id);
                    return (
                      <option key={a.id} value={a.id}>
                        {c?.full_name} — {j?.title}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as InterviewType)}
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm text-[#11314E]"
                  >
                    <option value="screening">Screening</option>
                    <option value="hr">RRHH</option>
                    <option value="technical">Técnica</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#11314E] mb-1">
                    Fecha y Hora *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-2 py-2 text-sm text-[#11314E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Entrevistador
                </label>
                <input
                  required
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Link de videollamada o lugar físico
                </label>
                <input
                  value={locationOrLink}
                  onChange={(e) => setLocationOrLink(e.target.value)}
                  placeholder="https://meet.google.com/... o Sala 1"
                  className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/40 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EFE3D3]/70">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-[#FAF4EC] rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-[#EC623E] hover:bg-[#D95330] text-white rounded-lg cursor-pointer shadow-sm"
                >
                  Guardar Citación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
