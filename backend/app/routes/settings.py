from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import token_required
from app import db
from app.models.user import User

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get user profile"""
    try:
        return jsonify({
            'success': True,
            'data': current_user.to_dict()
        }), 200

    except Exception as e:
        print(f"Error getting profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get profile'
        }), 500


@settings_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile"""
    try:
        data = request.get_json()

        # Update allowed fields
        if 'first_name' in data:
            current_user.first_name = data['first_name']

        if 'last_name' in data:
            current_user.last_name = data['last_name']

        if 'phone' in data:
            current_user.phone = data['phone']

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'data': current_user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update profile'
        }), 500


@settings_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change user password"""
    try:
        data = request.get_json()

        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not current_password or not new_password:
            return jsonify({
                'success': False,
                'message': 'Current password and new password are required'
            }), 400

        # Verify current password
        if not current_user.check_password(current_password):
            return jsonify({
                'success': False,
                'message': 'Current password is incorrect'
            }), 401

        # Validate new password strength
        if len(new_password) < 8:
            return jsonify({
                'success': False,
                'message': 'Password must be at least 8 characters long'
            }), 400

        # Update password
        current_user.set_password(new_password)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error changing password: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to change password'
        }), 500
