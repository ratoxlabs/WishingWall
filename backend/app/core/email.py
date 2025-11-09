import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from app.core.config import settings

async def send_contributor_invite(
    email: str,
    wall_title: str,
    unique_url: str,
    passcode: str,
    invite_token: str
):
    """Send contributor invite email."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"Email not configured. Would send invite to {email} for wall {wall_title}")
        print(f"URL: {unique_url}, Passcode: {passcode}, Token: {invite_token}")
        return
    
    # Email template
    template = Template("""
    <html>
    <body>
        <h2>You've been invited to contribute to {{ wall_title }}!</h2>
        <p>You've been invited to add your wishes and greetings to a celebration wall.</p>
        <p><strong>Wall URL:</strong> {{ unique_url }}</p>
        <p><strong>Passcode:</strong> {{ passcode }}</p>
        <p>Click the link below to start contributing:</p>
        <p><a href="{{ contributor_url }}">Contribute to Wall</a></p>
        <p>Or use this invite token: {{ invite_token }}</p>
    </body>
    </html>
    """)
    
    # Generate contributor URL (frontend URL)
    # Use production domain from config, fallback to localhost for development
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://wishingwall.app')
    contributor_url = f"{frontend_url}/contribute?token={invite_token}"
    
    # Create message
    message = MIMEMultipart("alternative")
    message["Subject"] = f"Invitation to contribute to {wall_title}"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = email
    
    html_content = template.render(
        wall_title=wall_title,
        unique_url=unique_url,
        passcode=passcode,
        invite_token=invite_token,
        contributor_url=contributor_url
    )
    
    message.attach(MIMEText(html_content, "html"))
    
    # Send email
    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        use_tls=True,
    )

