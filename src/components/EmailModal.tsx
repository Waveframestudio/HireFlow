import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Mail, Send, X } from 'lucide-react';
import {
  EMAIL_TEMPLATES,
  EmailTemplateContext,
  EmailTemplateKey,
  buildMailtoUrl,
} from '../lib/emailTemplates';
import { useToast } from '../context/ToastContext';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: EmailTemplateKey;
  context: EmailTemplateContext;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  initialTemplate = 'interview_invitation',
  context,
}) => {
  const toast = useToast();
  const { shouldRender, backdropClass, contentClass } = useModalAnimation(isOpen);
  const [selectedKey, setSelectedKey] = useState<EmailTemplateKey>(initialTemplate);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);

  // Cargar plantilla inicial o al cambiar de tipo
  useEffect(() => {
    if (isOpen) {
      setSelectedKey(initialTemplate);
      const generated = EMAIL_TEMPLATES[initialTemplate].generate(context);
      setSubject(generated.subject);
      setBody(generated.body);
      setCopied(false);
    }
  }, [isOpen, initialTemplate, context.candidateName, context.jobTitle, context.scheduledDate]);

  const handleSelectTemplate = (key: EmailTemplateKey) => {
    setSelectedKey(key);
    const generated = EMAIL_TEMPLATES[key].generate(context);
    setSubject(generated.subject);
    setBody(generated.body);
    setCopied(false);
  };

  const handleCopy = async () => {
    const fullText = `Asunto: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success(
        'Mensaje copiado al portapapeles',
        'Podés pegarlo directamente en tu cliente de correo o mensajería.'
      );
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Error al copiar', 'No se pudo acceder al portapapeles del navegador.');
    }
  };

  const handleOpenClient = () => {
    const mailto = buildMailtoUrl(context.candidateEmail, subject, body);
    window.location.href = mailto;
    toast.info('Abriendo cliente de correo...', `Destinatario: ${context.candidateEmail}`);
  };

  if (!shouldRender) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#11314E]/60 backdrop-blur-xs ${backdropClass}`}
    >
      <div className={`bg-white rounded-2xl max-w-2xl w-full border border-[#EFE3D3] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${contentClass}`}>
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF4EC] border-b border-[#EFE3D3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FDEEE9] text-[#EC623E]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#11314E]">
                Plantillas de Comunicación por Email
              </h3>
              <p className="text-xs text-slate-500">
                Para: <span className="font-semibold text-[#11314E]">{context.candidateName}</span> (
                {context.candidateEmail}) • {context.jobTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-[#FAF4EC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Selector de Plantillas */}
          <div>
            <label className="block text-xs font-bold text-[#11314E] uppercase tracking-wider mb-2">
              Tipo de Comunicación:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(EMAIL_TEMPLATES) as EmailTemplateKey[]).map((key) => {
                const item = EMAIL_TEMPLATES[key];
                const isActive = selectedKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectTemplate(key)}
                    className={`text-left p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#11314E] text-white border-[#11314E] shadow-sm'
                        : 'bg-[#FAF4EC]/60 text-slate-700 border-[#EFE3D3] hover:border-[#1A446C] hover:bg-[#FAF4EC]'
                    }`}
                  >
                    <p className="truncate">{item.title}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo Asunto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Línea de Asunto:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-sm font-medium border border-[#EFE3D3] rounded-lg px-3 py-2 bg-[#FAF4EC]/30 text-[#11314E] focus:outline-none focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E]"
            />
          </div>

          {/* Campo Cuerpo del Mensaje */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Cuerpo del Correo (Editable):
              </label>
              <span className="text-[11px] text-slate-400">{body.length} caracteres</span>
            </div>
            <textarea
              rows={11}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full text-xs font-sans border border-[#EFE3D3] rounded-lg p-3 bg-[#FAF4EC]/20 text-slate-800 focus:outline-none focus:border-[#EC623E] focus:ring-1 focus:ring-[#EC623E] leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-[#FAF4EC]/70 border-t border-[#EFE3D3] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer px-3 py-2"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-[#EFE3D3] bg-white text-[#11314E] hover:bg-[#FAF4EC] transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Mensaje</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenClient}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-[#EC623E] hover:bg-[#D95330] text-white transition-colors cursor-pointer shadow-xs hover:shadow-md"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir en Cliente de Correo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
