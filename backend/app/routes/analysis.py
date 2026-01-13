from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import token_required
from app.services.audio_service import AudioService
from app.services.transcription_service import TranscriptionService
from app.services.analysis_service import AnalysisService
from app.services.template_service import TemplateService
from app.models.analysis import CallAnalysis
from app.models.template import ReportTemplate
from app import db

analysis_bp = Blueprint('analysis', __name__)


@analysis_bp.route('/upload-audio', methods=['POST'])
@token_required
def upload_audio(current_user):
    """Upload audio file for analysis"""
    try:
        # Check if file is present
        if 'audio_file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No audio file provided'
            }), 400

        file = request.files['audio_file']

        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400

        # Get template_id from form data
        template_id = request.form.get('template_id')
        if not template_id:
            return jsonify({
                'success': False,
                'message': 'Template ID is required'
            }), 400

        # Validate template exists
        template = ReportTemplate.query.get(template_id)
        if not template:
            return jsonify({
                'success': False,
                'message': 'Template not found'
            }), 404

        # Validate file size
        if not AudioService.validate_file_size(file, max_size_mb=500):
            return jsonify({
                'success': False,
                'message': 'File size exceeds 500MB limit'
            }), 400

        # Save audio file
        file_path, duration = AudioService.save_audio_file(file, current_user.id)

        # Get user's team
        team = TemplateService.get_or_create_team(current_user.id)

        # Create analysis record
        analysis = CallAnalysis(
            user_id=current_user.id,
            team_id=team.id,
            template_id=template_id,
            audio_file_path=file_path,
            audio_duration=duration
        )
        db.session.add(analysis)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'analysis_id': analysis.id,
                'file_path': file_path,
                'duration': duration,
                'duration_formatted': analysis.get_audio_duration_formatted()
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Failed to upload audio file: {str(e)}'
        }), 500


@analysis_bp.route('/create-text', methods=['POST'])
@token_required
def create_text_analysis(current_user):
    """Create analysis from direct text input"""
    try:
        data = request.get_json()

        # Get required fields
        text = data.get('text')
        template_id = data.get('template_id')

        if not text or not template_id:
            return jsonify({
                'success': False,
                'message': 'Text and template_id are required'
            }), 400

        if not text.strip():
            return jsonify({
                'success': False,
                'message': 'Text cannot be empty'
            }), 400

        # Validate template exists
        template = ReportTemplate.query.get(template_id)
        if not template:
            return jsonify({
                'success': False,
                'message': 'Template not found'
            }), 404

        # Get user's team
        team = TemplateService.get_or_create_team(current_user.id)

        # Create text analysis
        analysis = AnalysisService.create_text_analysis(
            text=text,
            template_id=template_id,
            user_id=current_user.id,
            team_id=team.id
        )

        return jsonify({
            'success': True,
            'data': {
                'analysis_id': analysis.id,
                'input_type': 'text'
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Text analysis creation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Failed to create text analysis: {str(e)}'
        }), 500


@analysis_bp.route('/upload-image', methods=['POST'])
@token_required
def upload_image(current_user):
    """Upload image file for analysis"""
    try:
        # Check if file is present
        if 'image_file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No image file provided'
            }), 400

        file = request.files['image_file']

        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400

        # Get template_id from form data
        template_id = request.form.get('template_id')
        if not template_id:
            return jsonify({
                'success': False,
                'message': 'Template ID is required'
            }), 400

        # Validate template exists
        template = ReportTemplate.query.get(template_id)
        if not template:
            return jsonify({
                'success': False,
                'message': 'Template not found'
            }), 404

        # Validate file type
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        if file_ext not in allowed_extensions:
            return jsonify({
                'success': False,
                'message': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'
            }), 400

        # Validate file size (max 10MB for images)
        max_size = 10 * 1024 * 1024  # 10MB
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        if file_size > max_size:
            return jsonify({
                'success': False,
                'message': 'Image file size exceeds 10MB limit'
            }), 400

        # Save image file
        import os
        from werkzeug.utils import secure_filename
        from flask import current_app

        # Create images upload directory
        images_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'images', f'user_{current_user.id}')
        os.makedirs(images_dir, exist_ok=True)

        # Generate unique filename
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = secure_filename(file.filename)
        unique_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(images_dir, unique_filename)

        # Save file
        file.save(file_path)

        # Get relative path for database
        relative_path = os.path.join('images', f'user_{current_user.id}', unique_filename)

        # Get user's team
        team = TemplateService.get_or_create_team(current_user.id)

        # Create image analysis record
        analysis = AnalysisService.create_image_analysis(
            image_path=relative_path,
            template_id=template_id,
            user_id=current_user.id,
            team_id=team.id
        )

        return jsonify({
            'success': True,
            'data': {
                'analysis_id': analysis.id,
                'image_path': relative_path,
                'input_type': 'image'
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Image upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Failed to upload image file: {str(e)}'
        }), 500


@analysis_bp.route('/analyze', methods=['POST'])
@token_required
def analyze_call(current_user):
    """Transcribe and analyze uploaded audio, text, or image input"""
    try:
        data = request.get_json()

        # Get analysis_id
        analysis_id = data.get('analysis_id')
        if not analysis_id:
            return jsonify({
                'success': False,
                'message': 'Analysis ID is required'
            }), 400

        # Get analysis record
        analysis = CallAnalysis.query.get(analysis_id)
        if not analysis:
            return jsonify({
                'success': False,
                'message': 'Analysis not found'
            }), 404

        # Verify ownership
        if analysis.user_id != current_user.id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 403

        # Get template
        template = ReportTemplate.query.get(analysis.template_id)
        if not template:
            return jsonify({
                'success': False,
                'message': 'Template not found'
            }), 404

        # Handle different input types
        if analysis.input_type == 'text':
            # Text input: already has transcription
            transcription = analysis.transcription
        elif analysis.input_type == 'audio':
            # Audio input: need to transcribe
            absolute_path = AudioService.get_absolute_path(analysis.audio_file_path)
            transcription = TranscriptionService.transcribe_audio(absolute_path)

            # Save transcription
            analysis.transcription = transcription
            db.session.commit()
        elif analysis.input_type == 'image':
            # Image input: extract text using GPT-4 Vision
            absolute_path = AudioService.get_absolute_path(analysis.image_file_path)
            transcription = AnalysisService.extract_text_from_image(absolute_path, template)

            # Save extracted text as transcription
            analysis.transcription = transcription
            db.session.commit()
        else:
            return jsonify({
                'success': False,
                'message': f'Unsupported input type: {analysis.input_type}'
            }), 400

        # Analyze transcription with GPT-4
        analysis_result = AnalysisService.analyze_transcription(transcription, template)

        # Build field values response
        field_values = []
        for field in template.fields:
            # Find matching field in analysis result
            field_result = next(
                (f for f in analysis_result.get('fields', []) if f['field_name'] == field.field_name),
                None
            )

            field_values.append({
                'field_id': field.id,
                'field_name': field.field_name,
                'field_label': field.field_label,
                'field_type': field.field_type,
                'generated_value': field_result['value'] if field_result else None
            })

        return jsonify({
            'success': True,
            'data': {
                'analysis_id': analysis.id,
                'transcription': transcription,
                'summary': analysis_result.get('summary', ''),
                'field_values': field_values
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to analyze call'
        }), 500


@analysis_bp.route('/finalize', methods=['POST'])
@token_required
def finalize_analysis(current_user):
    """Finalize analysis and create report"""
    try:
        data = request.get_json()

        # Get required fields
        analysis_id = data.get('analysis_id')
        title = data.get('title')
        field_values = data.get('field_values', [])
        custom_fields = data.get('custom_fields', [])

        if not analysis_id or not title:
            return jsonify({
                'success': False,
                'message': 'Analysis ID and title are required'
            }), 400

        # Get analysis
        analysis = CallAnalysis.query.get(analysis_id)
        if not analysis:
            return jsonify({
                'success': False,
                'message': 'Analysis not found'
            }), 404

        # Verify ownership
        if analysis.user_id != current_user.id:
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 403

        # Create report
        report = AnalysisService.create_report_from_analysis(
            analysis_id=analysis_id,
            user_id=current_user.id,
            title=title,
            field_values=field_values,
            custom_fields=custom_fields
        )

        return jsonify({
            'success': True,
            'data': {
                'report_id': report.id,
                'created_at': report.created_at.isoformat() if report.created_at else None
            }
        }), 201

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Finalize error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to finalize analysis'
        }), 500


@analysis_bp.route('/history', methods=['GET'])
@token_required
def get_analysis_history(current_user):
    """Get user's analysis history"""
    try:
        # Get user's analyses
        analyses = CallAnalysis.query.filter_by(
            user_id=current_user.id
        ).order_by(CallAnalysis.created_at.desc()).limit(50).all()

        analyses_data = []
        for analysis in analyses:
            template = ReportTemplate.query.get(analysis.template_id)

            analyses_data.append({
                'id': analysis.id,
                'template_name': template.name if template else 'Unknown',
                'audio_duration': analysis.audio_duration,
                'audio_duration_formatted': analysis.get_audio_duration_formatted(),
                'has_transcription': bool(analysis.transcription),
                'created_at': analysis.created_at.isoformat() if analysis.created_at else None
            })

        return jsonify({
            'success': True,
            'data': {
                'analyses': analyses_data
            }
        }), 200

    except Exception as e:
        print(f"History error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get analysis history'
        }), 500
