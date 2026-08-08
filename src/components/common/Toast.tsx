import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const bgColors = {
    success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50',
    error: 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/50',
    info: 'bg-blue-950/90 border-blue-500/40 text-blue-200 shadow-blue-950/50',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
      <div className={`pointer-events-auto p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 ${bgColors[toast.type]}`}>
        <div className="flex items-center gap-3 min-w-0">
          {icons[toast.type]}
          <div className="min-w-0">
            <h5 className="font-bold text-xs text-white truncate">{toast.title}</h5>
            {toast.message && <p className="text-[11px] opacity-80 truncate mt-0.5">{toast.message}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
