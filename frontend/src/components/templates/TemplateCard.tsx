import React from 'react';
import { Edit, Trash2, FileText, Calendar, User, ArrowRight, Users, Share2 } from 'lucide-react';
import { Card, CardContent, Box, Typography, IconButton, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { Template } from '../../types/template';
import { format } from 'date-fns';

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (templateId: number) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onDelete }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        elevation={2}
        sx={{
          height: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          '&:hover': {
            boxShadow: 6,
          },
          transition: 'box-shadow 0.3s ease-in-out',
        }}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'primary.50',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText className="w-6 h-6 text-blue-600" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }} noWrap>
                  {template.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${template.field_count} ${template.field_count === 1 ? 'field' : 'fields'}`}
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 500 }}
                  />
                  {/* Show "Shared" badge for templates shared by team members */}
                  {template.is_shared && (
                    <Chip
                      icon={<Users className="w-3 h-3" />}
                      label="Shared"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        bgcolor: 'success.100',
                        color: 'success.800',
                        '& .MuiChip-icon': { color: 'success.600', ml: 0.5 }
                      }}
                    />
                  )}
                  {/* Show "Sharing" badge for own templates shared with team */}
                  {template.is_owner && template.shared_with_team && (
                    <Chip
                      icon={<Share2 className="w-3 h-3" />}
                      label="Sharing"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        bgcolor: 'info.100',
                        color: 'info.800',
                        '& .MuiChip-icon': { color: 'info.600', ml: 0.5 }
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Action Buttons - Only show if user can edit */}
            {template.can_edit && (
              <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
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
              </Box>
            )}
            {!template.can_edit && (
              <Chip
                label="View Only"
                size="small"
                sx={{
                  ml: 1,
                  bgcolor: 'grey.200',
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  height: 24,
                }}
              />
            )}
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
                flex: 1,
              }}
            >
              {template.description}
            </Typography>
          )}

          {/* Footer */}
          <Box
            sx={{
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 'auto',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <User className="w-3.5 h-3.5 text-gray-400" />
                <Typography variant="caption" color="text.secondary">
                  {template.created_by_name || 'Unknown'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(template.created_at), 'MMM d, yyyy')}
                </Typography>
              </Box>
            </Box>

            <motion.div whileHover={{ x: 4 }}>
              <Box
                onClick={() => onEdit(template)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'primary.main',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  '&:hover': { color: 'primary.dark' },
                }}
              >
                {template.can_edit ? 'Edit' : 'View'}
                <ArrowRight className="w-4 h-4" />
              </Box>
            </motion.div>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};
