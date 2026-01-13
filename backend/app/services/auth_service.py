import jwt
from datetime import datetime, timedelta
from app import db
from app.models.user import User, RefreshToken
from app.models.team import Team, TeamMember
from flask import current_app
from app.services.google_auth_service import GoogleAuthService

class AuthService:
    @staticmethod
    def register_user(email, password, first_name, last_name, invitation_token=None):
        """Register a new user"""
        from app.models.team import TeamInvitation

        # Check if user exists
        if User.query.filter_by(email=email).first():
            raise ValueError("Email already exists")

        # If invitation token provided, validate it but DON'T accept yet
        if invitation_token:
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

            # Verify the email matches
            if invitation.email.lower() != email.lower():
                raise ValueError("This invitation was sent to a different email address")

            print(f"Valid invitation found for {email}, will prompt after login")

        # Create user
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        user.set_password(password)

        db.session.add(user)
        db.session.flush()  # Flush to get user.id

        # If invitation token provided, accept invitation and join the team
        if invitation_token:
            # Accept the invitation and add user to the invited team
            invitation.status = 'accepted'

            # Add user to the invited team
            team_member = TeamMember(
                team_id=invitation.team_id,
                user_id=user.id,
                role='member'
            )
            db.session.add(team_member)
            db.session.commit()

            print(f"User {user.id} registered and joined team {invitation.team_id} via invitation")
        else:
            # Create a default team for the user (only if no invitation)
            team = Team(
                name=f"{first_name}'s Team",
                owner_id=user.id
            )
            db.session.add(team)
            db.session.flush()

            # Add user as team member with owner role
            team_member = TeamMember(
                team_id=team.id,
                user_id=user.id,
                role='owner'
            )
            db.session.add(team_member)
            db.session.commit()

            print(f"User {user.id} created with own team {team.id}")

        # Generate tokens
        access_token = AuthService.generate_access_token(user.id)
        refresh_token = AuthService.generate_refresh_token(user.id)

        return {
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }

    @staticmethod
    def login_user(email, password):
        """Login user"""
        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            raise ValueError("Invalid email or password")

        if not user.is_active:
            raise ValueError("Account is deactivated")

        # Generate tokens
        access_token = AuthService.generate_access_token(user.id)
        refresh_token = AuthService.generate_refresh_token(user.id)

        return {
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }

    @staticmethod
    def generate_access_token(user_id):
        """Generate JWT access token"""
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
        return token

    @staticmethod
    def generate_refresh_token(user_id):
        """Generate JWT refresh token and store in database"""
        expires_at = datetime.utcnow() + current_app.config['JWT_REFRESH_TOKEN_EXPIRES']

        payload = {
            'user_id': user_id,
            'exp': expires_at,
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

        # Store in database
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        db.session.add(refresh_token)
        db.session.commit()

        return token

    @staticmethod
    def refresh_access_token(refresh_token_str):
        """Generate new access token from refresh token"""
        # Check if token exists and is valid
        refresh_token = RefreshToken.query.filter_by(
            token=refresh_token_str,
            is_revoked=False
        ).first()

        if not refresh_token:
            raise ValueError("Invalid refresh token")

        if refresh_token.expires_at < datetime.utcnow():
            raise ValueError("Refresh token expired")

        # Decode token to get user_id
        try:
            payload = jwt.decode(
                refresh_token_str,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
        except jwt.ExpiredSignatureError:
            raise ValueError("Refresh token expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid refresh token")

        user_id = payload['user_id']

        # Generate new tokens
        new_access_token = AuthService.generate_access_token(user_id)
        new_refresh_token = AuthService.generate_refresh_token(user_id)

        # Revoke old refresh token
        refresh_token.is_revoked = True
        db.session.commit()

        return {
            'access_token': new_access_token,
            'refresh_token': new_refresh_token
        }

    @staticmethod
    def logout_user(refresh_token_str):
        """Logout user by revoking refresh token"""
        refresh_token = RefreshToken.query.filter_by(token=refresh_token_str).first()

        if refresh_token:
            refresh_token.is_revoked = True
            db.session.commit()

    @staticmethod
    def verify_access_token(token):
        """Verify and decode access token"""
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )

            if payload.get('type') != 'access':
                raise ValueError("Invalid token type")

            return payload['user_id']
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")

    @staticmethod
    def google_login(google_user_info):
        """
        Login or register user with Google user info

        Args:
            google_user_info: User information from Google OAuth

        Returns:
            dict: User info and JWT tokens
        """
        try:

            # Check if user exists with this Google ID
            user = User.query.filter_by(google_id=google_user_info['google_id']).first()

            if not user:
                # Check if user exists with this email
                user = User.query.filter_by(email=google_user_info['email']).first()

                if user:
                    # User exists with email but not Google ID - link accounts
                    user.google_id = google_user_info['google_id']
                    user.google_picture = google_user_info.get('picture', '')
                    user.auth_provider = 'google'
                    db.session.commit()
                else:
                    # Create new user
                    user = User(
                        email=google_user_info['email'],
                        first_name=google_user_info.get('given_name', ''),
                        last_name=google_user_info.get('family_name', ''),
                        google_id=google_user_info['google_id'],
                        google_picture=google_user_info.get('picture', ''),
                        auth_provider='google',
                        is_active=True
                    )
                    # No password for Google users
                    user.password_hash = None

                    db.session.add(user)
                    db.session.flush()  # Flush to get user.id

                    # Create a default team for the user
                    team_name = google_user_info.get('given_name', 'User')
                    team = Team(
                        name=f"{team_name}'s Team",
                        owner_id=user.id
                    )
                    db.session.add(team)
                    db.session.flush()  # Flush to get team.id

                    # Add user as team member
                    team_member = TeamMember(
                        team_id=team.id,
                        user_id=user.id,
                        role='owner'
                    )
                    db.session.add(team_member)

                    db.session.commit()

            # Check if user is active
            if not user.is_active:
                raise ValueError("Account is deactivated")

            # Generate tokens
            access_token = AuthService.generate_access_token(user.id)
            refresh_token = AuthService.generate_refresh_token(user.id)

            return {
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token
            }

        except ValueError as e:
            raise e
        except Exception as e:
            raise ValueError(f"Google authentication failed: {str(e)}")
