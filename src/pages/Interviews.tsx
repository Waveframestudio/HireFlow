import React, { useState } from 'react';
import { CalendarClock, CheckCircle2, Plus, Star, Video, X } from 'lucide-react';
import { useHireFlow } from '../context/HireFlowContext';
import { InterviewType } from '../types';

const TYPE_LABELS: Record<InterviewType, string> = {
  screening: 'Screening Telefónico',
  technical: 'Entrevista Técnica',
  hr: 'Entrevista RRHH',
  final: 'Entrevista Final',
};

export const Interviews: React.FC = () => {
  const { interviews, applications, candidates, jobs, addInterview, updateInterview } =
    useHireFlow();
  const [showModal, setShowModal] = useState(false);

  const [applicationId, setApplicationId] = useState('');
  const [type, setType] = useState<InterviewType>('screening');
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewer, setInterviewer] = useState('Sofía Lilén Seal (RRHH)');
  const [locationOrLink, setLocationOrLink] = useState('');

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

    setApplicationId('');
    setScheduledAt('');
    setLocationOrLink('');
    setShowModal(false);
  };

  const handleComplete = async (id: string) => {
    const feedback = window.prompt('Ingresá el feedback de la entrevista:') || '';
    const ratingStr = window.prompt('Puntaje del 1 al 5:', '4');
    const rating = Math.min(5, Math.max(1, Number(ratingStr) || 4));
    await updateInterview(id, { status: 'completed', feedback, rating });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Screening, Entrevistas y Citaciones</h2>
          <p className="text-sm text-slate-500 mt-1">
            Coordiná entrevistas con candidatos y registrá devoluciones de cada instancia.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Agendar Citación
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {interviews.map((int) => {
          const app = applications.find((a) => a.id === int.application_id);
          const candidate = candidates.find((c) => c.id === app?.candidate_id);
          const job = jobs.find((j) => j.id === app?.job_id);
          if (!candidate || !job) return null;

          return (
            <div
              key={int.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {TYPE_LABELS[int.type]}
                    </span>
                    <h3 className="font-semibold text-base text-slate-900 mt-2">
                      {candidate.full_name}
                    </h3>
                    <p className="text-xs text-slate-500">{job.title}</p>
                  </div>

                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      int.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : int.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {int.status === 'completed'
                      ? 'Completada'
                      : int.status === 'cancelled'
                      ? 'Cancelada'
                      : 'Agendada'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-slate-400" />
                    {new Date(int.scheduled_at).toLocaleString('es-AR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-slate-400" />
                    {int.location_or_link}
                  </p>
                  <p className="text-slate-500">Entrevistador: {int.interviewer}</p>
                </div>

                {int.feedback && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">Feedback:</span>
                      {int.rating && (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {int.rating}/5
                        </span>
                      )}
                    </div>
                    <p>{int.feedback}</p>
                  </div>
                )}
              </div>

              {int.status === 'scheduled' && (
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleComplete(int.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cargar Feedback y Completar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Agendar Entrevista */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Agendar Citación / Entrevista</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Postulación (Candidato - Vacante) *
                </label>
                <select
                  required
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as InterviewType)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="screening">Screening</option>
                    <option value="hr">RRHH</option>
                    <option value="technical">Técnica</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Fecha y Hora *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Entrevistador
                </label>
                <input
                  required
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Link de videollamada o lugar físico
                </label>
                <input
                  value={locationOrLink}
                  onChange={(e) => setLocationOrLink(e.target.value)}
                  placeholder="https://meet.google.com/... o Sala 1"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
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
