from app import db
from datetime import datetime
import json


class ReportTemplate(db.Model):
    __tablename__ = 'report_templates'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True, index=True)

    # Relationships
    fields = db.relationship('TemplateField', backref='template', lazy=True, cascade='all, delete-orphan', order_by='TemplateField.display_order')
    reports = db.relationship('Report', backref='template', lazy=True)
    analyses = db.relationship('CallAnalysis', backref='template', lazy=True)

    def to_dict(self, include_fields=False):
        """Convert template to dictionary"""
        result = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_by': self.created_by,
            'team_id': self.team_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active,
            'field_count': len(self.fields) if self.fields else 0
        }

        if include_fields:
            result['fields'] = [field.to_dict() for field in self.fields]

        return result


class TemplateField(db.Model):
    __tablename__ = 'template_fields'

    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('report_templates.id'), nullable=False, index=True)
    field_name = db.Column(db.String(255), nullable=False)
    field_label = db.Column(db.String(255), nullable=False)
    field_type = db.Column(
        db.Enum('text', 'number', 'long_text', 'dropdown', 'multi_select', name='field_type'),
        nullable=False
    )
    field_options = db.Column(db.JSON)
    is_required = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    field_values = db.relationship('ReportFieldValue', backref='field', lazy=True, cascade='all, delete-orphan')

    def get_options(self):
        """Get field options as Python list"""
        if self.field_options:
            if isinstance(self.field_options, str):
                try:
                    return json.loads(self.field_options)
                except json.JSONDecodeError:
                    return []
            return self.field_options
        return []

    def set_options(self, options):
        """Set field options from Python list"""
        if options:
            if isinstance(options, list):
                self.field_options = options
            else:
                self.field_options = json.dumps(options)
        else:
            self.field_options = None

    def to_dict(self):
        """Convert template field to dictionary"""
        return {
            'id': self.id,
            'template_id': self.template_id,
            'field_name': self.field_name,
            'field_label': self.field_label,
            'field_type': self.field_type,
            'field_options': self.get_options(),
            'is_required': self.is_required,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
