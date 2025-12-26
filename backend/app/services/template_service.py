from app import db
from app.models.template import ReportTemplate, TemplateField
from app.models.team import Team, TeamMember
from app.models.user import User
from sqlalchemy.orm import joinedload
from sqlalchemy import desc


class TemplateService:
    @staticmethod
    def get_user_team(user_id):
        """Get the user's team (either owned or member of)"""
        # Check if user owns a team
        team = Team.query.filter_by(owner_id=user_id).first()

        if not team:
            # Check if user is a member of a team
            team_member = TeamMember.query.filter_by(user_id=user_id).first()
            if team_member:
                team = Team.query.get(team_member.team_id)

        return team

    @staticmethod
    def get_or_create_team(user_id):
        """Get user's team or create one if doesn't exist"""
        team = TemplateService.get_user_team(user_id)

        if not team:
            # Create a default team for the user
            user = User.query.get(user_id)
            team = Team(
                name=f"{user.first_name}'s Team" if user.first_name else "My Team",
                owner_id=user_id
            )
            db.session.add(team)

            # Add user as team member
            team_member = TeamMember(
                team_id=team.id,
                user_id=user_id,
                role='owner'
            )
            db.session.add(team_member)
            db.session.commit()

        return team

    @staticmethod
    def get_all_templates(user_id):
        """Get all templates for user's team"""
        team = TemplateService.get_or_create_team(user_id)

        templates = ReportTemplate.query.filter_by(
            team_id=team.id,
            is_active=True
        ).options(
            joinedload(ReportTemplate.fields)
        ).order_by(desc(ReportTemplate.created_at)).all()

        result = []
        for template in templates:
            template_dict = template.to_dict()
            # Add creator name
            creator = User.query.get(template.created_by)
            if creator:
                template_dict['created_by_name'] = f"{creator.first_name} {creator.last_name}"
            result.append(template_dict)

        return result

    @staticmethod
    def get_template_by_id(template_id, user_id):
        """Get a specific template by ID"""
        team = TemplateService.get_user_team(user_id)

        if not team:
            raise ValueError("User is not part of any team")

        template = ReportTemplate.query.filter_by(
            id=template_id,
            team_id=team.id,
            is_active=True
        ).options(
            joinedload(ReportTemplate.fields)
        ).first()

        if not template:
            raise ValueError("Template not found")

        template_dict = template.to_dict(include_fields=True)

        # Add creator name
        creator = User.query.get(template.created_by)
        if creator:
            template_dict['created_by_name'] = f"{creator.first_name} {creator.last_name}"

        return template_dict

    @staticmethod
    def create_template(user_id, name, description, fields):
        """Create a new template"""
        team = TemplateService.get_or_create_team(user_id)

        # Validate fields
        if not fields or len(fields) == 0:
            raise ValueError("Template must have at least one field")

        # Create template
        template = ReportTemplate(
            name=name,
            description=description,
            created_by=user_id,
            team_id=team.id
        )
        db.session.add(template)
        db.session.flush()  # Get template ID

        # Create fields
        for field_data in fields:
            field = TemplateField(
                template_id=template.id,
                field_name=field_data.get('field_name'),
                field_label=field_data.get('field_label'),
                field_type=field_data.get('field_type'),
                is_required=field_data.get('is_required', False),
                display_order=field_data.get('display_order')
            )

            # Set options for dropdown and multi_select fields
            if field_data.get('field_type') in ['dropdown', 'multi_select']:
                field.set_options(field_data.get('field_options', []))

            db.session.add(field)

        db.session.commit()

        return template.to_dict(include_fields=True)

    @staticmethod
    def update_template(template_id, user_id, name=None, description=None, fields=None):
        """Update an existing template"""
        team = TemplateService.get_user_team(user_id)

        if not team:
            raise ValueError("User is not part of any team")

        template = ReportTemplate.query.filter_by(
            id=template_id,
            team_id=team.id,
            is_active=True
        ).first()

        if not template:
            raise ValueError("Template not found")

        # Update basic info
        if name:
            template.name = name
        if description is not None:
            template.description = description

        # Update fields if provided
        if fields is not None:
            # Delete existing fields
            TemplateField.query.filter_by(template_id=template_id).delete()

            # Create new fields
            for field_data in fields:
                field = TemplateField(
                    template_id=template.id,
                    field_name=field_data.get('field_name'),
                    field_label=field_data.get('field_label'),
                    field_type=field_data.get('field_type'),
                    is_required=field_data.get('is_required', False),
                    display_order=field_data.get('display_order')
                )

                # Set options for dropdown and multi_select fields
                if field_data.get('field_type') in ['dropdown', 'multi_select']:
                    field.set_options(field_data.get('field_options', []))

                db.session.add(field)

        db.session.commit()

        return template.to_dict(include_fields=True)

    @staticmethod
    def delete_template(template_id, user_id):
        """Delete a template (soft delete)"""
        team = TemplateService.get_user_team(user_id)

        if not team:
            raise ValueError("User is not part of any team")

        template = ReportTemplate.query.filter_by(
            id=template_id,
            team_id=team.id,
            is_active=True
        ).first()

        if not template:
            raise ValueError("Template not found")

        # Soft delete
        template.is_active = False
        db.session.commit()

        return True

    @staticmethod
    def validate_field_data(field_data):
        """Validate field data"""
        required_keys = ['field_name', 'field_label', 'field_type', 'display_order']

        for key in required_keys:
            if key not in field_data:
                raise ValueError(f"Missing required field: {key}")

        valid_types = ['text', 'number', 'long_text', 'dropdown', 'multi_select']
        if field_data['field_type'] not in valid_types:
            raise ValueError(f"Invalid field type: {field_data['field_type']}")

        # Validate options for dropdown and multi_select
        if field_data['field_type'] in ['dropdown', 'multi_select']:
            options = field_data.get('field_options', [])
            if not options or len(options) == 0:
                raise ValueError(f"{field_data['field_type']} field must have options")

        return True
