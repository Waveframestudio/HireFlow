import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface RejectCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  jobTitle: string;
  onConfirm: (reason: string) => Promise<void>;
}

const COMMON_REASONS = [
  'Expectativa salarial fuera de rango',
  'Falta de seniority o skills clave',
  'No superó la instancia técnica',
  'Aceptó otra oferta laboral',
  'Falta de fit cultural con el equipo',
  'Sin respuesta a citaciones de entrevista',
];

export const RejectCandidateModal: React.FC<RejectCandidateModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  jobTitle,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0]);
  const [customComment, setCustomComment] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalReason = customComment.trim()
        ? `${selectedReason}: ${customComment.trim()}`
        : selectedReason;
      await onConfirm(finalReason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#11314E]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl border border-[#EFE3D3] max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-3 border-b border-[#EFE3D3]/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#11314E]">Descartar Candidato</h3>
              <p className="text-xs text-slate-500">
                {candidateName} · {jobTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#11314E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#11314E] mb-2">
              Motivo principal de descarte
            </label>
            <div className="space-y-1.5">
              {COMMON_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedReason === reason
                      ? 'border-rose-300 bg-rose-50/70 text-rose-900 font-medium'
                      : 'border-[#EFE3D3] hover:bg-[#FAF4EC]/40 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-rose-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#11314E] mb-1">
              Comentario adicional (opcional)
            </label>
            <textarea
              rows={2}
              value={customComment}
              onChange={(e) => setCustomComment(e.target.value)}
              placeholder="Detalles complementarios para el historial de RRHH..."
              className="w-full border border-[#EFE3D3] bg-[#FAF4EC]/30 focus:bg-white focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] rounded-lg px-3 py-2 text-xs outline-none text-[#11314E]"
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
              className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg cursor-pointer shadow-sm transition-colors"
            >
              {loading ? 'Descartando...' : 'Confirmar Descarte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
