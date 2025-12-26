import React, { useState } from 'react';
import { PendingInvitation } from '../../services/teamsService';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Card, CardContent, Avatar, Chip } from '@mui/material';
import { Users, Mail, Calendar, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InvitationModalProps {
  invitation: PendingInvitation | null;
  onAccept: (invitationToken: string) => void;
  onDecline: (invitationToken: string) => void;
  loading?: boolean;
}

export const InvitationModal: React.FC<InvitationModalProps> = ({
  invitation,
  onAccept,
  onDecline,
  loading = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!invitation) return null;

  return (
    <Dialog
      open={!!invitation}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <UserPlus className="w-6 h-6 text-white" />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Team Invitation
            </Typography>
            <Typography variant="caption" color="text.secondary">
              You've been invited to join a team
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'grey.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Team Name */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Users className="w-4 h-4 text-gray-500" />
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Team Name
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {invitation.team_name}
                </Typography>
              </Box>

              {/* Invited By */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Mail className="w-4 h-4 text-gray-500" />
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Invited By
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={500}>
                  {invitation.invited_by_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invitation.invited_by_email}
                </Typography>
              </Box>

              {/* Invitation Date */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Invitation Date
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {formatDate(invitation.created_at)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'info.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'info.200',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            By accepting this invitation, you'll gain access to all reports, templates, and analyses
            shared within <strong>{invitation.team_name}</strong>.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ flex: 1 }}
        >
          <Button
            onClick={() => onDecline(invitation.invitation_token)}
            variant="outlined"
            color="error"
            disabled={loading}
            fullWidth
            startIcon={<X className="w-4 h-4" />}
            sx={{
              borderRadius: 2,
              py: 1.2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Decline
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ flex: 1 }}
        >
          <Button
            onClick={() => onAccept(invitation.invitation_token)}
            variant="contained"
            disabled={loading}
            fullWidth
            startIcon={<UserPlus className="w-4 h-4" />}
            sx={{
              borderRadius: 2,
              py: 1.2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6b3fa0 100%)',
              },
            }}
          >
            {loading ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </motion.div>
      </DialogActions>
    </Dialog>
  );
};
