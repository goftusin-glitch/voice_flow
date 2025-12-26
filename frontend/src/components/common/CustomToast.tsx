import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor, Slide, Grow, Fade } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

interface Toast {
  id: string;
  message: string;
  type: AlertColor;
  duration?: number;
}

interface ToastContextType {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: AlertColor, duration: number = 4000) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getIcon = (type: AlertColor) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon sx={{ fontSize: 24 }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 24 }} />;
      case 'warning':
        return <WarningIcon sx={{ fontSize: 24 }} />;
      case 'info':
        return <InfoIcon sx={{ fontSize: 24 }} />;
      default:
        return undefined;
    }
  };

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <Snackbar
            key={toast.id}
            open={true}
            autoHideDuration={toast.duration}
            onClose={() => handleClose(toast.id)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            TransitionComponent={Slide}
            TransitionProps={{ direction: 'left' } as any}
            sx={{
              top: `${24 + index * 80}px !important`,
              right: '24px !important',
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
            >
              <Alert
                onClose={() => handleClose(toast.id)}
                severity={toast.type}
                icon={getIcon(toast.type)}
                variant="filled"
                sx={{
                  minWidth: '300px',
                  maxWidth: '500px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  alignItems: 'center',
                  '& .MuiAlert-icon': {
                    fontSize: 24,
                    marginRight: 1.5,
                  },
                  '& .MuiAlert-message': {
                    padding: '8px 0',
                  },
                  '& .MuiAlert-action': {
                    paddingLeft: 2,
                  },
                  ...(toast.type === 'success' && {
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '& .MuiAlert-icon': {
                      color: '#fff',
                    },
                  }),
                  ...(toast.type === 'error' && {
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    '& .MuiAlert-icon': {
                      color: '#fff',
                    },
                  }),
                  ...(toast.type === 'warning' && {
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    '& .MuiAlert-icon': {
                      color: '#fff',
                    },
                  }),
                  ...(toast.type === 'info' && {
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    '& .MuiAlert-icon': {
                      color: '#fff',
                    },
                  }),
                }}
              >
                {toast.message}
              </Alert>
            </motion.div>
          </Snackbar>
        ))}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};
