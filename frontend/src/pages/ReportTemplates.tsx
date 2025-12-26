import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { Plus, FileText } from 'lucide-react';
import { Container, Box, Typography, Button, Fade } from '@mui/material';
import { motion } from 'framer-motion';
import { Template } from '../types/template';
import { templatesService } from '../services/templatesService';
import { TemplateList } from '../components/templates/TemplateList';
import { TemplateBuilder } from '../components/templates/TemplateBuilder';
import { useToast } from '../components/common/CustomToast';

export const ReportTemplates: React.FC = () => {
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>(undefined);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templatesService.getAllTemplates();
      setTemplates(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(undefined);
    setShowBuilder(true);
  };

  const handleEdit = async (template: Template) => {
    try {
      // Fetch full template details with fields
      const fullTemplate = await templatesService.getTemplateById(template.id);
      setEditingTemplate(fullTemplate);
      setShowBuilder(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load template details');
    }
  };

  const handleDelete = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      await templatesService.deleteTemplate(templateId);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleSave = () => {
    setShowBuilder(false);
    setEditingTemplate(undefined);
    loadTemplates();
  };

  const handleCancel = () => {
    setShowBuilder(false);
    setEditingTemplate(undefined);
  };

  return (
    <Layout>
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Fade in={true} timeout={600}>
            <Box sx={{ mb: 6 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText className="w-7 h-7 text-white" />
                  </Box>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" color="text.primary">
                      Report Templates
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                      Create and manage custom templates for call analysis
                    </Typography>
                  </Box>
                </Box>
                {!showBuilder && templates.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="contained"
                      onClick={handleCreate}
                      startIcon={<Plus className="w-5 h-5" />}
                      sx={{
                        px: 3,
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
                      New Template
                    </Button>
                  </motion.div>
                )}
              </Box>
            </Box>
          </Fade>

          {/* Main Content */}
          <Box>
            {showBuilder ? (
              <Fade in={true} timeout={400}>
                <Box>
                  <TemplateBuilder
                    template={editingTemplate}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                </Box>
              </Fade>
            ) : (
              <TemplateList
                templates={templates}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreate={handleCreate}
              />
            )}
          </Box>
        </Container>
      </Box>
    </Layout>
  );
};
