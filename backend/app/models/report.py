from app import db
from datetime import datetime


class Report(db.Model):
    __tablename__ = 'reports'

    id = db.Column(db.Integer, primary_key=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey('call_analyses.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False, index=True)
    template_id = db.Column(db.Integer, db.ForeignKey('report_templates.id'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text)
    status = db.Column(
        db.Enum('draft', 'finalized', name='report_status'),
        default='draft',
        index=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    finalized_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    field_values = db.relationship('ReportFieldValue', backref='report', lazy=True, cascade='all, delete-orphan')

    def finalize(self):
        """Finalize the report"""
        self.status = 'finalized'
        self.finalized_at = datetime.utcnow()

    def is_finalized(self):
        """Check if report is finalized"""
        return self.status == 'finalized'

    def to_dict(self, include_field_values=False):
        """Convert report to dictionary"""
        result = {
            'id': self.id,
            'analysis_id': self.analysis_id,
            'user_id': self.user_id,
            'team_id': self.team_id,
            'template_id': self.template_id,
            'title': self.title,
            'summary': self.summary,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'finalized_at': self.finalized_at.isoformat() if self.finalized_at else None
        }

        if include_field_values:
            result['field_values'] = [fv.to_dict() for fv in self.field_values]

        return result


class ReportFieldValue(db.Model):
    __tablename__ = 'report_field_values'

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('reports.id'), nullable=False, index=True)
    field_id = db.Column(db.Integer, db.ForeignKey('template_fields.id'), nullable=True, index=True)
    custom_field_name = db.Column(db.String(255), nullable=True)  # For custom fields not in template
    field_value = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert report field value to dictionary"""
        return {
            'id': self.id,
            'report_id': self.report_id,
            'field_id': self.field_id,
            'custom_field_name': self.custom_field_name,
            'field_value': self.field_value,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def is_custom_field(self):
        """Check if this is a custom field (not from template)"""
        return self.field_id is None and self.custom_field_name is not None
