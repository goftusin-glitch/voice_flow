export interface Team {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  role: 'owner' | 'member';
  joined_at: string;
  name: string;
  email: string;
}

export interface TeamInvitation {
  id: number;
  team_id: number;
  email: string;
  invited_by: number;
  invitation_token: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  invited_by_name?: string;
  accepted_by_name?: string;
}

export interface InviteMemberRequest {
  email: string;
}

export interface InviteMemberResponse {
  invitation_id: number;
  email: string;
  invitation_link: string;
}

export interface UpdateTeamRequest {
  name: string;
}
