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
