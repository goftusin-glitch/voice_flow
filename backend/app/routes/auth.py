from flask import Blueprint, request, jsonify, redirect, session
from app.services.auth_service import AuthService
from app.services.google_auth_service import GoogleAuthService
from app.middleware.auth_middleware import token_required
from app.models.user import User
import os

auth_bp = Blueprint('auth', __name__)

# Disable HTTPS requirement for development (remove in production)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400

        # Register user
        result = AuthService.register_user(
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', '')
        )

        return jsonify({
            'success': True,
            'data': result
        }), 201

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Registration failed'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400

        # Login user
        result = AuthService.login_user(
            email=data['email'],
            password=data['password']
        )

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 401
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Login failed: {str(e)}'
        }), 500

@auth_bp.route('/google/login', methods=['GET'])
def google_login():
    """Initiate Google OAuth flow"""
    try:
        from flask import current_app

        # Debug: Print configuration
        print("=" * 80)
        print("Google OAuth Configuration:")
        print(f"GOOGLE_CLIENT_ID: {current_app.config.get('GOOGLE_CLIENT_ID')}")
        print(f"GOOGLE_CLIENT_SECRET: {'***' if current_app.config.get('GOOGLE_CLIENT_SECRET') else 'NOT SET'}")
        print(f"GOOGLE_REDIRECT_URI: {current_app.config.get('GOOGLE_REDIRECT_URI')}")
        print("=" * 80)

        # Get authorization URL and state
        authorization_url, state = GoogleAuthService.get_authorization_url()

        print(f"Generated authorization URL: {authorization_url}")
        print(f"State: {state}")

        # Store state in session for CSRF protection
        session['oauth_state'] = state

        # Redirect user to Google's OAuth page
        return redirect(authorization_url)

    except Exception as e:
        print(f"Google OAuth initiation error: {str(e)}")
        import traceback
        traceback.print_exc()
        # Redirect to frontend login page with error
        from flask import current_app
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/login?error=google_oauth_failed")

@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        print("=" * 80)
        print("Google OAuth Callback Received")
        print(f"Full URL: {request.url}")
        print(f"Args: {request.args}")
        print("=" * 80)

        # Get the full callback URL
        authorization_response = request.url

        # Get state from session
        state = session.get('oauth_state')
        print(f"Session state: {state}")

        # Get user info from Google
        google_user_info = GoogleAuthService.get_user_info_from_callback(
            authorization_response=authorization_response,
            state=state
        )

        print(f"Google user info received: {google_user_info.get('email')}")

        # Clear state from session
        session.pop('oauth_state', None)

        # Authenticate or create user
        result = AuthService.google_login(google_user_info)

        print(f"User authenticated/created: {result['user']['email']}")

        # Redirect to frontend with tokens in URL params
        from flask import current_app
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')

        # Encode tokens in URL
        access_token = result['access_token']
        refresh_token = result['refresh_token']

        redirect_url = f"{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
        print(f"Redirecting to: {redirect_url}")
        print("=" * 80)

        return redirect(redirect_url)

    except Exception as e:
        print(f"Google OAuth callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        # Redirect to frontend login page with error
        from flask import current_app
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/login?error=google_auth_failed")

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token"""
    try:
        data = request.get_json()

        if not data.get('refresh_token'):
            return jsonify({
                'success': False,
                'message': 'Refresh token is required'
            }), 400

        # Refresh tokens
        result = AuthService.refresh_access_token(data['refresh_token'])

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 401
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Token refresh failed'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout user"""
    try:
        data = request.get_json()

        if data.get('refresh_token'):
            AuthService.logout_user(data['refresh_token'])

        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Logout failed'
        }), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current user information"""
    return jsonify({
        'success': True,
        'data': current_user.to_dict()
    }), 200
