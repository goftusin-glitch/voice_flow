import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { reportsService } from '../services/reportsService';
import { teamsService, UserTeam } from '../services/teamsService';
import { Report } from '../types/report';
import { Search, Eye, Download, Mail, MessageCircle, Trash2, ChevronLeft, ChevronRight, FileText, Calendar, User, Filter, Users, FileSpreadsheet } from 'lucide-react';
import { Container, Card, CardContent, Box, Typography, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, IconButton, Chip, CircularProgress, Fade, Grow, Pagination, Button, Menu } from '@mui/material';
import { motion } from 'framer-motion';
import { useToast } from '../components/common/CustomToast';
import { ReportViewModal } from '../components/reports/ReportViewModal';
import { ShareModal } from '../components/reports/ShareModal';

export const MyReports: React.FC = () => {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'finalized'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<UserTeam | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const teamMenuOpen = Boolean(anchorEl);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadReports();
    }
  }, [page, search, statusFilter, selectedTeam]);

  const loadTeams = async () => {
    try {
      const userTeams = await teamsService.getAllMyTeams();
      setTeams(userTeams);

      // Set the first team (user's own team) as default
      if (userTeams.length > 0) {
        setSelectedTeam(userTeams[0]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load teams');
    }
  };

  const loadReports = async () => {
    if (!selectedTeam) return;

    try {
      setLoading(true);
      const response = await reportsService.getReports(
        page,
        20,
        search || undefined,
        statusFilter === 'all' ? undefined : statusFilter,
        selectedTeam.team_id
      );
      setReports(response.reports);
      setTotal(response.total);
      setTotalPages(response.pages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleTeamMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTeamSelect = (team: UserTeam) => {
    setSelectedTeam(team);
    setPage(1); // Reset to first page when changing teams
    handleTeamMenuClose();
    toast.success(`Switched to ${team.team_name}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as 'all' | 'draft' | 'finalized');
    setPage(1); // Reset to first page on filter change
  };

  const handleViewReport = async (report: Report) => {
    try {
      const fullReport = await reportsService.getReportById(report.id);
      setSelectedReport(fullReport);
      setShowViewModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load report');
    }
  };

  const handleDownloadPDF = async (reportId: number) => {
    try {
      toast.info('Generating PDF...');
      await reportsService.downloadPDF(reportId);
      toast.success('PDF downloaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download PDF');
    }
  };

  const handleDownloadExcel = async (reportId: number) => {
    try {
      toast.info('Generating Excel file...');
      await reportsService.downloadExcel(reportId);
      toast.success('Excel file downloaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download Excel file');
    }
  };

  const handleShareEmail = (report: Report) => {
    setSelectedReport(report);
    setShowShareModal(true);
  };

  const handleShareWhatsApp = async (reportId: number) => {
    try {
      const response = await reportsService.getWhatsAppShareLink(reportId);
      window.open(response.whatsapp_url, '_blank');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create WhatsApp link');
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await reportsService.deleteReport(reportId);
      toast.success('Report deleted successfully');
      loadReports();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete report');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Fade in={true} timeout={600}>
            <Box sx={{ mb: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
                    My Reports
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                    View and manage all your call analysis reports
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fade>

          {/* Filters */}
          <Grow in={true} timeout={800}>
            <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                  {/* Team Selector */}
                  {teams.length > 1 && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Users className="w-4 h-4" />}
                        onClick={handleTeamMenuOpen}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            bgcolor: 'primary.50',
                          },
                        }}
                      >
                        {selectedTeam?.team_name || 'Select Team'}
                      </Button>
                    </motion.div>
                  )}

                  <Menu
                    anchorEl={anchorEl}
                    open={teamMenuOpen}
                    onClose={handleTeamMenuClose}
                    PaperProps={{
                      sx: {
                        borderRadius: 2,
                        mt: 1,
                        minWidth: 250,
                      },
                    }}
                  >
                    {teams.map((team) => (
                      <MenuItem
                        key={team.team_id}
                        onClick={() => handleTeamSelect(team)}
                        selected={selectedTeam?.team_id === team.team_id}
                        sx={{
                          py: 1.5,
                          px: 2.5,
                          borderRadius: 1,
                          mx: 1,
                          my: 0.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                          <Users className="w-4 h-4 text-gray-500" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {team.team_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {team.is_owner ? 'Owner' : 'Member'}
                            </Typography>
                          </Box>
                          {selectedTeam?.team_id === team.team_id && (
                            <Chip label="Active" size="small" color="primary" sx={{ height: 20 }} />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Search reports..."
                    value={search}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search className="w-5 h-5 text-gray-400" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel id="status-filter-label">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Filter className="w-4 h-4" />
                        Status
                      </Box>
                    </InputLabel>
                    <Select
                      labelId="status-filter-label"
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => {
                        setStatusFilter(e.target.value as 'all' | 'draft' | 'finalized');
                        setPage(1);
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="finalized">Finalized</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </Grow>

          {/* Reports List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
              <CircularProgress size={60} thickness={4} />
            </Box>
          ) : reports.length === 0 ? (
            <Fade in={true} timeout={800}>
              <Card elevation={2} sx={{ borderRadius: 3, p: 8, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'grey.100',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <FileText className="w-10 h-10 text-gray-400" />
                </Box>
                <Typography variant="h6" color="text.secondary" fontWeight={500}>
                  No reports found
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start by analyzing your first call'}
                </Typography>
              </Card>
            </Fade>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {reports.map((report, index) => (
                <Grow key={report.id} in={true} timeout={600 + index * 100}>
                  <motion.div
                    whileHover={{ scale: 1.01, y: -2 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <Card
                      elevation={2}
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: 6,
                        },
                        transition: 'box-shadow 0.3s ease-in-out',
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                            {/* Title */}
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
                              {report.title}
                            </Typography>

                            {/* Meta Information */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FileText className="w-4 h-4 text-gray-500" />
                                <Typography variant="body2" color="text.secondary">
                                  {report.template_name || 'Unknown'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <User className="w-4 h-4 text-gray-500" />
                                <Typography variant="body2" color="text.secondary">
                                  {typeof report.created_by === 'string'
                                    ? report.created_by
                                    : report.created_by?.name || 'Unknown'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(report.created_at)}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Summary */}
                            {report.summary && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mb: 2,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {report.summary}
                              </Typography>
                            )}

                            {/* Status Chip */}
                            <Chip
                              label={report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                              size="small"
                              color={report.status === 'finalized' ? 'success' : 'warning'}
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>

                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <IconButton
                                onClick={() => handleViewReport(report)}
                                color="primary"
                                size="medium"
                                title="View Report"
                                sx={{
                                  bgcolor: 'primary.50',
                                  '&:hover': { bgcolor: 'primary.100' },
                                }}
                              >
                                <Eye className="w-5 h-5" />
                              </IconButton>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <IconButton
                                onClick={() => handleDownloadPDF(report.id)}
                                color="success"
                                size="medium"
                                title="Download PDF"
                                sx={{
                                  bgcolor: 'success.50',
                                  '&:hover': { bgcolor: 'success.100' },
                                }}
                              >
                                <Download className="w-5 h-5" />
                              </IconButton>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <IconButton
                                onClick={() => handleDownloadExcel(report.id)}
                                sx={{
                                  color: '#10b981',
                                  bgcolor: '#d1fae5',
                                  '&:hover': { bgcolor: '#a7f3d0' },
                                }}
                                size="medium"
                                title="Download Excel"
                              >
                                <FileSpreadsheet className="w-5 h-5" />
                              </IconButton>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <IconButton
                                onClick={() => handleShareEmail(report)}
                                sx={{
                                  color: 'purple',
                                  bgcolor: '#f3e8ff',
                                  '&:hover': { bgcolor: '#e9d5ff' },
                                }}
                                size="medium"
                                title="Share Report"
                              >
                                <Mail className="w-5 h-5" />
                              </IconButton>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <IconButton
                                onClick={() => handleShareWhatsApp(report.id)}
                                sx={{
                                  color: '#10b981',
                                  bgcolor: '#d1fae5',
                                  '&:hover': { bgcolor: '#a7f3d0' },
                                }}
                                size="medium"
                                title="Share via WhatsApp"
                              >
                                <MessageCircle className="w-5 h-5" />
                              </IconButton>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <IconButton
                                onClick={() => handleDeleteReport(report.id)}
                                color="error"
                                size="medium"
                                title="Delete Report"
                                sx={{
                                  bgcolor: 'error.50',
                                  '&:hover': { bgcolor: 'error.100' },
                                }}
                              >
                                <Trash2 className="w-5 h-5" />
                              </IconButton>
                            </motion.div>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grow>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <Fade in={true} timeout={1000}>
                  <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Showing <strong>{(page - 1) * 20 + 1}</strong> to{' '}
                      <strong>{Math.min(page * 20, total)}</strong> of <strong>{total}</strong> reports
                    </Typography>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                      sx={{
                        '& .MuiPaginationItem-root': {
                          fontWeight: 500,
                        },
                      }}
                    />
                  </Box>
                </Fade>
              )}
            </Box>
          )}

          {/* Modals */}
          {showViewModal && selectedReport && (
            <ReportViewModal
              report={selectedReport}
              onClose={() => {
                setShowViewModal(false);
                setSelectedReport(null);
              }}
              onUpdate={loadReports}
            />
          )}

          {showShareModal && selectedReport && (
            <ShareModal
              report={selectedReport}
              onClose={() => {
                setShowShareModal(false);
                setSelectedReport(null);
              }}
            />
          )}
        </Container>
      </Box>
    </Layout>
  );
};
