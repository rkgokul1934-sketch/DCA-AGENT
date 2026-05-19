"""
DCA RevOps: Real SMTP Email Delivery Engine
Sends actual HTML emails using Gmail (or any SMTP provider).
Configure SMTP_EMAIL and SMTP_PASSWORD in your .env file.
"""
import smtplib
import logging
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

# --- SMTP Configuration (loaded from app.config) ---
from app.config import settings
SMTP_HOST = settings.SMTP_HOST
SMTP_PORT = settings.SMTP_PORT
SMTP_EMAIL = settings.SMTP_EMAIL
SMTP_PASSWORD = settings.SMTP_PASSWORD
SMTP_ENABLED = settings.SMTP_ENABLED

def send_html_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Sends a real HTML email to the given recipient.
    Falls back to log file if SMTP is not configured.
    
    Returns True if sent successfully, False otherwise.
    """
    if not SMTP_ENABLED or not SMTP_EMAIL or not SMTP_PASSWORD:
        # Fallback: write to log file for local dev
        log_path = "/Users/apple/Documents/DCA-Agent/demo_emails.log"
        try:
            with open(log_path, "a") as f:
                f.write("\n" + "="*60 + "\n")
                f.write(f"📧 [EMAIL ENGINE] To: {to_email}\n")
                f.write(f"   Subject: {subject}\n")
                f.write(f"   Status: ⚠️  SMTP not configured — logged only\n")
                f.write("   → Set SMTP_ENABLED=true, SMTP_EMAIL, SMTP_PASSWORD in .env\n")
                f.write("="*60 + "\n")
            logger.warning(f"SMTP not configured. Email to {to_email} logged to file instead.")
        except Exception as e:
            logger.error(f"Could not write to log file: {e}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"DCA RevOps <{SMTP_EMAIL}>"
        msg["To"] = to_email

        # Attach plain-text fallback
        plain_text = f"{subject}\n\nPlease view this email in an HTML-capable email client."
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())

        logger.info(f"✅ Email sent successfully to {to_email}: {subject}")
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error("❌ SMTP Auth failed. Check SMTP_EMAIL and SMTP_PASSWORD in .env")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"❌ SMTP error sending to {to_email}: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error sending email to {to_email}: {e}")
        return False
