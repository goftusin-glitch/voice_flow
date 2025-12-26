from flask import Blueprint, request, jsonify, send_file
from app.middleware.auth_middleware import token_required
from app.services.report_service import ReportService
from app.services.pdf_service import PDFService
from app.services.email_service import EmailService
from app.models.team import TeamMember
import os

reports_bp = Blueprint('reports', __name__)


def get_user_team_id(user_id):
    """Get the team ID for a user"""
    team_member = TeamMember.query.filter_by(user_id=user_id).first()
    if not team_member:
        raise ValueError("User is not part of any team")
    return team_member.team_id


@reports_bp.route('', methods=['GET'])
@token_required
def get_reports(current_user):
    """Get all reports with pagination and filters"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', None)
        status = request.args.get('status', None)
        requested_team_id = request.args.get('team_id', None, type=int)

        # If team_id is provided, verify user is member of that team
        if requested_team_id:
            member = TeamMember.query.filter_by(
                user_id=current_user.id,
                team_id=requested_team_id
            ).first()

            if not member:
                return jsonify({
                    'success': False,
                    'message': 'You are not a member of this team'
                }), 403

            team_id = requested_team_id
        else:
            # Use user's default team
            team_id = get_user_team_id(current_user.id)

        print(f"User {current_user.id} ({current_user.email}) fetching reports for team {team_id}")

        # Get reports
        result = ReportService.get_reports(
            user_id=current_user.id,
            team_id=team_id,
            page=page,
            limit=limit,
            search=search,
            status=status
        )

        print(f"Found {result['total']} reports for team {team_id}")

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except ValueError as e:
        print(f"ValueError getting reports for user {current_user.id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error getting reports for user {current_user.id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to get reports'
        }), 500


@reports_bp.route('/<int:report_id>', methods=['GET'])
@token_required
def get_report(current_user, report_id):
    """Get a single report with full details"""
    try:
        team_id = get_user_team_id(current_user.id)

        report = ReportService.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id,
            team_id=team_id
        )

        return jsonify({
            'success': True,
            'data': {'report': report}
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error getting report: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get report'
        }), 500


@reports_bp.route('/<int:report_id>', methods=['PUT'])
@token_required
def update_report(current_user, report_id):
    """Update a report"""
    try:
        team_id = get_user_team_id(current_user.id)
        data = request.get_json()

        report = ReportService.update_report(
            report_id=report_id,
            user_id=current_user.id,
            team_id=team_id,
            title=data.get('title'),
            field_values=data.get('field_values')
        )

        return jsonify({
            'success': True,
            'data': {
                'report_id': report_id,
                'updated_at': report.get('updated_at')
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error updating report: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update report'
        }), 500


@reports_bp.route('/<int:report_id>', methods=['DELETE'])
@token_required
def delete_report(current_user, report_id):
    """Delete a report"""
    try:
        team_id = get_user_team_id(current_user.id)

        ReportService.delete_report(
            report_id=report_id,
            user_id=current_user.id,
            team_id=team_id
        )

        return jsonify({
            'success': True,
            'message': 'Report deleted successfully'
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error deleting report: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete report'
        }), 500


@reports_bp.route('/<int:report_id>/generate-pdf', methods=['POST'])
@token_required
def generate_pdf(current_user, report_id):
    """Generate PDF for a report"""
    try:
        team_id = get_user_team_id(current_user.id)

        # Get report data
        report_data = ReportService.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id,
            team_id=team_id
        )

        # Generate PDF
        pdf_path = PDFService.generate_report_pdf(report_data)

        # Get relative path for URL
        pdf_filename = os.path.basename(pdf_path)
        pdf_url = f"/generated/pdfs/{pdf_filename}"

        return jsonify({
            'success': True,
            'data': {
                'pdf_url': pdf_url,
                'filename': pdf_filename
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to generate PDF'
        }), 500


@reports_bp.route('/<int:report_id>/download-pdf', methods=['GET'])
@token_required
def download_pdf(current_user, report_id):
    """Download PDF for a report"""
    try:
        team_id = get_user_team_id(current_user.id)

        # Get report data
        report_data = ReportService.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id,
            team_id=team_id
        )

        # Generate PDF
        pdf_path = PDFService.generate_report_pdf(report_data)

        # Send file
        return send_file(
            pdf_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"report_{report_id}.pdf"
        )

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error downloading PDF: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to download PDF'
        }), 500


@reports_bp.route('/<int:report_id>/share-email', methods=['POST'])
@token_required
def share_email(current_user, report_id):
    """Share report via email"""
    try:
        team_id = get_user_team_id(current_user.id)
        data = request.get_json()

        # Validate recipients
        recipients = data.get('recipients', [])
        if not recipients:
            return jsonify({
                'success': False,
                'message': 'At least one recipient is required'
            }), 400

        # Get report data
        report_data = ReportService.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id,
            team_id=team_id
        )

        # Generate PDF
        pdf_path = PDFService.generate_report_pdf(report_data)

        # Send email
        sender_name = f"{current_user.first_name} {current_user.last_name}"
        custom_message = data.get('message')

        EmailService.send_report_email(
            recipients=recipients,
            report_data=report_data,
            pdf_path=pdf_path,
            sender_name=sender_name,
            custom_message=custom_message
        )

        return jsonify({
            'success': True,
            'message': 'Report shared successfully via email'
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        print(f"Error sharing report via email: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to share report via email'
        }), 500


@reports_bp.route('/<int:report_id>/share-whatsapp', methods=['POST'])
@token_required
def share_whatsapp(current_user, report_id):
    """Get WhatsApp share link for a report"""
    try:
        team_id = get_user_team_id(current_user.id)

        # Get report data
        report_data = ReportService.get_report_by_id(
            report_id=report_id,
            user_id=current_user.id,
            team_id=team_id
        )

        # Generate PDF
        pdf_path = PDFService.generate_report_pdf(report_data)
        pdf_filename = os.path.basename(pdf_path)

        # Create WhatsApp message
        # Note: In production, you'd want to host the PDF and include a download link
        message = f"""
Call Analysis Report: {report_data.get('title', 'Untitled')}

Created by: {report_data.get('created_by', {}).get('name', 'Unknown')}
Created at: {report_data.get('created_at', 'Unknown')}

Summary: {report_data.get('summary', 'No summary available')}

View full report with PDF attachment.
        """.strip()

        # URL encode the message
        import urllib.parse
        encoded_message = urllib.parse.quote(message)
        whatsapp_url = f"https://wa.me/?text={encoded_message}"

        return jsonify({
            'success': True,
            'data': {
                'whatsapp_url': whatsapp_url,
                'message': message,
                'pdf_filename': pdf_filename
            }
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Error creating WhatsApp share link: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create WhatsApp share link'
        }), 500
