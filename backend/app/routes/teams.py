from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import token_required
from app.services.team_service import TeamService
from app.models.team import TeamMember
from app import db

teams_bp = Blueprint('teams', __name__)


def get_user_team_id(user_id):
    """Get the team ID for a user"""
    team_member = TeamMember.query.filter_by(user_id=user_id).first()
    if not team_member:
        raise ValueError("User is not part of any team")
    return team_member.team_id


@teams_bp.route('', methods=['GET'])
@token_required
def get_team(current_user):
    """Get the user's team information"""
    try:
        team = TeamService.get_user_team(current_user.id)

        if not team:
            return jsonify({
                'success': False,
                'message': 'User is not part of any team'
            }), 404

        return jsonify({
            'success': True,
            'data': {'team': team.to_dict()}
        }), 200

    except Exception as e:
        print(f"Error getting team: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get team'
        }), 500


@teams_bp.route('/members', methods=['GET'])
@token_required
def get_members(current_user):
    """Get all members of the user's team"""
    try:
        team_id = get_user_team_id(current_user.id)
        members = TeamService.get_team_members(team_id)

        return jsonify({
            'success': True,
            'data': {'members': members}
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error getting team members: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get team members'
        }), 500


@teams_bp.route('/invite', methods=['POST'])
@token_required
def invite_member(current_user):
    """Invite a new member to the team"""
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({
                'success': False,
                'message': 'Email is required'
            }), 400

        team_id = get_user_team_id(current_user.id)

        invitation = TeamService.invite_member(
            team_id=team_id,
            email=email,
            invited_by_user_id=current_user.id
        )

        invitation_link = f"{request.host_url}register?token={invitation.invitation_token}"

        return jsonify({
            'success': True,
            'data': {
                'invitation_id': invitation.id,
                'email': email,
                'invitation_link': invitation_link
            }
        }), 201

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error inviting member: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to send invitation'
        }), 500


@teams_bp.route('/invitations', methods=['GET'])
@token_required
def get_invitations(current_user):
    """Get all invitations for the team (pending, accepted, expired)"""
    try:
        team_id = get_user_team_id(current_user.id)
        invitations = TeamService.get_pending_invitations(team_id)

        return jsonify({
            'success': True,
            'data': {'invitations': invitations}
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error getting invitations: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get invitations'
        }), 500


@teams_bp.route('/invitations/<int:invitation_id>/resend', methods=['POST'])
@token_required
def resend_invitation(current_user, invitation_id):
    """Resend an invitation email"""
    try:
        team_id = get_user_team_id(current_user.id)

        invitation = TeamService.resend_invitation(
            invitation_id=invitation_id,
            team_id=team_id
        )

        return jsonify({
            'success': True,
            'message': 'Invitation resent successfully'
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error resending invitation: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to resend invitation'
        }), 500


@teams_bp.route('/invitations/<int:invitation_id>', methods=['DELETE'])
@token_required
def cancel_invitation(current_user, invitation_id):
    """Cancel a pending invitation"""
    try:
        team_id = get_user_team_id(current_user.id)

        TeamService.cancel_invitation(
            invitation_id=invitation_id,
            team_id=team_id,
            requester_user_id=current_user.id
        )

        return jsonify({
            'success': True,
            'message': 'Invitation cancelled successfully'
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error cancelling invitation: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to cancel invitation'
        }), 500


@teams_bp.route('/members/<int:member_id>', methods=['DELETE'])
@token_required
def remove_member(current_user, member_id):
    """Remove a member from the team"""
    try:
        team_id = get_user_team_id(current_user.id)

        TeamService.remove_member(
            team_id=team_id,
            member_id=member_id,
            requester_user_id=current_user.id
        )

        return jsonify({
            'success': True,
            'message': 'Member removed successfully'
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error removing member: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to remove member'
        }), 500


@teams_bp.route('', methods=['PUT'])
@token_required
def update_team(current_user):
    """Update team information"""
    try:
        data = request.get_json()
        team_name = data.get('name')

        if not team_name:
            return jsonify({
                'success': False,
                'message': 'Team name is required'
            }), 400

        team_id = get_user_team_id(current_user.id)

        team = TeamService.update_team(
            team_id=team_id,
            user_id=current_user.id,
            team_name=team_name
        )

        return jsonify({
            'success': True,
            'data': {'team': team.to_dict()}
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error updating team: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update team'
        }), 500


@teams_bp.route('/pending-invitations-for-me', methods=['GET'])
@token_required
def get_my_pending_invitations(current_user):
    """Get pending invitations for the current user's email"""
    try:
        from app.models.team import TeamInvitation, Team

        # Find pending invitations for this user's email
        invitations = TeamInvitation.query.filter_by(
            email=current_user.email,
            status='pending'
        ).all()

        invitation_list = []
        for inv in invitations:
            if not inv.is_expired():
                team = Team.query.get(inv.team_id)
                from app.models.user import User
                inviter = User.query.get(inv.invited_by)

                invitation_list.append({
                    'id': inv.id,
                    'team_id': inv.team_id,
                    'team_name': team.name if team else 'Unknown Team',
                    'invitation_token': inv.invitation_token,
                    'invited_by_name': f"{inviter.first_name} {inviter.last_name}" if inviter else 'Unknown',
                    'invited_by_email': inviter.email if inviter else '',
                    'created_at': inv.created_at.isoformat() if inv.created_at else None,
                    'expires_at': inv.expires_at.isoformat() if inv.expires_at else None
                })
            else:
                # Mark as expired
                inv.status = 'expired'

        db.session.commit()

        return jsonify({
            'success': True,
            'data': {'invitations': invitation_list}
        }), 200

    except Exception as e:
        print(f"Error getting pending invitations: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to get pending invitations'
        }), 500


@teams_bp.route('/accept-invitation', methods=['POST'])
@token_required
def accept_invitation(current_user):
    """Accept a team invitation for the current user"""
    try:
        data = request.get_json()
        invitation_token = data.get('invitation_token')

        if not invitation_token:
            return jsonify({
                'success': False,
                'message': 'Invitation token is required'
            }), 400

        team_id = TeamService.accept_invitation(
            invitation_token=invitation_token,
            user_id=current_user.id
        )

        return jsonify({
            'success': True,
            'data': {'team_id': team_id},
            'message': 'Successfully joined the team!'
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error accepting invitation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to accept invitation'
        }), 500


@teams_bp.route('/decline-invitation', methods=['POST'])
@token_required
def decline_invitation(current_user):
    """Decline a team invitation for the current user"""
    try:
        data = request.get_json()
        invitation_token = data.get('invitation_token')

        if not invitation_token:
            return jsonify({
                'success': False,
                'message': 'Invitation token is required'
            }), 400

        from app.models.team import TeamInvitation

        invitation = TeamInvitation.query.filter_by(
            invitation_token=invitation_token,
            email=current_user.email
        ).first()

        if not invitation:
            return jsonify({
                'success': False,
                'message': 'Invitation not found'
            }), 404

        # Delete the invitation
        db.session.delete(invitation)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Invitation declined'
        }), 200

    except Exception as e:
        print(f"Error declining invitation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to decline invitation'
        }), 500


@teams_bp.route('/my-memberships', methods=['GET'])
@token_required
def get_my_memberships(current_user):
    """Get all teams where the current user is a member"""
    try:
        memberships = TeamService.get_user_memberships(current_user.id)

        return jsonify({
            'success': True,
            'data': {'memberships': memberships}
        }), 200

    except Exception as e:
        print(f"Error getting user memberships: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get team memberships'
        }), 500


@teams_bp.route('/all-my-teams', methods=['GET'])
@token_required
def get_all_my_teams(current_user):
    """Get all teams where the current user is a member (including owned teams)"""
    try:
        from app.models.team import Team

        # Get all team memberships for the user
        team_members = TeamMember.query.filter_by(user_id=current_user.id).all()

        teams_list = []
        for tm in team_members:
            team = Team.query.get(tm.team_id)
            if team:
                teams_list.append({
                    'team_id': team.id,
                    'team_name': team.name,
                    'role': tm.role,
                    'is_owner': tm.role == 'owner',
                    'joined_at': tm.joined_at.isoformat() if tm.joined_at else None
                })

        return jsonify({
            'success': True,
            'data': {'teams': teams_list}
        }), 200

    except Exception as e:
        print(f"Error getting user teams: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to get user teams'
        }), 500


@teams_bp.route('/leave/<int:team_id>', methods=['DELETE'])
@token_required
def leave_team(current_user, team_id):
    """Leave a team (for non-owner members)"""
    try:
        TeamService.leave_team(
            team_id=team_id,
            user_id=current_user.id
        )

        return jsonify({
            'success': True,
            'message': 'Successfully left the team'
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error leaving team: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to leave team'
        }), 500
