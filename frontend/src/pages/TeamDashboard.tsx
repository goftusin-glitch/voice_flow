import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Chip,
  CircularProgress,
  Fade,
  IconButton,
} from '@mui/material';
import {
  Users,
  FileText,
  BarChart3,
  Search,
  Eye,
  Calendar,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  teamsService,
  TeamDashboardMetrics,
  TeamDashboardReport,
} from '../services/teamsService';
import { useToast } from '../components/common/CustomToast';

export const TeamDashboard: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<TeamDashboardMetrics | null>(null);
  const [reports, setReports] = useState<TeamDashboardReport[]>([]);
  const [templates, setTemplates] = useState<{ id: number; name: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | ''>('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadReports();
  }, [page, selectedTemplate]);

  useEffect(() => {
    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      setPage(1);
      loadReports();
    }, 500);
    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [search]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await teamsService.getTeamDashboard();
      setMetrics(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load team dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const data = await teamsService.getTeamDashboardReports({
        page,
        per_page: 10,
        search: search || undefined,
        template_id: selectedTemplate || undefined,
      });
      setReports(data.reports);
      setTotal(data.total);
      setPages(data.pages);
      setTemplates(data.templates);
    } catch (error: any) {
      console.error('Failed to load reports:', error);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleViewReport = (reportId: number) => {
    navigate(`/reports?view=${reportId}`);
  };

  if (loading) {
    return (
      <Layout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Fade in={true} timeout={600}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
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
                  <Users className="w-7 h-7 text-white" />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight="bold" color="text.primary">
                    Team Dashboard
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {metrics?.team_name || 'Your Team'} Overview
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fade>

          {/* Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid {...{ item: true } as any} xs={12} sm={6} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: 'primary.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {metrics?.reports_using_shared_templates || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reports Using Shared Templates
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid {...{ item: true } as any} xs={12} sm={6} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: 'success.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileText className="w-6 h-6 text-green-600" />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                          {metrics?.shared_template_count || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Shared Templates
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid {...{ item: true } as any} xs={12} sm={6} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: 'warning.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Users className="w-6 h-6 text-orange-600" />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight="bold" color="warning.main">
                          {metrics?.total_team_members || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Team Members
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Reports Table */}
          <Fade in={true} timeout={800}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Typography variant="h6" fontWeight={600}>
                    Team Reports
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Search */}
                    <TextField
                      size="small"
                      placeholder="Search reports..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search className="w-4 h-4 text-gray-400" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ width: 250 }}
                    />

                    {/* Template Filter */}
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Filter by Template</InputLabel>
                      <Select
                        value={selectedTemplate}
                        label="Filter by Template"
                        onChange={(e) => {
                          setSelectedTemplate(e.target.value as number | '');
                          setPage(1);
                        }}
                      >
                        <MenuItem value="">All Templates</MenuItem>
                        {templates.map((template) => (
                          <MenuItem key={template.id} value={template.id}>
                            {template.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                {/* Table */}
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Report Title</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Template</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Created By</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">
                              No reports found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports.map((report) => (
                          <TableRow
                            key={report.id}
                            hover
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {report.title}
                              </Typography>
                              {report.summary && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {report.summary}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{report.template_name}</Typography>
                                {report.template_shared && (
                                  <Chip
                                    label="Shared"
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.65rem',
                                      bgcolor: 'success.100',
                                      color: 'success.800',
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <User className="w-4 h-4 text-gray-400" />
                                <Typography variant="body2">{report.created_by_name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <Typography variant="body2">
                                  {format(new Date(report.created_at), 'MMM d, yyyy')}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewReport(report.id)}
                                title="View Report"
                              >
                                <Eye className="w-4 h-4" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {pages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={pages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}

                {/* Total Count */}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Showing {reports.length} of {total} reports
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Container>
      </Box>
    </Layout>
  );
};
