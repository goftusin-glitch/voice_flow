import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import { X, Save, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Report, UpdateReportRequest, CustomField } from '../../types/report';
import { reportsService } from '../../services/reportsService';
import { useToast } from '../common/CustomToast';

interface DraftEditModalProps {
  open: boolean;
  onClose: () => void;
  draft: Report;
  onUpdate: () => void;
  onFinalize?: () => void;
}

export const DraftEditModal: React.FC<DraftEditModalProps> = ({
  open,
  onClose,
  draft,
  onUpdate,
  onFinalize,
}) => {
  const toast = useToast();
  const [editedTitle, setEditedTitle] = useState(draft.title);
  const [editedFieldValues, setEditedFieldValues] = useState<Record<number, string | number>>(
    draft.field_values?.reduce((acc, fv) => {
      acc[fv.field_id] = fv.value;
      return acc;
    }, {} as Record<number, string | number>) || {}
  );
  const [customFields, setCustomFields] = useState<Array<{ custom_field_name: string; value: string | number }>>(
    draft.custom_fields?.map(cf => ({
      custom_field_name: cf.custom_field_name,
      value: cf.value
    })) || []
  );
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const handleFieldValueChange = (fieldId: number, value: string | number) => {
    setEditedFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { custom_field_name: '', value: '' }]);
  };

  const handleCustomFieldNameChange = (index: number, name: string) => {
    const updated = [...customFields];
    updated[index].custom_field_name = name;
    setCustomFields(updated);
  };

  const handleCustomFieldValueChange = (index: number, value: string | number) => {
    const updated = [...customFields];
    updated[index].value = value;
    setCustomFields(updated);
  };

  const handleRemoveCustomField = (index: number) => {
    const updated = customFields.filter((_, i) => i !== index);
    setCustomFields(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Filter out custom fields with empty names
      const validCustomFields = customFields.filter(cf => cf.custom_field_name.trim() !== '');

      const updateData: UpdateReportRequest = {
        title: editedTitle,
        field_values: Object.entries(editedFieldValues).map(([fieldId, value]) => ({
          field_id: parseInt(fieldId),
          value,
        })),
        custom_fields: validCustomFields,
      };

      await reportsService.updateReport(draft.id, updateData);
      toast.success('Draft updated successfully');
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndFinalize = async () => {
    try {
      setFinalizing(true);

      // Filter out custom fields with empty names
      const validCustomFields = customFields.filter(cf => cf.custom_field_name.trim() !== '');

      // First save the changes
      const updateData: UpdateReportRequest = {
        title: editedTitle,
        field_values: Object.entries(editedFieldValues).map(([fieldId, value]) => ({
          field_id: parseInt(fieldId),
          value,
        })),
        custom_fields: validCustomFields,
      };

      await reportsService.updateReport(draft.id, updateData);

      // Then finalize
      await reportsService.finalizeDraft(draft.id);

      toast.success('Draft saved and finalized successfully! It now appears in My Reports.');
      onUpdate();
      onClose();
      if (onFinalize) {
        onFinalize();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to finalize draft');
    } finally {
      setFinalizing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Edit Draft
        </Typography>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 3 }}>
        {/* Metadata */}
        <Box
          sx={{
            bgcolor: 'grey.50',
            borderRadius: 2,
            p: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Template
              </Typography>
              <Typography variant="body2">{draft.template?.name || 'Unknown'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Created At
              </Typography>
              <Typography variant="body2">{formatDate(draft.created_at)}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Title */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Report Title *
          </Typography>
          <TextField
            fullWidth
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Enter report title"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Field Values */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Analysis Details
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {draft.field_values && draft.field_values.length > 0 ? (
            draft.field_values.map((fv) => (
              <Box key={fv.field_id}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  {fv.field_label}
                </Typography>
                {fv.field_type === 'long_text' ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={editedFieldValues[fv.field_id] || ''}
                    onChange={(e) => handleFieldValueChange(fv.field_id, e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                ) : fv.field_type === 'number' ? (
                  <TextField
                    fullWidth
                    type="number"
                    value={editedFieldValues[fv.field_id] || ''}
                    onChange={(e) => handleFieldValueChange(fv.field_id, e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    value={editedFieldValues[fv.field_id] || ''}
                    onChange={(e) => handleFieldValueChange(fv.field_id, e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No fields to edit
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Custom Fields */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Custom Fields
          </Typography>
          <Button
            onClick={handleAddCustomField}
            variant="outlined"
            size="small"
            startIcon={<Plus size={16} />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Add Field
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {customFields.length > 0 ? (
            customFields.map((cf, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  gap: 2,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'grey.50',
                }}
              >
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Field Name"
                    value={cf.custom_field_name}
                    onChange={(e) => handleCustomFieldNameChange(index, e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'white',
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    placeholder="Field Value"
                    value={cf.value}
                    onChange={(e) => handleCustomFieldValueChange(index, e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'white',
                      },
                    }}
                  />
                </Box>
                <IconButton
                  onClick={() => handleRemoveCustomField(index)}
                  size="small"
                  sx={{
                    color: 'error.main',
                    alignSelf: 'flex-start',
                    '&:hover': {
                      bgcolor: 'error.light',
                    },
                  }}
                >
                  <Trash2 size={20} />
                </IconButton>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No custom fields added yet. Click "Add Field" to create one.
            </Typography>
          )}
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 2,
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={saving || finalizing}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
          }}
        >
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!editedTitle.trim() || saving || finalizing}
          startIcon={saving ? <CircularProgress size={20} /> : <Save size={20} />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            bgcolor: 'primary.main',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          onClick={handleSaveAndFinalize}
          variant="contained"
          disabled={!editedTitle.trim() || saving || finalizing}
          startIcon={finalizing ? <CircularProgress size={20} /> : <CheckCircle size={20} />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            bgcolor: 'success.main',
            '&:hover': {
              bgcolor: 'success.dark',
            },
          }}
        >
          {finalizing ? 'Finalizing...' : 'Finalize'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
