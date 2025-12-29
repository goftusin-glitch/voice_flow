import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { InvitationModal } from './InvitationModal';
import { teamsService, PendingInvitation } from '../../services/teamsService';
import { useToast } from './CustomToast';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const toast = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<PendingInvitation | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [checkedInvitations, setCheckedInvitations] = useState(false);

  useEffect(() => {
    // Check for pending invitations when the layout mounts
    const checkPendingInvitations = async () => {
      try {
        const invitations = await teamsService.getMyPendingInvitations();
        if (invitations.length > 0) {
          // Show the first pending invitation
          setPendingInvitation(invitations[0]);
        }
      } catch (error: any) {
        // Silently fail - user might not have any invitations
        console.log('No pending invitations or error checking:', error);
      } finally {
        setCheckedInvitations(true);
      }
    };

    if (!checkedInvitations) {
      checkPendingInvitations();
    }
  }, [checkedInvitations]);

  const handleAcceptInvitation = async (invitationToken: string) => {
    try {
      setAccepting(true);
      await teamsService.acceptInvitation(invitationToken);
      toast.success('Successfully joined the team!');
      setPendingInvitation(null);

      // Reload the page to refresh team data
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvitation = async (invitationToken: string) => {
    try {
      setAccepting(true);
      await teamsService.declineInvitation(invitationToken);
      toast.success('Invitation declined');
      setPendingInvitation(null);

      // Check if there are more invitations
      const invitations = await teamsService.getMyPendingInvitations();
      if (invitations.length > 0) {
        setPendingInvitation(invitations[0]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Fixed Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto pt-20">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Invitation Modal */}
      <InvitationModal
        invitation={pendingInvitation}
        onAccept={handleAcceptInvitation}
        onDecline={handleDeclineInvitation}
        loading={accepting}
      />
    </div>
  );
};
