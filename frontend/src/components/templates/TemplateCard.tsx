import React from 'react';
import { GripVertical, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, Box, Typography, IconButton, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { Template, TemplateField } from '../../types/template';

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (templateId: number) => void;
  onView?: (template: Template) => void;
}

// Map field types to display labels
const getFieldTypeLabel = (fieldType: string): string => {
  const typeMap: Record<string, string> = {
    'text': 'text',
    'number': 'number',
    'long_text': 'text',
    'dropdown': 'select',
    'multi_select': 'multi',
    'email': 'email',
    'date': 'date',
    'phone': 'phone',
  };
  return typeMap[fieldType] || fieldType;
};

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onDelete, onView }) => {
  const fields = template.fields || [];
  const displayFields = fields.slice(0, 3);
  const remainingFieldsCount = fields.length - 3;

  const handleCardClick = () => {
    if (template.can_edit) {
      onEdit(template);
    } else if (onView) {
      onView(template);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        elevation={1}
        sx={{
          height: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'grey.200',
          '&:hover': {
            boxShadow: 3,
            borderColor: 'grey.300',
          },
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header - Name and Field Count */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ flex: 1 }}>
              {template.name}
            </Typography>
            <Typography variant="body2" color="primary.main" fontWeight={500} sx={{ ml: 2, whiteSpace: 'nowrap' }}>
              {template.field_count} {template.field_count === 1 ? 'field' : 'fields'}
            </Typography>
          </Box>

          {/* Description */}
          {template.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
              }}
            >
              {template.description}
            </Typography>
          )}

          {/* Fields Preview */}
          <Box sx={{ flex: 1, mb: 2 }}>
            {displayFields.map((field: TemplateField, index: number) => (
              <Box
                key={field.id || index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1,
                  borderBottom: index < displayFields.length - 1 ? '1px solid' : 'none',
                  borderColor: 'grey.100',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag Handle Icon */}
                <GripVertical className="w-4 h-4 text-gray-300" />

                {/* Field Label */}
                <Typography
                  variant="body2"
                  fontWeight={500}
                  color="text.primary"
                  sx={{ flex: 1, minWidth: 0 }}
                  noWrap
                >
                  {field.field_label}
                </Typography>

                {/* Field Type Badge */}
                <Chip
                  label={getFieldTypeLabel(field.field_type)}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    borderColor: 'grey.300',
                    color: 'text.secondary',
                    borderRadius: 1.5,
                  }}
                />

                {/* Summary Badge */}
                <Chip
                  label="Summary"
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    bgcolor: 'primary.50',
                    color: 'primary.700',
                    borderRadius: 1.5,
                  }}
                />
              </Box>
            ))}

            {/* More Fields Indicator */}
            {remainingFieldsCount > 0 && (
              <Typography
                variant="body2"
                color="primary.main"
                sx={{ mt: 1, fontWeight: 500 }}
              >
                +{remainingFieldsCount} more {remainingFieldsCount === 1 ? 'field' : 'fields'}
              </Typography>
            )}
          </Box>

          {/* Footer - Actions and Type Badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'grey.100',
              mt: 'auto',
            }}
          >
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
              {template.can_edit ? (
                <>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <IconButton
                      onClick={() => onEdit(template)}
                      size="small"
                      color="primary"
                      title="Edit template"
                      sx={{
                        bgcolor: 'primary.50',
                        '&:hover': { bgcolor: 'primary.100' },
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </IconButton>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <IconButton
                      onClick={() => onDelete(template.id)}
                      size="small"
                      color="error"
                      title="Delete template"
                      sx={{
                        bgcolor: 'error.50',
                        '&:hover': { bgcolor: 'error.100' },
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </motion.div>
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <IconButton
                    onClick={() => onView && onView(template)}
                    size="small"
                    color="primary"
                    title="View template"
                    sx={{
                      bgcolor: 'grey.100',
                      '&:hover': { bgcolor: 'grey.200' },
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </IconButton>
                </motion.div>
              )}
            </Box>

            {/* Type Badge */}
            {template.is_shared && (
              <Chip
                label="Read-only (Team Type)"
                size="small"
                variant="outlined"
                sx={{
                  height: 28,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  borderColor: 'grey.300',
                  color: 'text.secondary',
                  borderRadius: 2,
                }}
              />
            )}
            {template.is_owner && template.shared_with_team && (
              <Chip
                label="Shared with Team"
                size="small"
                sx={{
                  height: 28,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  bgcolor: 'success.50',
                  color: 'success.700',
                  borderRadius: 2,
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};
