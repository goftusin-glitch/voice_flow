from app import db
from datetime import datetime, timedelta
import secrets

class Team(db.Model):
    __tablename__ = 'teams'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    members = db.relationship('TeamMember', backref='team', lazy=True, cascade='all, delete-orphan')
    invitations = db.relationship('TeamInvitation', backref='team', lazy=True, cascade='all, delete-orphan')
    templates = db.relationship('ReportTemplate', backref='team', lazy=True, cascade='all, delete-orphan')
    reports = db.relationship('Report', backref='team', lazy=True)
    analyses = db.relationship('CallAnalysis', backref='team', lazy=True)

    def to_dict(self):
        """Convert team to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'owner_id': self.owner_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class TeamMember(db.Model):
    __tablename__ = 'team_members'

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    role = db.Column(db.Enum('owner', 'member', name='member_role'), default='member')
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('team_id', 'user_id', name='unique_team_user'),
    )

    def to_dict(self):
        """Convert team member to dictionary"""
        return {
            'id': self.id,
            'team_id': self.team_id,
            'user_id': self.user_id,
            'role': self.role,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None
        }


class TeamInvitation(db.Model):
    __tablename__ = 'team_invitations'

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False, index=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    invited_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invitation_token = db.Column(db.String(255), unique=True, nullable=False, index=True)
    status = db.Column(
        db.Enum('pending', 'accepted', 'expired', name='invitation_status'),
        default='pending'
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

    # Relationships
    inviter = db.relationship('User', foreign_keys=[invited_by], backref='sent_invitations')

    @staticmethod
    def generate_token():
        """Generate unique invitation token"""
        return secrets.token_urlsafe(32)

    @classmethod
    def create_invitation(cls, team_id, email, invited_by, expires_in_days=7):
        """Create a new team invitation"""
        invitation = cls(
            team_id=team_id,
            email=email,
            invited_by=invited_by,
            invitation_token=cls.generate_token(),
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days)
        )
        return invitation

    def is_expired(self):
        """Check if invitation has expired"""
        return datetime.utcnow() > self.expires_at

    def to_dict(self):
        """Convert invitation to dictionary"""
        return {
            'id': self.id,
            'team_id': self.team_id,
            'email': self.email,
            'invited_by': self.invited_by,
            'invitation_token': self.invitation_token,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
