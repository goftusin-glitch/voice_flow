from app import db
from app.models.team import Team, TeamMember, TeamInvitation
from app.models.user import User
from app.services.email_service import EmailService
from flask import current_app
from datetime import datetime, timedelta


class TeamService:
    @staticmethod
    def create_team(user_id, team_name):
        """Create a new team and add the creator as owner"""
        # Create team
        team = Team(
            name=team_name,
            owner_id=user_id
        )
        db.session.add(team)
        db.session.flush()  # Get team ID

        # Add creator as team member with owner role
        team_member = TeamMember(
            team_id=team.id,
            user_id=user_id,
            role='owner'
        )
        db.session.add(team_member)
        db.session.commit()

        return team

    @staticmethod
    def get_user_team(user_id):
        """Get the team for a user"""
        team_member = TeamMember.query.filter_by(user_id=user_id).first()
        if not team_member:
            return None
        return Team.query.get(team_member.team_id)

    @staticmethod
    def get_team_members(team_id):
        """Get all members of a team"""
        team_members = TeamMember.query.filter_by(team_id=team_id).all()

        members_list = []
        for tm in team_members:
            user = User.query.get(tm.user_id)
            if user:
                member_dict = tm.to_dict()
                member_dict['name'] = f"{user.first_name} {user.last_name}"
                member_dict['email'] = user.email
                members_list.append(member_dict)

        return members_list

    @staticmethod
    def invite_member(team_id, email, invited_by_user_id):
        """Invite a new member to the team"""
        # Check if user already invited
        existing_invitation = TeamInvitation.query.filter_by(
            team_id=team_id,
            email=email,
            status='pending'
        ).first()

        if existing_invitation and not existing_invitation.is_expired():
            raise ValueError("User already has a pending invitation")

        # Check if user is already a member
        user = User.query.filter_by(email=email).first()
        if user:
            existing_member = TeamMember.query.filter_by(
                team_id=team_id,
                user_id=user.id
            ).first()
            if existing_member:
                raise ValueError("User is already a team member")

        # Create invitation
        invitation = TeamInvitation.create_invitation(
            team_id=team_id,
            email=email,
            invited_by=invited_by_user_id
        )
        db.session.add(invitation)
        db.session.commit()

        # Send invitation email
        team = Team.query.get(team_id)
        inviter = User.query.get(invited_by_user_id)
        inviter_name = f"{inviter.first_name} {inviter.last_name}" if inviter else "A team member"

        invitation_link = f"{current_app.config['FRONTEND_URL']}/register?token={invitation.invitation_token}"

        # Send invitation email (don't fail if email service is not configured)
        try:
            if current_app.config.get('MAIL_USERNAME') and current_app.config.get('MAIL_PASSWORD'):
                EmailService.send_team_invitation(
                    email=email,
                    team_name=team.name,
                    inviter_name=inviter_name,
                    invitation_link=invitation_link
                )
                print(f"Invitation email sent successfully to {email}")
            else:
                print(f"SMTP email service not configured. Invitation link: {invitation_link}")
        except Exception as e:
            print(f"Error sending invitation email: {str(e)}")
            print(f"Invitation created but email failed. Manual link: {invitation_link}")
            # Don't fail the invitation if email fails

        return invitation

    @staticmethod
    def accept_invitation(invitation_token, user_id):
        """Accept a team invitation"""
        invitation = TeamInvitation.query.filter_by(
            invitation_token=invitation_token
        ).first()

        if not invitation:
            raise ValueError("Invalid invitation token")

        if invitation.status != 'pending':
            raise ValueError("Invitation has already been used")

        if invitation.is_expired():
            invitation.status = 'expired'
            db.session.commit()
            raise ValueError("Invitation has expired")

        # Check if user is already a member
        existing_member = TeamMember.query.filter_by(
            team_id=invitation.team_id,
            user_id=user_id
        ).first()

        if existing_member:
            # Mark invitation as accepted anyway
            invitation.status = 'accepted'
            db.session.commit()
            print(f"User {user_id} already a member of team {invitation.team_id}, marked invitation as accepted")
            return invitation.team_id

        # Add user to team
        team_member = TeamMember(
            team_id=invitation.team_id,
            user_id=user_id,
            role='member'
        )
        db.session.add(team_member)

        # Update invitation status
        invitation.status = 'accepted'

        # Flush to ensure the team member is added before committing
        db.session.flush()
        db.session.commit()

        print(f"User {user_id} successfully joined team {invitation.team_id} as member")

        # Verify the membership was created
        verification = TeamMember.query.filter_by(
            team_id=invitation.team_id,
            user_id=user_id
        ).first()

        if not verification:
            raise ValueError("Failed to create team membership")

        return invitation.team_id

    @staticmethod
    def remove_member(team_id, member_id, requester_user_id):
        """Remove a member from the team"""
        # Check if requester is owner
        requester_member = TeamMember.query.filter_by(
            team_id=team_id,
            user_id=requester_user_id
        ).first()

        if not requester_member or requester_member.role != 'owner':
            raise ValueError("Only team owners can remove members")

        # Get member to remove
        member = TeamMember.query.filter_by(
            team_id=team_id,
            user_id=member_id
        ).first()

        if not member:
            raise ValueError("Member not found in team")

        # Cannot remove owner
        if member.role == 'owner':
            raise ValueError("Cannot remove team owner")

        db.session.delete(member)
        db.session.commit()

        return True

    @staticmethod
    def get_pending_invitations(team_id):
        """Get all invitations for a team (pending, accepted, expired)"""
        # Get all invitations for the team, ordered by creation date descending
        invitations = TeamInvitation.query.filter_by(
            team_id=team_id
        ).order_by(TeamInvitation.created_at.desc()).all()

        invitation_list = []
        for inv in invitations:
            # Update status to expired if needed
            if inv.status == 'pending' and inv.is_expired():
                inv.status = 'expired'

            inv_dict = inv.to_dict()
            inviter = User.query.get(inv.invited_by)
            if inviter:
                inv_dict['invited_by_name'] = f"{inviter.first_name} {inviter.last_name}"

            # If accepted, add the user's name who accepted
            if inv.status == 'accepted':
                user = User.query.filter_by(email=inv.email).first()
                if user:
                    inv_dict['accepted_by_name'] = f"{user.first_name} {user.last_name}"

            invitation_list.append(inv_dict)

        db.session.commit()
        return invitation_list

    @staticmethod
    def resend_invitation(invitation_id, team_id):
        """Resend an invitation email"""
        invitation = TeamInvitation.query.filter_by(
            id=invitation_id,
            team_id=team_id
        ).first()

        if not invitation:
            raise ValueError("Invitation not found")

        if invitation.status != 'pending':
            raise ValueError("Cannot resend non-pending invitation")

        # Generate new token and extend expiration
        invitation.invitation_token = TeamInvitation.generate_token()
        invitation.expires_at = datetime.utcnow() + timedelta(days=7)
        db.session.commit()

        # Send email
        team = Team.query.get(team_id)
        inviter = User.query.get(invitation.invited_by)
        inviter_name = f"{inviter.first_name} {inviter.last_name}" if inviter else "A team member"

        invitation_link = f"{current_app.config['FRONTEND_URL']}/register?token={invitation.invitation_token}"

        # Send invitation email (don't fail if email service is not configured)
        try:
            if current_app.config.get('MAIL_USERNAME') and current_app.config.get('MAIL_PASSWORD'):
                EmailService.send_team_invitation(
                    email=invitation.email,
                    team_name=team.name,
                    inviter_name=inviter_name,
                    invitation_link=invitation_link
                )
                print(f"Resent invitation email to {invitation.email}")
            else:
                print(f"SMTP email service not configured. Invitation link: {invitation_link}")
        except Exception as e:
            print(f"Error resending invitation email: {str(e)}")
            print(f"Manual link: {invitation_link}")

        return invitation

    @staticmethod
    def cancel_invitation(invitation_id, team_id, requester_user_id):
        """Cancel a pending invitation"""
        # Check if requester is owner
        requester_member = TeamMember.query.filter_by(
            team_id=team_id,
            user_id=requester_user_id
        ).first()

        if not requester_member or requester_member.role != 'owner':
            raise ValueError("Only team owners can cancel invitations")

        invitation = TeamInvitation.query.filter_by(
            id=invitation_id,
            team_id=team_id
        ).first()

        if not invitation:
            raise ValueError("Invitation not found")

        db.session.delete(invitation)
        db.session.commit()

        return True

    @staticmethod
    def update_team(team_id, user_id, team_name):
        """Update team information"""
        # Check if user is owner
        team_member = TeamMember.query.filter_by(
            team_id=team_id,
            user_id=user_id
        ).first()

        if not team_member or team_member.role != 'owner':
            raise ValueError("Only team owners can update team information")

        team = Team.query.get(team_id)
        if not team:
            raise ValueError("Team not found")

        team.name = team_name
        team.updated_at = datetime.utcnow()
        db.session.commit()

        return team

    @staticmethod
    def get_user_memberships(user_id):
        """Get all teams where the user is a member (not owner)"""
        team_members = TeamMember.query.filter_by(user_id=user_id).all()

        memberships = []
        for tm in team_members:
            team = Team.query.get(tm.team_id)
            if team and tm.role != 'owner':  # Only include teams where user is not the owner
                membership_dict = {
                    'id': tm.id,
                    'team_id': team.id,
                    'team_name': team.name,
                    'role': tm.role,
                    'joined_at': tm.joined_at.isoformat() if tm.joined_at else None
                }

                # Find who invited this user (look for accepted invitation)
                invitation = TeamInvitation.query.filter_by(
                    team_id=team.id,
                    status='accepted'
                ).join(User, User.email == TeamInvitation.email).filter(
                    User.id == user_id
                ).first()

                if invitation:
                    inviter = User.query.get(invitation.invited_by)
                    if inviter:
                        membership_dict['invited_by_name'] = f"{inviter.first_name} {inviter.last_name}"
                        membership_dict['invited_by_email'] = inviter.email
                else:
                    membership_dict['invited_by_name'] = 'Unknown'
                    membership_dict['invited_by_email'] = None

                memberships.append(membership_dict)

        return memberships

    @staticmethod
    def leave_team(team_id, user_id):
        """Leave a team (for non-owner members)"""
        team_member = TeamMember.query.filter_by(
            team_id=team_id,
            user_id=user_id
        ).first()

        if not team_member:
            raise ValueError("You are not a member of this team")

        if team_member.role == 'owner':
            raise ValueError("Team owners cannot leave their team. Please transfer ownership or delete the team.")

        db.session.delete(team_member)
        db.session.commit()

        return True
