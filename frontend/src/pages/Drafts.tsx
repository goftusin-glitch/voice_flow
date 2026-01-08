import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { reportsService } from '../services/reportsService';
import { Report } from '../types/report';
import { Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, FileText, Calendar, User } from 'lucide-react';
import { Container, Card, CardContent, Box, Typography, TextField, InputAdornment, IconButton, CircularProgress, Fade, Grow, Pagination } from '@mui/material';
import { motion } from 'framer-motion';
import { useToast } from '../components/common/CustomToast';
import { ReportViewModal } from '../components/reports/ReportViewModal';
import { useNavigate } from 'react-router-dom';

export const Drafts: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, [page, search]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getDrafts(page, 20);
      setDrafts(response.drafts || response.reports || []);
      setTotal(response.total);
      setTotalPages(response.pages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleView = async (draft: Report) => {
    try {
      const fullReport = await reportsService.getReportById(draft.id);
      setSelectedReport(fullReport);
      setShowViewModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load draft');
    }
  };

  const handleDelete = async (draftId: number) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      await reportsService.deleteReport(draftId);
      toast.success('Draft deleted successfully');
      loadDrafts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete draft');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Fade in timeout={500}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              My Drafts
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your saved draft reports
            </Typography>
          </Box>
        </Fade>

        {/* Search Bar */}
        <Grow in timeout={700}>
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <TextField
                fullWidth
                placeholder="Search drafts by title..."
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grow>

        {/* Results Header */}
        {!loading && (
          <Fade in timeout={900}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {drafts.length} of {total} drafts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Page {page} of {totalPages}
              </Typography>
            </Box>
          </Fade>
        )}

        {/* Drafts List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : drafts.length === 0 ? (
          <Fade in timeout={1000}>
            <Card sx={{ borderRadius: 2, textAlign: 'center', py: 8 }}>
              <CardContent>
                <FileText size={64} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No drafts found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {search ? 'Try adjusting your search query' : 'Start analyzing calls to create drafts'}
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {drafts.map((draft, index) => (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                          {draft.title}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FileText size={16} style={{ opacity: 0.6 }} />
                            <Typography variant="body2" color="text.secondary">
                              {draft.template_name || 'Unknown Template'}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <User size={16} style={{ opacity: 0.6 }} />
                            <Typography variant="body2" color="text.secondary">
                              {draft.created_by}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Calendar size={16} style={{ opacity: 0.6 }} />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(draft.created_at)}
                            </Typography>
                          </Box>
                        </Box>

                        {draft.summary && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {draft.summary.substring(0, 150)}
                            {draft.summary.length > 150 ? '...' : ''}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                        <IconButton
                          onClick={() => handleView(draft)}
                          size="small"
                          sx={{
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' },
                          }}
                        >
                          <Eye size={20} />
                        </IconButton>

                        <IconButton
                          onClick={() => handleDelete(draft.id)}
                          size="small"
                          sx={{
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' },
                          }}
                        >
                          <Trash2 size={20} />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Fade in timeout={1200}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          </Fade>
        )}
      </Container>

      {/* View Modal */}
      {selectedReport && (
        <ReportViewModal
          open={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedReport(null);
          }}
          report={selectedReport}
        />
      )}
    </Layout>
  );
};
