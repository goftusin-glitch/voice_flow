from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests
from flask import current_app, url_for
import os


class GoogleAuthService:
    @staticmethod
    def get_google_auth_flow():
        """
        Create and return Google OAuth flow

        Returns:
            Flow: Google OAuth flow object
        """
        client_id = current_app.config.get('GOOGLE_CLIENT_ID')
        client_secret = current_app.config.get('GOOGLE_CLIENT_SECRET')

        if not client_id or not client_secret:
            raise ValueError("Google OAuth credentials not configured")

        # Create flow instance
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [current_app.config.get('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/auth/google/callback')]
                }
            },
            scopes=[
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
                'openid'
            ]
        )

        flow.redirect_uri = current_app.config.get('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/auth/google/callback')

        return flow

    @staticmethod
    def get_authorization_url():
        """
        Get Google OAuth authorization URL

        Returns:
            str: Authorization URL to redirect user to
        """
        flow = GoogleAuthService.get_google_auth_flow()
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='select_account'
        )

        return authorization_url, state

    @staticmethod
    def get_user_info_from_callback(authorization_response: str, state: str = None) -> dict:
        """
        Exchange authorization code for tokens and get user info

        Args:
            authorization_response: Full callback URL with code
            state: OAuth state parameter for CSRF protection

        Returns:
            dict: User information from Google

        Raises:
            ValueError: If token exchange fails
        """
        try:
            flow = GoogleAuthService.get_google_auth_flow()

            # Exchange authorization code for tokens
            flow.fetch_token(authorization_response=authorization_response)

            # Get credentials
            credentials = flow.credentials

            # Verify the ID token
            idinfo = id_token.verify_oauth2_token(
                credentials.id_token,
                requests.Request(),
                current_app.config.get('GOOGLE_CLIENT_ID')
            )

            # Verify the issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer')

            # Return user info
            return {
                'google_id': idinfo['sub'],
                'email': idinfo['email'],
                'email_verified': idinfo.get('email_verified', False),
                'name': idinfo.get('name', ''),
                'given_name': idinfo.get('given_name', ''),
                'family_name': idinfo.get('family_name', ''),
                'picture': idinfo.get('picture', '')
            }

        except Exception as e:
            raise ValueError(f"Failed to get user info: {str(e)}")
