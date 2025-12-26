from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import token_required
from app.services.dashboard_service import DashboardService
from app.models.team import TeamMember, Team
from app import db

dashboard_bp = Blueprint('dashboard', __name__)


def get_user_team_id(user_id):
    """Get the team ID for a user, create team if doesn't exist"""
    team_member = TeamMember.query.filter_by(user_id=user_id).first()

    if not team_member:
        # Create a default team for the user
        from app.models.user import User
        user = User.query.get(user_id)

        team = Team(
            name=f"{user.first_name}'s Team",
            owner_id=user_id
        )
        db.session.add(team)
        db.session.flush()

        team_member = TeamMember(
            team_id=team.id,
            user_id=user_id,
            role='owner'
        )
        db.session.add(team_member)
        db.session.commit()

        return team.id

    return team_member.team_id


@dashboard_bp.route('/metrics', methods=['GET'])
@token_required
def get_metrics(current_user):
    """Get dashboard metrics"""
    try:
        team_id = get_user_team_id(current_user.id)
        metrics = DashboardService.get_metrics(team_id)

        return jsonify({
            'success': True,
            'data': metrics
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error getting metrics: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get metrics'
        }), 500


@dashboard_bp.route('/recent-activity', methods=['GET'])
@token_required
def get_recent_activity(current_user):
    """Get recent activity"""
    try:
        team_id = get_user_team_id(current_user.id)
        limit = request.args.get('limit', 10, type=int)

        activities = DashboardService.get_recent_activity(team_id, limit)

        return jsonify({
            'success': True,
            'data': {'activities': activities}
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error getting recent activity: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get recent activity'
        }), 500


@dashboard_bp.route('/analytics', methods=['GET'])
@token_required
def get_analytics(current_user):
    """Get analytics data for charts"""
    try:
        team_id = get_user_team_id(current_user.id)
        days = request.args.get('days', 30, type=int)

        analytics = DashboardService.get_analytics_data(team_id, days)

        return jsonify({
            'success': True,
            'data': analytics
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error getting analytics: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get analytics'
        }), 500
