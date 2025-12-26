import React, { useEffect, useState } from 'react';
import { Template } from '../../types/template';
import { templatesService } from '../../services/templatesService';
import { FileText, ChevronDown, Check } from 'lucide-react';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Box, Typography, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../common/CustomToast';

interface TemplateSelectorProps {
  selectedTemplate: Template | null;
  onTemplateSelect: (template: Template) => void;
  disabled?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  disabled = false,
}) => {
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templatesService.getAllTemplates();
      setTemplates(data);

      // Auto-select first template if none selected
      if (data.length > 0 && !selectedTemplate) {
        onTemplateSelect(data[0]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template: Template) => {
    onTemplateSelect(template);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={32} thickness={4} sx={{ mr: 2 }} />
        <Typography color="text.secondary">Loading templates...</Typography>
      </Box>
    );
  }

  if (templates.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4, border: '2px dashed', borderColor: 'grey.300', borderRadius: 2 }}>
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <Typography variant="body1" color="text.secondary" gutterBottom>
          No templates available
        </Typography>
        <motion.a
          href="/templates"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ display: 'inline-block', marginTop: '16px' }}
        >
          <Box
            sx={{
              px: 3,
              py: 1.5,
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 2,
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            Create Template
          </Box>
        </motion.a>
      </Box>
    );
  }

  return (
    <FormControl fullWidth>
      <InputLabel id="template-select-label">Select Report Template *</InputLabel>
      <Select
        labelId="template-select-label"
        value={selectedTemplate?.id || ''}
        label="Select Report Template *"
        disabled={disabled}
        onChange={(e) => {
          const template = templates.find(t => t.id === e.target.value);
          if (template) onTemplateSelect(template);
        }}
        sx={{
          borderRadius: 2,
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        }}
        MenuProps={{
          PaperProps: {
            elevation: 8,
            sx: {
              maxHeight: 400,
              borderRadius: 2,
              mt: 1,
            },
          },
        }}
      >
        {templates.map((template) => (
          <MenuItem
            key={template.id}
            value={template.id}
            sx={{
              py: 2,
              px: 2,
              '&:hover': {
                bgcolor: 'primary.50',
              },
              '&.Mui-selected': {
                bgcolor: 'primary.100',
                '&:hover': {
                  bgcolor: 'primary.200',
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Box
                sx={{
                  p: 1,
                  bgcolor: 'primary.100',
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText className="w-5 h-5 text-blue-600" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={600}>
                  {template.name}
                </Typography>
                {template.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {template.description}
                  </Typography>
                )}
                <Chip
                  label={`${template.field_count} field${template.field_count !== 1 ? 's' : ''}`}
                  size="small"
                  sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                />
              </Box>
              {selectedTemplate?.id === template.id && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
