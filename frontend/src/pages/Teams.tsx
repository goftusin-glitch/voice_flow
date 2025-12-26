import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { teamsService, TeamMembership } from '../services/teamsService';
import { Team, TeamMember, TeamInvitation } from '../types/team';
import { Users, UserPlus, Mail, Trash2, RotateCw, Crown, User, Edit2, Check, X, Info, LogOut, Calendar } from 'lucide-react';
import { Card, CardContent, Button, TextField, IconButton, Chip, Box, Typography, CircularProgress, Fade, Grow, Avatar, Alert, AlertTitle } from '@mui/material';
import { motion } from 'framer-motion';
import { useToast } from '../components/common/CustomToast';
import { useAuth } from '../context/AuthContext';

export const Teams: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [myMemberships, setMyMemberships] = useState<TeamMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [editedTeamName, setEditedTeamName] = useState('');
  const [updatingTeamName, setUpdatingTeamName] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [teamData, membersData, invitationsData, membershipsData] = await Promise.all([
        teamsService.getTeam(),
        teamsService.getMembers(),
        teamsService.getInvitations(),
        teamsService.getMyMemberships().catch(() => []),
      ]);
      setTeam(teamData);
      setMembers(membersData);
      setInvitations(invitationsData);
      setMyMemberships(membershipsData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setInviting(true);
      await teamsService.inviteMember(inviteEmail);
      toast.success('Invitation sent successfully');
      setInviteEmail('');
      loadTeamData(); // Reload to show new invitation
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvitation = async (invitationId: number) => {
    try {
      await teamsService.resendInvitation(invitationId);
      toast.success('Invitation resent successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      await teamsService.cancelInvitation(invitationId);
      toast.success('Invitation cancelled');
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    try {
      await teamsService.removeMember(memberId);
      toast.success('Member removed successfully');
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleEditTeamName = () => {
    if (team) {
      setEditedTeamName(team.name);
      setIsEditingTeamName(true);
    }
  };

  const handleCancelEditTeamName = () => {
    setIsEditingTeamName(false);
    setEditedTeamName('');
  };

  const handleSaveTeamName = async () => {
    if (!editedTeamName.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }

    try {
      setUpdatingTeamName(true);
      const updatedTeam = await teamsService.updateTeam(editedTeamName.trim());
      setTeam(updatedTeam);
      setIsEditingTeamName(false);
      toast.success('Team name updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update team name');
    } finally {
      setUpdatingTeamName(false);
    }
  };

  const handleLeaveTeam = async (teamId: number, teamName: string) => {
    if (!window.confirm(`Are you sure you want to leave "${teamName}"? You will lose access to all reports and templates in this team.`)) {
      return;
    }

    try {
      await teamsService.leaveTeam(teamId);
      toast.success('Successfully left the team');
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to leave team');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOwner = (member: TeamMember) => member.role === 'owner';
  const currentUserMember = members.find((m) => m.user_id === user?.id);
  const canManageTeam = currentUserMember?.role === 'owner';

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
      <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8" />
            Team Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your team members and invitations
          </p>
        </div>

        {/* Team Info */}
        {team && (
          <Fade in={true} timeout={600}>
            <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Team Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                      Team Name:
                    </Typography>
                    {isEditingTeamName ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <TextField
                          value={editedTeamName}
                          onChange={(e) => setEditedTeamName(e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="Enter team name"
                          disabled={updatingTeamName}
                          autoFocus
                          sx={{ flex: 1 }}
                        />
                        <IconButton
                          onClick={handleSaveTeamName}
                          disabled={updatingTeamName}
                          color="success"
                          size="small"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          onClick={handleCancelEditTeamName}
                          disabled={updatingTeamName}
                          color="error"
                          size="small"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {team.name}
                        </Typography>
                        {canManageTeam && (
                          <IconButton
                            onClick={handleEditTeamName}
                            size="small"
                            color="primary"
                            title="Edit team name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                      Created:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(team.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 4 }}>
          {/* Members Section */}
          <Grow in={true} timeout={900}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Users className="w-5 h-5 text-gray-700" />
                  <Typography variant="h6" fontWeight="bold">
                    Team Members ({members.length})
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {members.map((member, index) => (
                    <Fade key={member.id} in={true} timeout={700 + index * 100}>
                      <motion.div
                        whileHover={{ scale: 1.01, x: 4 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: 'grey.100',
                            },
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{
                                width: 48,
                                height: 48,
                                bgcolor: isOwner(member) ? 'primary.main' : 'primary.100',
                              }}
                            >
                              {isOwner(member) ? (
                                <Crown className="w-5 h-5 text-white" />
                              ) : (
                                <User className="w-5 h-5 text-blue-600" />
                              )}
                            </Avatar>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {member.name}
                                </Typography>
                                {isOwner(member) && (
                                  <Chip
                                    label="Owner"
                                    size="small"
                                    color="primary"
                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 500 }}
                                  />
                                )}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {member.email}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                Joined {formatDate(member.joined_at)}
                              </Typography>
                            </Box>
                          </Box>
                          {canManageTeam && !isOwner(member) && (
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <IconButton
                                onClick={() => handleRemoveMember(member.user_id, member.name)}
                                color="error"
                                size="small"
                                title="Remove member"
                                sx={{
                                  bgcolor: 'error.50',
                                  '&:hover': { bgcolor: 'error.100' },
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </IconButton>
                            </motion.div>
                          )}
                        </Box>
                      </motion.div>
                    </Fade>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grow>

          {/* Invitations Section */}
          <Grow in={true} timeout={1000}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Mail className="w-5 h-5 text-gray-700" />
                  <Typography variant="h6" fontWeight="bold">
                    Invitations ({invitations.length})
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  All team invitations with their current status
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                {/* Invite Form */}
                {canManageTeam && (
                  <Box component="form" onSubmit={handleInvite} sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 1.5 }}>
                      Invite New Member
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <TextField
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@example.com"
                        size="small"
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={inviting}
                          startIcon={<UserPlus className="w-4 h-4" />}
                          sx={{
                            px: 3,
                            borderRadius: 2,
                            whiteSpace: 'nowrap',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5568d3 0%, #6b3fa0 100%)',
                            },
                          }}
                        >
                          {inviting ? 'Inviting...' : 'Invite'}
                        </Button>
                      </motion.div>
                    </Box>
                  </Box>
                )}

                {/* Invitations List */}
                {invitations.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                    No invitations yet
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {invitations.map((invitation, index) => {
                      const getStatusColor = () => {
                        switch (invitation.status) {
                          case 'accepted': return 'success';
                          case 'pending': return 'warning';
                          case 'expired': return 'error';
                          default: return 'default';
                        }
                      };

                      const getStatusLabel = () => {
                        switch (invitation.status) {
                          case 'accepted': return 'Accepted';
                          case 'pending': return 'Pending';
                          case 'expired': return 'Expired';
                          default: return invitation.status;
                        }
                      };

                      const isPending = invitation.status === 'pending';

                      return (
                        <Fade key={invitation.id} in={true} timeout={700 + index * 100}>
                          <motion.div
                            whileHover={{ scale: 1.01, x: 4 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                bgcolor: invitation.status === 'accepted' ? 'success.50' : 'grey.50',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: invitation.status === 'accepted' ? 'success.200' : 'grey.200',
                                opacity: invitation.status === 'expired' ? 0.6 : 1,
                                '&:hover': {
                                  bgcolor: invitation.status === 'accepted' ? 'success.100' : 'grey.100',
                                },
                                transition: 'all 0.2s',
                              }}
                            >
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="body1" fontWeight={600}>
                                    {invitation.email}
                                  </Typography>
                                  <Chip
                                    label={getStatusLabel()}
                                    size="small"
                                    color={getStatusColor()}
                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 500 }}
                                  />
                                </Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Invited by {invitation.invited_by_name || 'Unknown'}
                                </Typography>
                                {invitation.status === 'accepted' && invitation.accepted_by_name && (
                                  <Typography variant="caption" color="success.main" display="block" fontWeight={500}>
                                    ✓ Accepted by {invitation.accepted_by_name}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.disabled" display="block">
                                  {invitation.status === 'expired' ? 'Expired' : 'Expires'} {formatDate(invitation.expires_at)}
                                </Typography>
                              </Box>
                              {canManageTeam && isPending && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <IconButton
                                      onClick={() => handleResendInvitation(invitation.id)}
                                      color="primary"
                                      size="small"
                                      title="Resend invitation"
                                      sx={{
                                        bgcolor: 'primary.50',
                                        '&:hover': { bgcolor: 'primary.100' },
                                      }}
                                    >
                                      <RotateCw className="w-4 h-4" />
                                    </IconButton>
                                  </motion.div>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <IconButton
                                      onClick={() => handleCancelInvitation(invitation.id)}
                                      color="error"
                                      size="small"
                                      title="Cancel invitation"
                                      sx={{
                                        bgcolor: 'error.50',
                                        '&:hover': { bgcolor: 'error.100' },
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </IconButton>
                                  </motion.div>
                                </Box>
                              )}
                            </Box>
                          </motion.div>
                        </Fade>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grow>
        </Box>

        {/* My Team Memberships Section */}
        {myMemberships.length > 0 && (
          <Grow in={true} timeout={1100}>
            <Card elevation={2} sx={{ borderRadius: 2, mb: 4 }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Users className="w-5 h-5 text-gray-700" />
                  <Typography variant="h6" fontWeight="bold">
                    Other Teams I'm In ({myMemberships.length})
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Teams where you have been added by other members
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {myMemberships.map((membership, index) => (
                    <Fade key={membership.id} in={true} timeout={700 + index * 100}>
                      <motion.div
                        whileHover={{ scale: 1.01, x: 4 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2.5,
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'grey.200',
                            '&:hover': {
                              bgcolor: 'grey.100',
                              borderColor: 'grey.300',
                            },
                            transition: 'all 0.2s',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                            <Avatar
                              sx={{
                                width: 48,
                                height: 48,
                                bgcolor: 'secondary.100',
                              }}
                            >
                              <Users className="w-5 h-5 text-purple-600" />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight={600} gutterBottom>
                                {membership.team_name}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <User className="w-3.5 h-3.5 text-gray-400" />
                                  <Typography variant="caption" color="text.secondary">
                                    Invited by: {membership.invited_by_name || 'Unknown'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                  <Typography variant="caption" color="text.secondary">
                                    Joined {formatDate(membership.joined_at)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => handleLeaveTeam(membership.team_id, membership.team_name)}
                              variant="outlined"
                              color="error"
                              startIcon={<LogOut className="w-4 h-4" />}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 500,
                                px: 2,
                              }}
                            >
                              Leave Team
                            </Button>
                          </motion.div>
                        </Box>
                      </motion.div>
                    </Fade>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grow>
        )}

        {/* Info Box */}
        <Fade in={true} timeout={1200}>
          <Alert
            severity="info"
            icon={<Info className="w-5 h-5" />}
            sx={{
              borderRadius: 2,
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>Team Access</AlertTitle>
            <Typography variant="body2">
              All team members can view and access all reports, templates, and analyses. Only team
              owners can invite or remove members.
            </Typography>
          </Alert>
        </Fade>
      </div>
      </div>
    </Layout>
  );
};
