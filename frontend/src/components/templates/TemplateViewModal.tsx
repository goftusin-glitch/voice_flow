import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import { X, FileText, GripVertical, User, Calendar, Lock } from 'lucide-react';
import { Template, TemplateField } from '../../types/template';
import { format } from 'date-fns';

interface TemplateViewModalProps {
  open: boolean;
  onClose: () => void;
  template: Template | null;
}

const getFieldTypeLabel = (fieldType: string): string => {
  const typeMap: Record<string, string> = {
    'text': 'Text',
    'number': 'Number',
    'long_text': 'Long Text',
    'dropdown': 'Dropdown',
    'multi_select': 'Multi Select',
    'email': 'Email',
    'date': 'Date',
    'phone': 'Phone',
  };
  return typeMap[fieldType] || fieldType;
};

export const TemplateViewModal: React.FC<TemplateViewModalProps> = ({
  open,
  onClose,
  template,
}) => {
  if (!template) return null;

  const fields = template.fields || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'primary.100',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText className="w-6 h-6 text-blue-600" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {template.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Lock className="w-4 h-4 text-gray-500" />
                  <Typography variant="body2" color="text.secondary">
                    Read-only Template
                  </Typography>
                </Box>
              </Box>
            </Box>
            <IconButton onClick={onClose} size="small">
              <X className="w-5 h-5" />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 3 }}>
        {/* Description */}
        {template.description && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              {template.description}
            </Typography>
          </Box>
        )}

        {/* Meta Info */}
        <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <User className="w-4 h-4 text-gray-500" />
            <Typography variant="body2" color="text.secondary">
              Created by: <strong>{template.created_by_name || 'Unknown'}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar className="w-4 h-4 text-gray-500" />
            <Typography variant="body2" color="text.secondary">
              {format(new Date(template.created_at), 'MMMM d, yyyy')}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Fields Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Template Fields
            </Typography>
            <Chip
              label={`${fields.length} ${fields.length === 1 ? 'field' : 'fields'}`}
              size="small"
              color="primary"
              sx={{ fontWeight: 500 }}
            />
          </Box>

          <Box sx={{
            bgcolor: 'grey.50',
            borderRadius: 2,
            p: 2,
            border: '1px solid',
            borderColor: 'grey.200',
          }}>
            {fields.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                No fields defined in this template
              </Typography>
            ) : (
              fields.map((field: TemplateField, index: number) => (
                <Box
                  key={field.id || index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 1.5,
                    px: 1,
                    borderBottom: index < fields.length - 1 ? '1px solid' : 'none',
                    borderColor: 'grey.200',
                    bgcolor: 'white',
                    borderRadius: index === 0 ? '8px 8px 0 0' : index === fields.length - 1 ? '0 0 8px 8px' : 0,
                    mb: index < fields.length - 1 ? 0 : 0,
                  }}
                >
                  {/* Drag Handle (visual only) */}
                  <GripVertical className="w-4 h-4 text-gray-300" />

                  {/* Field Number */}
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: 'primary.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" fontWeight={600} color="primary.main">
                      {index + 1}
                    </Typography>
                  </Box>

                  {/* Field Label */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {field.field_label}
                    </Typography>
                    {field.is_required && (
                      <Typography variant="caption" color="error.main">
                        Required
                      </Typography>
                    )}
                  </Box>

                  {/* Field Type Badge */}
                  <Chip
                    label={getFieldTypeLabel(field.field_type)}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 26,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      borderColor: 'grey.300',
                    }}
                  />

                  {/* Options for dropdown/multi_select */}
                  {(field.field_type === 'dropdown' || field.field_type === 'multi_select') &&
                    field.field_options &&
                    field.field_options.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {field.field_options.length} options
                      </Typography>
                    )}
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* Info Banner */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'info.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'info.200',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Lock className="w-5 h-5 text-blue-600" />
          <Typography variant="body2" color="info.dark">
            This is a shared team template. You can use it for analysis but cannot modify it.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
