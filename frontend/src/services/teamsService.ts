import { apiClient } from './api';
import {
  Team,
  TeamMember,
  TeamInvitation,
  InviteMemberRequest,
  InviteMemberResponse,
  UpdateTeamRequest,
} from '../types/team';

class TeamsService {
  async getTeam(): Promise<Team> {
    const response = await apiClient.get<{ success: boolean; data: { team: Team } }>(
      '/teams'
    );
    return response.data.data.team;
  }

  async getMembers(): Promise<TeamMember[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: { members: TeamMember[] };
    }>('/teams/members');
    return response.data.data.members;
  }

  async inviteMember(email: string): Promise<InviteMemberResponse> {
    const response = await apiClient.post<{
      success: boolean;
      data: InviteMemberResponse;
    }>('/teams/invite', { email });
    return response.data.data;
  }

  async getInvitations(): Promise<TeamInvitation[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: { invitations: TeamInvitation[] };
    }>('/teams/invitations');
    return response.data.data.invitations;
  }

  async resendInvitation(invitationId: number): Promise<void> {
    await apiClient.post(`/teams/invitations/${invitationId}/resend`);
  }

  async cancelInvitation(invitationId: number): Promise<void> {
    await apiClient.delete(`/teams/invitations/${invitationId}`);
  }

  async removeMember(memberId: number): Promise<void> {
    await apiClient.delete(`/teams/members/${memberId}`);
  }

  async updateTeam(name: string): Promise<Team> {
    const response = await apiClient.put<{ success: boolean; data: { team: Team } }>(
      '/teams',
      { name }
    );
    return response.data.data.team;
  }

  async getMyMemberships(): Promise<TeamMembership[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: { memberships: TeamMembership[] };
    }>('/teams/my-memberships');
    return response.data.data.memberships;
  }

  async leaveTeam(teamId: number): Promise<void> {
    await apiClient.delete(`/teams/leave/${teamId}`);
  }

  async getMyPendingInvitations(): Promise<PendingInvitation[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: { invitations: PendingInvitation[] };
    }>('/teams/pending-invitations-for-me');
    return response.data.data.invitations;
  }

  async acceptInvitation(invitationToken: string): Promise<{ team_id: number }> {
    const response = await apiClient.post<{
      success: boolean;
      data: { team_id: number };
      message: string;
    }>('/teams/accept-invitation', { invitation_token: invitationToken });
    return response.data.data;
  }

  async declineInvitation(invitationToken: string): Promise<void> {
    await apiClient.post('/teams/decline-invitation', { invitation_token: invitationToken });
  }

  async getAllMyTeams(): Promise<UserTeam[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: { teams: UserTeam[] };
    }>('/teams/all-my-teams');
    return response.data.data.teams;
  }

  async getTeamDashboard(): Promise<TeamDashboardMetrics> {
    const response = await apiClient.get<{
      success: boolean;
      data: { metrics: TeamDashboardMetrics };
    }>('/teams/dashboard');
    return response.data.data.metrics;
  }

  async getTeamDashboardReports(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    template_id?: number;
  }): Promise<TeamDashboardReportsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.template_id) queryParams.append('template_id', params.template_id.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: TeamDashboardReportsResponse;
    }>(`/teams/dashboard/reports?${queryParams.toString()}`);
    return response.data.data;
  }
}

export const teamsService = new TeamsService();

export interface TeamMembership {
  id: number;
  team_id: number;
  team_name: string;
  role: string;
  joined_at: string;
  invited_by_name?: string;
  invited_by_email?: string;
}

export interface PendingInvitation {
  id: number;
  team_id: number;
  team_name: string;
  invitation_token: string;
  invited_by_name: string;
  invited_by_email: string;
  created_at: string;
  expires_at: string;
}

export interface UserTeam {
  team_id: number;
  team_name: string;
  role: string;
  is_owner: boolean;
  joined_at: string;
}

export interface TeamDashboardMetrics {
  shared_template_count: number;
  reports_using_shared_templates: number;
  total_team_members: number;
  team_name: string;
  is_owner: boolean;
}

export interface TeamDashboardReport {
  id: number;
  title: string;
  summary: string;
  template_id: number;
  template_name: string;
  template_shared: boolean;
  created_by: number;
  created_by_name: string;
  created_at: string;
  finalized_at: string;
}

export interface TeamDashboardReportsResponse {
  reports: TeamDashboardReport[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  templates: { id: number; name: string }[];
}
