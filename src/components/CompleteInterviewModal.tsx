import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface CompleteInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  jobTitle: string;
  interviewType: string;
  onConfirm: (feedback: string, rating: number) => Promise<void>;
}

const RATING_LABELS: Record<number, string> = {
  1: '1/5 — No cumple con las expectativas del rol',
  2: '2/5 — Cumple parcialmente / Dudas en skills clave',
  3: '3/5 — Aceptable / Cumple los requisitos base',
  4: '4/5 — Muy buen desempeño / Candidato recomendado',
  5: '5/5 — Sobresaliente / Supera expectativas (Top Match)',
};

export const CompleteInterviewModal: React.FC<CompleteInterviewModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  jobTitle,
  interviewType,
  onConfirm,
}) => {
  const [rating, setRating] = useState<number>(4);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { shouldRender, backdropClass, contentClass } = useModalAnimation(isOpen);

  if (!shouldRender) return null;

  const currentDisplayRating = hoverRating !== null ? hoverRating : rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(feedback.trim(), rating);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 bg-[#11314E]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 ${backdropClass}`}
    >
      <div className={`bg-white rounded-xl border border-[#EFE3D3] max-w-md w-full p-6 shadow-2xl ${contentClass}`}>
        <div className="flex items-start justify-between mb-4 border-b border-[#EFE3D3]/70 pb-3">
          <div>
            <span className="text-[11px] font-semibold text-[#11314E] bg-[#FAF4EC] border border-[#EFE3D3] px-2 py-0.5 rounded">
              {interviewType}
            </span>
            <h3 className="font-bold text-lg text-[#11314E] mt-1.5">Calificar Entrevista</h3>
            <p className="text-xs text-slate-500">
              {candidateName} · {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#11314E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Calificación interactiva con estrellas */}
          <div>
            <label className="block text-xs font-semibold text-[#11314E] mb-1.5">
              Calificación general
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 rounded hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= currentDisplayRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-[11px] font-medium text-slate-600 mt-1">
              {RATING_LABELS[currentDisplayRating]}
            </p>
          </div>

          {/* Feedback cualitativo */}
          <div>
            <label className="block text-xs font-semibold text-[#11314E] mb-1">
              Devolución / Feedback de la instancia *
            </label>
            <textarea
              required
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describí los puntos fuertes, debilidades técnicas observadas y recomendación para el siguiente paso..."
              className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/30 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-sm outline-none text-[#11314E]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EFE3D3]/70">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-[#FAF4EC] rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold bg-[#EC623E] hover:bg-[#D95330] disabled:opacity-50 text-white rounded-lg cursor-pointer shadow-sm transition-colors"
            >
              {loading ? 'Guardando...' : 'Guardar y Completar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
