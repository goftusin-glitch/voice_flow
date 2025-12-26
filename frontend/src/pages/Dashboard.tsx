import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { BarChart3, FileText, Users, Clock, TrendingUp, Activity as ActivityIcon } from 'lucide-react';
import { dashboardService, DashboardMetrics, Activity } from '../services/dashboardService';
import { Card, CardContent, Button, Box, Typography, CircularProgress, Fade, Grow } from '@mui/material';
import { motion } from 'framer-motion';
import { useToast } from '../components/common/CustomToast';

export const Dashboard: React.FC = () => {
  const toast = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    hours_analyzed: 0,
    analysis_count: 0,
    template_count: 0,
    team_member_count: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsData, activitiesData] = await Promise.all([
        dashboardService.getMetrics().catch(() => ({
          hours_analyzed: 0,
          analysis_count: 0,
          template_count: 0,
          team_member_count: 0,
        })),
        dashboardService.getRecentActivity(10).catch(() => []),
      ]);
      setMetrics(metricsData);
      setActivities(activitiesData);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const metricCards = [
    {
      title: 'Hours Analyzed',
      value: Number(metrics.hours_analyzed || 0).toFixed(1),
      icon: Clock,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Analyses',
      value: String(metrics.analysis_count || 0),
      icon: BarChart3,
      color: 'bg-green-500',
    },
    {
      title: 'Report Templates',
      value: String(metrics.template_count || 0),
      icon: FileText,
      color: 'bg-purple-500',
    },
    {
      title: 'Team Members',
      value: String(metrics.team_member_count || 0),
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of your call analysis activity
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Grow
                key={metric.title}
                in={true}
                timeout={500 + index * 100}
              >
                <motion.div
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Card
                    elevation={2}
                    sx={{
                      height: '100%',
                      borderRadius: 2,
                      '&:hover': {
                        boxShadow: 6,
                      },
                      transition: 'box-shadow 0.3s ease-in-out',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {metric.title}
                          </Typography>
                          <Typography variant="h3" component="div" fontWeight="bold">
                            {metric.value}
                          </Typography>
                        </Box>
                        <Box
                          className={`p-3 rounded-lg ${metric.color}`}
                          sx={{ borderRadius: 2 }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grow>
            );
          })}
        </div>

        {/* Welcome/Quick Actions Card */}
        <Fade in={true} timeout={800}>
          <Card
            elevation={3}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              mb: 4,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {metrics.analysis_count > 0 ? 'Keep Going!' : 'Welcome to Voice Flow!'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
                {metrics.analysis_count > 0
                  ? `You've analyzed ${metrics.analysis_count} calls so far. Keep up the great work!`
                  : 'Get started by creating your first report template or analyzing a call.'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="contained"
                    href="/templates"
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      fontWeight: 600,
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: 'grey.100',
                      },
                    }}
                  >
                    {metrics.template_count > 0 ? 'View Templates' : 'Create Template'}
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="contained"
                    href="/analyze"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    Analyze Call
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="contained"
                    href="/reports"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    View Reports
                  </Button>
                </motion.div>
              </Box>
            </CardContent>
          </Card>
        </Fade>

        {/* Recent Activity */}
        <Fade in={true} timeout={1000}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <ActivityIcon className="w-6 h-6 text-gray-700" />
                <Typography variant="h5" fontWeight="bold">
                  Recent Activity
                </Typography>
              </Box>

              {activities.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: 'grey.100',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </Box>
                  <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    No recent activity yet
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                    Start analyzing calls to see your activity here
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {activities.map((activity, index) => (
                    <Grow
                      key={`${activity.type}-${activity.id}`}
                      in={true}
                      timeout={300 + index * 100}
                    >
                      <motion.div
                        whileHover={{ scale: 1.01, x: 4 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <Card
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: 'grey.100',
                            },
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: 'primary.50',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {activity.type === 'report_created' ? (
                                <FileText className="w-5 h-5 text-blue-600" />
                              ) : (
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                              )}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {activity.type === 'report_created' ? (
                                  <>
                                    <span style={{ color: '#2563eb' }}>{activity.user_name}</span> created
                                    report: {activity.report_title}
                                  </>
                                ) : (
                                  <>
                                    <span style={{ color: '#2563eb' }}>{activity.user_name}</span> created
                                    template: {activity.template_name}
                                  </>
                                )}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                {formatDate(activity.created_at)}
                              </Typography>
                            </Box>
                          </Box>
                        </Card>
                      </motion.div>
                    </Grow>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Fade>
      </div>
    </Layout>
  );
};
