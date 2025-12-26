import React from 'react';
import { Template } from '../../types/template';
import { TemplateCard } from './TemplateCard';
import { FileText, Plus } from 'lucide-react';
import { Box, Grid, Card, CardContent, Typography, Button, CircularProgress, Fade, Grow } from '@mui/material';
import { motion } from 'framer-motion';

interface TemplateListProps {
  templates: Template[];
  loading: boolean;
  onEdit: (template: Template) => void;
  onDelete: (templateId: number) => void;
  onCreate: () => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  loading,
  onEdit,
  onDelete,
  onCreate,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (templates.length === 0) {
    return (
      <Fade in={true} timeout={800}>
        <Card elevation={3} sx={{ borderRadius: 3, p: 8, textAlign: 'center' }}>
          <CardContent>
            <Box
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'grey.100',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <FileText className="w-12 h-12 text-gray-400" />
            </Box>
            <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
              No Templates Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Create your first report template to start analyzing calls with custom fields and
              structure.
            </Typography>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                onClick={onCreate}
                startIcon={<Plus className="w-5 h-5" />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6b3fa0 100%)',
                    boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.6)',
                  },
                }}
              >
                Create Your First Template
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </Fade>
    );
  }

  return (
    <Grid container spacing={3}>
      {templates.map((template, index) => (
        <Grid item xs={12} sm={6} lg={4} key={template.id}>
          <Grow in={true} timeout={600 + index * 100}>
            <Box>
              <TemplateCard
                template={template}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </Box>
          </Grow>
        </Grid>
      ))}
    </Grid>
  );
};
