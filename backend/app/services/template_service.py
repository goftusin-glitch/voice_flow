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

        if team:
            print(f"[DEBUG] User {user_id} owns team {team.id} ({team.name})")
        else:
            # Check all team memberships for debugging
            all_memberships = TeamMember.query.filter_by(user_id=user_id).all()
            print(f"[DEBUG] User {user_id} has {len(all_memberships)} team memberships")
            for m in all_memberships:
                print(f"[DEBUG]   - team_id={m.team_id}, role={m.role}")

            # Check if user is a member of a team
            team_member = TeamMember.query.filter_by(user_id=user_id).first()
            if team_member:
                team = Team.query.get(team_member.team_id)
                print(f"[DEBUG] User {user_id} is member of team {team.id} ({team.name}) with role {team_member.role}")
            else:
                print(f"[DEBUG] User {user_id} has no team membership")

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
    def get_all_user_team_ids(user_id):
        """Get all team IDs the user is part of (owned + member of)"""
        team_ids = set()

        # Get team the user owns
        owned_team = Team.query.filter_by(owner_id=user_id).first()
        if owned_team:
            team_ids.add(owned_team.id)

        # Get all teams user is a member of
        memberships = TeamMember.query.filter_by(user_id=user_id).all()
        for membership in memberships:
            team_ids.add(membership.team_id)

        return list(team_ids)

    @staticmethod
    def get_all_templates(user_id):
        """Get all templates for user - own templates + shared templates from ALL teams"""
        # Ensure user has at least one team
        team = TemplateService.get_or_create_team(user_id)

        # Get ALL teams the user is part of
        all_team_ids = TemplateService.get_all_user_team_ids(user_id)

        print(f"[DEBUG] get_all_templates called for user_id={user_id}")
        print(f"[DEBUG] User is part of teams: {all_team_ids}")

        # Get user's own templates
        own_templates = ReportTemplate.query.filter_by(
            created_by=user_id,
            is_active=True
        ).options(
            joinedload(ReportTemplate.fields)
        ).order_by(desc(ReportTemplate.created_at)).all()

        print(f"[DEBUG] Found {len(own_templates)} own templates for user {user_id}")

        # Get templates shared by other team members from ALL teams user is part of
        # Use .is_(True) for proper boolean comparison in SQLAlchemy with MySQL
        shared_templates = ReportTemplate.query.filter(
            ReportTemplate.team_id.in_(all_team_ids),
            ReportTemplate.created_by != user_id,
            ReportTemplate.shared_with_team.is_(True),
            ReportTemplate.is_active.is_(True)
        ).options(
            joinedload(ReportTemplate.fields)
        ).order_by(desc(ReportTemplate.created_at)).all()

        print(f"[DEBUG] Found {len(shared_templates)} shared templates from all teams")

        # Debug: show all templates in user's teams
        all_team_templates = ReportTemplate.query.filter(
            ReportTemplate.team_id.in_(all_team_ids),
            ReportTemplate.is_active.is_(True)
        ).all()
        for t in all_team_templates:
            print(f"[DEBUG] Team template: id={t.id}, name={t.name}, created_by={t.created_by}, shared={t.shared_with_team}, team_id={t.team_id}")

        # Combine and remove duplicates (prioritize own templates)
        own_ids = {t.id for t in own_templates}
        all_templates = own_templates + [t for t in shared_templates if t.id not in own_ids]

        result = []
        for template in all_templates:
            # Include fields in the list view for display
            template_dict = template.to_dict(include_fields=True)
            # Add creator name
            creator = User.query.get(template.created_by)
            if creator:
                template_dict['created_by_name'] = f"{creator.first_name} {creator.last_name}"
            # Add permission flag - only creator can edit/delete
            is_owner = template.created_by == user_id
            template_dict['can_edit'] = is_owner
            template_dict['is_owner'] = is_owner
            template_dict['is_shared'] = not is_owner and template.shared_with_team
            result.append(template_dict)

        return result

    @staticmethod
    def get_template_by_id(template_id, user_id):
        """Get a specific template by ID"""
        # Get all teams the user is part of
        all_team_ids = TemplateService.get_all_user_team_ids(user_id)

        if not all_team_ids:
            raise ValueError("User is not part of any team")

        # First check if user owns the template
        template = ReportTemplate.query.filter_by(
            id=template_id,
            created_by=user_id,
            is_active=True
        ).options(
            joinedload(ReportTemplate.fields)
        ).first()

        # If not, check if it's a shared template from any of the user's teams
        if not template:
            template = ReportTemplate.query.filter(
                ReportTemplate.id == template_id,
                ReportTemplate.team_id.in_(all_team_ids),
                ReportTemplate.shared_with_team.is_(True),
                ReportTemplate.is_active.is_(True)
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

        # Add permission flag - only creator can edit/delete
        is_owner = template.created_by == user_id
        template_dict['can_edit'] = is_owner
        template_dict['is_owner'] = is_owner
        template_dict['is_shared'] = not is_owner and template.shared_with_team

        return template_dict

    @staticmethod
    def create_template(user_id, name, description, fields, shared_with_team=False):
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
            team_id=team.id,
            shared_with_team=shared_with_team
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
    def update_template(template_id, user_id, name=None, description=None, fields=None, shared_with_team=None):
        """Update an existing template"""
        # Get all teams the user is part of
        all_team_ids = TemplateService.get_all_user_team_ids(user_id)

        if not all_team_ids:
            raise ValueError("User is not part of any team")

        # Find the template in any of the user's teams
        template = ReportTemplate.query.filter(
            ReportTemplate.id == template_id,
            ReportTemplate.team_id.in_(all_team_ids),
            ReportTemplate.is_active.is_(True)
        ).first()

        if not template:
            raise ValueError("Template not found")

        # Check if user is the creator (only creator can edit)
        if template.created_by != user_id:
            raise ValueError("Only the template creator can edit this template")

        # Update basic info
        if name:
            template.name = name
        if description is not None:
            template.description = description
        if shared_with_team is not None:
            template.shared_with_team = shared_with_team

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
        # Get all teams the user is part of
        all_team_ids = TemplateService.get_all_user_team_ids(user_id)

        if not all_team_ids:
            raise ValueError("User is not part of any team")

        # Find the template in any of the user's teams
        template = ReportTemplate.query.filter(
            ReportTemplate.id == template_id,
            ReportTemplate.team_id.in_(all_team_ids),
            ReportTemplate.is_active.is_(True)
        ).first()

        if not template:
            raise ValueError("Template not found")

        # Check if user is the creator (only creator can delete)
        if template.created_by != user_id:
            raise ValueError("Only the template creator can delete this template")

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

    @staticmethod
    def create_default_template_for_user(user_id, team_id):
        """Create a default 'Client Data' template for new users"""
        # Check if user already has a template named 'Client Data'
        existing = ReportTemplate.query.filter_by(
            created_by=user_id,
            name='Client Data',
            is_active=True
        ).first()

        if existing:
            return existing.to_dict(include_fields=True)

        # Define default template fields
        default_fields = [
            {
                'field_name': 'name',
                'field_label': 'Name',
                'field_type': 'text',
                'is_required': True,
                'display_order': 0
            },
            {
                'field_name': 'company',
                'field_label': 'Company',
                'field_type': 'text',
                'is_required': False,
                'display_order': 1
            },
            {
                'field_name': 'email',
                'field_label': 'Email',
                'field_type': 'text',
                'is_required': False,
                'display_order': 2
            },
            {
                'field_name': 'phone',
                'field_label': 'Phone',
                'field_type': 'text',
                'is_required': False,
                'display_order': 3
            },
            {
                'field_name': 'position_title',
                'field_label': 'Position/Title',
                'field_type': 'text',
                'is_required': False,
                'display_order': 4
            },
            {
                'field_name': 'notes',
                'field_label': 'Notes',
                'field_type': 'long_text',
                'is_required': False,
                'display_order': 5
            }
        ]

        # Create the default template
        template = ReportTemplate(
            name='Client Data',
            description='Default template for capturing client information from calls',
            created_by=user_id,
            team_id=team_id,
            shared_with_team=False
        )
        db.session.add(template)
        db.session.flush()

        # Create fields
        for field_data in default_fields:
            field = TemplateField(
                template_id=template.id,
                field_name=field_data['field_name'],
                field_label=field_data['field_label'],
                field_type=field_data['field_type'],
                is_required=field_data['is_required'],
                display_order=field_data['display_order']
            )
            db.session.add(field)

        db.session.commit()

        return template.to_dict(include_fields=True)
