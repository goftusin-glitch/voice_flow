import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from flask import current_app
import os


class EmailService:
    @staticmethod
    def _send_email(to_emails, subject, html_content, attachment_path=None):
        """
        Send email using SMTP

        Args:
            to_emails: Single email or list of emails
            subject: Email subject
            html_content: HTML content of the email
            attachment_path: Optional path to file attachment

        Returns:
            bool: True if email sent successfully
        """
        try:
            # Ensure to_emails is a list
            if isinstance(to_emails, str):
                to_emails = [to_emails]

            # Get SMTP configuration
            smtp_server = current_app.config.get('MAIL_SERVER')
            smtp_port = current_app.config.get('MAIL_PORT')
            smtp_username = current_app.config.get('MAIL_USERNAME')
            smtp_password = current_app.config.get('MAIL_PASSWORD')
            from_email = current_app.config.get('MAIL_DEFAULT_SENDER')
            use_tls = current_app.config.get('MAIL_USE_TLS', True)
            use_ssl = current_app.config.get('MAIL_USE_SSL', False)

            # Check if SMTP is configured
            if not smtp_server or not smtp_username or not smtp_password:
                print("SMTP not configured. Email settings:")
                print(f"  MAIL_SERVER: {smtp_server}")
                print(f"  MAIL_USERNAME: {smtp_username}")
                print(f"  MAIL_PASSWORD: {'***' if smtp_password else 'Not set'}")
                raise ValueError("SMTP email service not configured. Please set MAIL_SERVER, MAIL_USERNAME, and MAIL_PASSWORD.")

            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = from_email
            message['To'] = ', '.join(to_emails)

            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)

            # Attach file if provided
            if attachment_path and os.path.exists(attachment_path):
                with open(attachment_path, 'rb') as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())

                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {os.path.basename(attachment_path)}',
                )
                message.attach(part)

            # Send email
            if use_ssl:
                # Use SSL connection (port 465)
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(smtp_server, smtp_port, context=context) as server:
                    server.login(smtp_username, smtp_password)
                    server.sendmail(from_email, to_emails, message.as_string())
            else:
                # Use TLS connection (port 587)
                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    if use_tls:
                        context = ssl.create_default_context()
                        server.starttls(context=context)
                    server.login(smtp_username, smtp_password)
                    server.sendmail(from_email, to_emails, message.as_string())

            print(f"Email sent successfully to {', '.join(to_emails)}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            print(f"SMTP Authentication Error: {str(e)}")
            print("Please check your MAIL_USERNAME and MAIL_PASSWORD")
            raise ValueError(f"Email authentication failed: {str(e)}")
        except smtplib.SMTPException as e:
            print(f"SMTP Error: {str(e)}")
            raise ValueError(f"Failed to send email: {str(e)}")
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            raise ValueError(f"Failed to send email: {str(e)}")

    @staticmethod
    def send_report_email(recipients, report_data, pdf_path=None, sender_name=None, custom_message=None):
        """
        Send report via email

        Args:
            recipients: List of email addresses
            report_data: Dictionary containing report information
            pdf_path: Optional path to PDF attachment
            sender_name: Name of the person sharing the report
            custom_message: Custom message to include in the email

        Returns:
            bool: True if email sent successfully
        """
        try:
            # Build email content
            subject = f"Call Analysis Report: {report_data.get('title', 'Untitled')}"

            # HTML content
            html_content = EmailService._build_report_email_html(
                report_data,
                sender_name,
                custom_message
            )

            # Send email
            return EmailService._send_email(recipients, subject, html_content, pdf_path)

        except Exception as e:
            print(f"Error sending report email: {str(e)}")
            raise

    @staticmethod
    def send_team_invitation(email, team_name, inviter_name, invitation_link):
        """
        Send team invitation email

        Args:
            email: Recipient email address
            team_name: Name of the team
            inviter_name: Name of the person sending invitation
            invitation_link: Link to accept invitation

        Returns:
            bool: True if email sent successfully
        """
        try:
            subject = f"You've been invited to join {team_name} on Call Analyzer"

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }}
                    .container {{
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background-color: #2563eb;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 5px 5px 0 0;
                    }}
                    .content {{
                        background-color: #f9fafb;
                        padding: 30px;
                        border-radius: 0 0 5px 5px;
                    }}
                    .button {{
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #2563eb;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #6b7280;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Team Invitation</h1>
                    </div>
                    <div class="content">
                        <p>Hi there,</p>
                        <p><strong>{inviter_name}</strong> has invited you to join <strong>{team_name}</strong> on Call Analyzer.</p>
                        <p>Call Analyzer helps teams transcribe and analyze calls using AI, making it easy to generate detailed reports and collaborate with team members.</p>
                        <p>Click the button below to accept the invitation and create your account:</p>
                        <div style="text-align: center;">
                            <a href="{invitation_link}" class="button">Accept Invitation</a>
                        </div>
                        <p style="font-size: 12px; color: #6b7280;">
                            Or copy and paste this link into your browser:<br>
                            {invitation_link}
                        </p>
                    </div>
                    <div class="footer">
                        <p>This invitation was sent by {inviter_name}. If you weren't expecting this, you can safely ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            # Send email
            return EmailService._send_email(email, subject, html_content)

        except Exception as e:
            print(f"Error sending invitation email: {str(e)}")
            raise

    @staticmethod
    def _build_report_email_html(report_data, sender_name, custom_message):
        """Build HTML content for report sharing email"""
        created_by = report_data.get('created_by', {}).get('name', 'Unknown')
        created_at = report_data.get('created_at', 'Unknown')

        # Build field values HTML
        field_values_html = ""
        if report_data.get('field_values'):
            field_values_html = "<h3>Analysis Details</h3><table style='width: 100%; border-collapse: collapse;'>"
            for field in report_data['field_values']:
                field_values_html += f"""
                <tr style='border-bottom: 1px solid #e5e7eb;'>
                    <td style='padding: 10px; font-weight: bold; width: 40%;'>{field.get('field_label', 'N/A')}</td>
                    <td style='padding: 10px;'>{field.get('value', 'N/A')}</td>
                </tr>
                """
            field_values_html += "</table>"

        custom_message_html = ""
        if custom_message:
            custom_message_html = f"""
            <div style='background-color: #eff6ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;'>
                <p style='margin: 0; font-style: italic;'>"{custom_message}"</p>
                <p style='margin: 5px 0 0 0; font-size: 12px; color: #6b7280;'>- {sender_name}</p>
            </div>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #2563eb;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #ffffff;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                    border-radius: 0 0 5px 5px;
                }}
                .metadata {{
                    background-color: #f9fafb;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #6b7280;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Call Analysis Report</h1>
                </div>
                <div class="content">
                    <p>Hi,</p>
                    <p>{sender_name or 'A team member'} has shared a call analysis report with you.</p>

                    {custom_message_html}

                    <h2>{report_data.get('title', 'Untitled Report')}</h2>

                    <div class="metadata">
                        <p><strong>Created By:</strong> {created_by}</p>
                        <p><strong>Created At:</strong> {created_at}</p>
                        <p><strong>Template:</strong> {report_data.get('template', {}).get('name', 'N/A')}</p>
                    </div>

                    {f"<h3>Summary</h3><p>{report_data.get('summary', '')}</p>" if report_data.get('summary') else ''}

                    {field_values_html}

                    <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                        This report was generated using Call Analyzer. If you have access to the platform, you can view the full report with audio transcription.
                    </p>
                </div>
                <div class="footer">
                    <p>Call Analyzer - AI-Powered Call Analysis</p>
                </div>
            </div>
        </body>
        </html>
        """

        return html
