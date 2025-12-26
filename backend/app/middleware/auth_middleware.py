from functools import wraps
from flask import request, jsonify
from app.services.auth_service import AuthService
from app.models.user import User

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid token format'
                }), 401

        if not token:
            return jsonify({
                'success': False,
                'message': 'Token is missing'
            }), 401

        try:
            # Verify token and get user_id
            user_id = AuthService.verify_access_token(token)
            current_user = User.query.get(user_id)

            if not current_user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 401

            if not current_user.is_active:
                return jsonify({
                    'success': False,
                    'message': 'Account is deactivated'
                }), 401

        except ValueError as e:
            return jsonify({
                'success': False,
                'message': str(e)
            }), 401

        # Pass current_user to the route function
        return f(current_user, *args, **kwargs)

    return decorated
