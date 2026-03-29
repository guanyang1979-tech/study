'use client';

import { useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle, XCircle, Info } from 'lucide-react';

type ModalType = 'alert' | 'confirm' | 'info';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

// 简化版对话框 - 用于 alert/info
function SimpleModal({
  isOpen,
  onClose,
  title = '提示',
  message,
  type = 'info',
  confirmText = '确定'
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  const iconMap = {
    alert: <AlertTriangle className="w-12 h-12 text-amber-500" />,
    info: <Info className="w-12 h-12 text-blue-500" />,
    confirm: <CheckCircle className="w-12 h-12 text-green-500" />
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-full max-w-md p-6 rounded-xl shadow-2xl z-50
                       bg-white dark:bg-slate-800
                       border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 rounded-full bg-slate-100 dark:bg-slate-700">
                {iconMap[type]}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                {message}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600
                           text-white rounded-lg font-medium transition-colors"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// 确认对话框
function ConfirmModal({
  isOpen,
  onClose,
  title = '确认',
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm
}: ModalProps) {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-full max-w-md p-6 rounded-xl shadow-2xl z-50
                       bg-white dark:bg-slate-800
                       border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="w-12 h-12 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                {message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300
                             dark:bg-slate-700 dark:hover:bg-slate-600
                             text-slate-700 dark:text-slate-200
                             rounded-lg font-medium transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600
                             text-white rounded-lg font-medium transition-colors"
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// 提示框管理器
type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
                  ${bgColors[type]} bg-white dark:bg-slate-800`}
    >
      {icons[type]}
      <span className="text-slate-700 dark:text-slate-200">{message}</span>
    </motion.div>
  );
}

// Context 管理器
import { createContext, useContext, useState, useRef } from 'react';

interface ModalContextType {
  alert: (message: string, type?: ModalType) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
  toast: (message: string, type?: ToastType) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);
  const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type: ModalType; title?: string }>({
    isOpen: false,
    message: '',
    type: 'info'
  });
  const alertResolveRef = useRef<(() => void) | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    message: ''
  });

  const alert = useCallback((message: string, type: ModalType = 'info') => {
    return new Promise<void>((resolve) => {
      alertResolveRef.current = resolve;
      setAlertState({ isOpen: true, message, type, title: type === 'alert' ? '警告' : '提示' });
    });
  }, []);

  const handleAlertClose = useCallback(() => {
    setAlertState((s) => ({ ...s, isOpen: false }));
    if (alertResolveRef.current) {
      alertResolveRef.current();
      alertResolveRef.current = null;
    }
  }, []);

  const confirm = useCallback((message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ isOpen: true, message, title: title || '确认', resolve });
    });
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ModalContext.Provider value={{ alert, confirm, toast }}>
      {children}
      <SimpleModal
        isOpen={alertState.isOpen}
        onClose={handleAlertClose}
        message={alertState.message}
        type={alertState.type}
        title={alertState.title}
      />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => {
          setConfirmState((s) => ({ ...s, isOpen: false }));
          confirmState.resolve?.(false);
        }}
        message={confirmState.message}
        title={confirmState.title}
        onConfirm={() => confirmState.resolve?.(true)}
      />
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}