from flask import Blueprint, request, jsonify
from app.services.template_service import TemplateService
from app.middleware.auth_middleware import token_required

templates_bp = Blueprint('templates', __name__)


@templates_bp.route('/', methods=['GET'])
@token_required
def get_templates(current_user):
    """Get all templates for user's team"""
    try:
        templates = TemplateService.get_all_templates(current_user.id)

        return jsonify({
            'success': True,
            'data': {
                'templates': templates
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@templates_bp.route('/<int:template_id>', methods=['GET'])
@token_required
def get_template(current_user, template_id):
    """Get a specific template by ID"""
    try:
        template = TemplateService.get_template_by_id(template_id, current_user.id)

        return jsonify({
            'success': True,
            'data': {
                'template': template
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve template'
        }), 500


@templates_bp.route('/', methods=['POST'])
@token_required
def create_template(current_user):
    """Create a new template"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get('name'):
            return jsonify({
                'success': False,
                'message': 'Template name is required'
            }), 400

        if not data.get('fields') or len(data.get('fields', [])) == 0:
            return jsonify({
                'success': False,
                'message': 'Template must have at least one field'
            }), 400

        # Validate each field
        for field in data.get('fields', []):
            try:
                TemplateService.validate_field_data(field)
            except ValueError as e:
                return jsonify({
                    'success': False,
                    'message': str(e)
                }), 400

        # Create template
        template = TemplateService.create_template(
            user_id=current_user.id,
            name=data['name'],
            description=data.get('description', ''),
            fields=data['fields'],
            shared_with_team=data.get('shared_with_team', False)
        )

        return jsonify({
            'success': True,
            'data': {
                'template_id': template['id'],
                'created_at': template['created_at']
            }
        }), 201

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to create template'
        }), 500


@templates_bp.route('/<int:template_id>', methods=['PUT'])
@token_required
def update_template(current_user, template_id):
    """Update an existing template"""
    try:
        data = request.get_json()

        # Validate fields if provided
        if 'fields' in data and data['fields'] is not None:
            if len(data.get('fields', [])) == 0:
                return jsonify({
                    'success': False,
                    'message': 'Template must have at least one field'
                }), 400

            for field in data.get('fields', []):
                try:
                    TemplateService.validate_field_data(field)
                except ValueError as e:
                    return jsonify({
                        'success': False,
                        'message': str(e)
                    }), 400

        # Update template
        template = TemplateService.update_template(
            template_id=template_id,
            user_id=current_user.id,
            name=data.get('name'),
            description=data.get('description'),
            fields=data.get('fields'),
            shared_with_team=data.get('shared_with_team')
        )

        return jsonify({
            'success': True,
            'data': {
                'template_id': template['id'],
                'updated_at': template['updated_at']
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to update template'
        }), 500


@templates_bp.route('/<int:template_id>', methods=['DELETE'])
@token_required
def delete_template(current_user, template_id):
    """Delete a template"""
    try:
        TemplateService.delete_template(template_id, current_user.id)

        return jsonify({
            'success': True,
            'message': 'Template deleted successfully'
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to delete template'
        }), 500
