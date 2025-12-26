from app import db
from app.models.report import Report
from app.models.template import ReportTemplate
from app.models.team import TeamMember
from app.models.analysis import CallAnalysis
from app.models.user import User
from sqlalchemy import func, desc
from datetime import datetime, timedelta


class DashboardService:
    @staticmethod
    def get_metrics(team_id):
        """Get dashboard metrics for a team"""
        # Total hours analyzed (sum of all audio durations)
        total_seconds = db.session.query(
            func.coalesce(func.sum(CallAnalysis.audio_duration), 0)
        ).filter_by(team_id=team_id).scalar()
        hours_analyzed = round(total_seconds / 3600, 2) if total_seconds else 0

        # Total analysis count
        analysis_count = CallAnalysis.query.filter_by(team_id=team_id).count()

        # Template count
        template_count = ReportTemplate.query.filter_by(
            team_id=team_id,
            is_active=True
        ).count()

        # Team member count
        team_member_count = TeamMember.query.filter_by(team_id=team_id).count()

        return {
            'hours_analyzed': hours_analyzed,
            'analysis_count': analysis_count,
            'template_count': template_count,
            'team_member_count': team_member_count
        }

    @staticmethod
    def get_recent_activity(team_id, limit=10):
        """Get recent activity for a team"""
        activities = []

        # Get recent reports
        recent_reports = Report.query.filter_by(
            team_id=team_id,
            status='finalized'
        ).order_by(desc(Report.created_at)).limit(limit).all()

        for report in recent_reports:
            user = User.query.get(report.user_id)
            activities.append({
                'id': report.id,
                'type': 'report_created',
                'user_name': f"{user.first_name} {user.last_name}" if user else 'Unknown',
                'report_title': report.title,
                'created_at': report.created_at.isoformat() if report.created_at else None
            })

        # Get recent templates
        recent_templates = ReportTemplate.query.filter_by(
            team_id=team_id,
            is_active=True
        ).order_by(desc(ReportTemplate.created_at)).limit(limit).all()

        for template in recent_templates:
            user = User.query.get(template.created_by)
            activities.append({
                'id': template.id,
                'type': 'template_created',
                'user_name': f"{user.first_name} {user.last_name}" if user else 'Unknown',
                'template_name': template.name,
                'created_at': template.created_at.isoformat() if template.created_at else None
            })

        # Sort by creation date
        activities.sort(key=lambda x: x['created_at'] or '', reverse=True)

        return activities[:limit]

    @staticmethod
    def get_analytics_data(team_id, days=30):
        """Get analytics data for charts"""
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Get analyses per day
        analyses_by_day = db.session.query(
            func.date(CallAnalysis.created_at).label('date'),
            func.count(CallAnalysis.id).label('count')
        ).filter(
            CallAnalysis.team_id == team_id,
            CallAnalysis.created_at >= start_date
        ).group_by(
            func.date(CallAnalysis.created_at)
        ).all()

        # Format for frontend
        daily_analyses = [
            {
                'date': str(item.date),
                'count': item.count
            }
            for item in analyses_by_day
        ]

        # Get reports per day
        reports_by_day = db.session.query(
            func.date(Report.created_at).label('date'),
            func.count(Report.id).label('count')
        ).filter(
            Report.team_id == team_id,
            Report.created_at >= start_date
        ).group_by(
            func.date(Report.created_at)
        ).all()

        daily_reports = [
            {
                'date': str(item.date),
                'count': item.count
            }
            for item in reports_by_day
        ]

        return {
            'daily_analyses': daily_analyses,
            'daily_reports': daily_reports
        }
