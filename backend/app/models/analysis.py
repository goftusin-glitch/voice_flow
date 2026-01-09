from app import db
from datetime import datetime


class CallAnalysis(db.Model):
    __tablename__ = 'call_analyses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False, index=True)
    template_id = db.Column(db.Integer, db.ForeignKey('report_templates.id'), nullable=False, index=True)

    # Input type and sources
    input_type = db.Column(db.Enum('audio', 'text', 'image', name='input_type_enum'), default='audio', nullable=False)
    audio_file_path = db.Column(db.String(500))
    audio_duration = db.Column(db.Integer)  # Duration in seconds
    input_text = db.Column(db.Text)  # For direct text input
    image_file_path = db.Column(db.String(500))  # For image input

    transcription = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationships
    reports = db.relationship('Report', backref='analysis', lazy=True, cascade='all, delete-orphan')

    def get_audio_duration_formatted(self):
        """Get audio duration in HH:MM:SS format"""
        if not self.audio_duration:
            return "00:00:00"

        hours = self.audio_duration // 3600
        minutes = (self.audio_duration % 3600) // 60
        seconds = self.audio_duration % 60

        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    def get_audio_duration_in_hours(self):
        """Get audio duration in hours (decimal)"""
        if not self.audio_duration:
            return 0.0
        return round(self.audio_duration / 3600, 2)

    def to_dict(self, include_transcription=False):
        """Convert call analysis to dictionary"""
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'team_id': self.team_id,
            'template_id': self.template_id,
            'input_type': self.input_type,
            'audio_file_path': self.audio_file_path,
            'audio_duration': self.audio_duration,
            'audio_duration_formatted': self.get_audio_duration_formatted(),
            'audio_duration_hours': self.get_audio_duration_in_hours(),
            'input_text': self.input_text if self.input_type == 'text' else None,
            'image_file_path': self.image_file_path if self.input_type == 'image' else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_transcription:
            result['transcription'] = self.transcription

        return result
