import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import { X, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'success' | 'danger' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false,
}) => {
  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return 'success.main';
      case 'danger':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      default:
        return 'info.main';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={48} />;
      case 'danger':
        return <Trash2 size={48} />;
      case 'warning':
        return <AlertTriangle size={48} />;
      default:
        return <AlertTriangle size={48} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'grey.500',
        }}
      >
        <X size={20} />
      </IconButton>

      {/* Icon */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          pt: 4,
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: `${getTypeColor().replace('.main', '.light')}`,
            color: getTypeColor(),
          }}
        >
          {getTypeIcon()}
        </Box>
      </Box>

      {/* Title */}
      <DialogTitle
        sx={{
          textAlign: 'center',
          fontSize: '1.5rem',
          fontWeight: 600,
          pb: 1,
          pt: 2,
        }}
      >
        {title}
      </DialogTitle>

      {/* Content */}
      <DialogContent>
        <DialogContentText
          sx={{
            textAlign: 'center',
            fontSize: '1rem',
            color: 'text.secondary',
            px: 2,
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          justifyContent: 'center',
          gap: 2,
          px: 3,
          pb: 3,
          pt: 2,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          size="large"
          disabled={loading}
          sx={{
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            bgcolor: getTypeColor(),
            '&:hover': {
              bgcolor: getTypeColor(),
              filter: 'brightness(0.9)',
            },
          }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
