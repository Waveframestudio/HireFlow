import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (title: string, type?: ToastType, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, type: ToastType = 'info', description?: string) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastItem = { id, type, title, description };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => showToast(title, 'success', description),
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string) => showToast(title, 'error', description),
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string) => showToast(title, 'info', description),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast Notifications Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
              toast.type === 'success'
                ? 'bg-white/95 border-emerald-200 text-[#11314E]'
                : toast.type === 'error'
                ? 'bg-white/95 border-rose-200 text-[#11314E]'
                : 'bg-white/95 border-[#EFE3D3] text-[#11314E]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              )}
              {toast.type === 'error' && (
                <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="w-6 h-6 rounded-full bg-[#FAF4EC] flex items-center justify-center">
                  <Info className="w-4 h-4 text-[#EC623E]" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight text-[#11314E]">{toast.title}</p>
              {toast.description && (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-[#11314E] p-0.5 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
};
