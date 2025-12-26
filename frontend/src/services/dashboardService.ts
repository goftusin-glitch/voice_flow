import { apiClient } from './api';

export interface DashboardMetrics {
  hours_analyzed: number;
  analysis_count: number;
  template_count: number;
  team_member_count: number;
}

export interface Activity {
  id: number;
  type: 'report_created' | 'template_created';
  user_name: string;
  report_title?: string;
  template_name?: string;
  created_at: string;
}

export interface AnalyticsData {
  daily_analyses: Array<{ date: string; count: number }>;
  daily_reports: Array<{ date: string; count: number }>;
}

class DashboardService {
  async getMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.get<{ success: boolean; data: DashboardMetrics }>(
      '/dashboard/metrics'
    );
    return response.data.data;
  }

  async getRecentActivity(limit = 10): Promise<Activity[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: { activities: Activity[] };
    }>(`/dashboard/recent-activity?limit=${limit}`);
    return response.data.data.activities;
  }

  async getAnalytics(days = 30): Promise<AnalyticsData> {
    const response = await apiClient.get<{
      success: boolean;
      data: AnalyticsData;
    }>(`/dashboard/analytics?days=${days}`);
    return response.data.data;
  }
}

export const dashboardService = new DashboardService();
