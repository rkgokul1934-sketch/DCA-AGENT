def get_reminder_email_content(booking, reminder_type):
    """
    Generates premium HTML content for demo reminders.
    """
    templates = {
        "30min": {
            "subject": f"🔥 Starting in 30m: {booking.meeting_title}",
            "body": f"""
                <html>
                <body style="font-family: sans-serif; color: #1e293b; line-height: 1.6;">
                    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                        <div style="background: #6366f1; padding: 30px; text-align: center; color: white;">
                            <h1 style="margin: 0; font-size: 24px;">Your Demo Starts Soon!</h1>
                        </div>
                        <div style="padding: 40px;">
                            <p>Hi {booking.name},</p>
                            <p>This is a quick reminder that your <strong>{booking.meeting_title}</strong> with our enterprise team is starting in just 30 minutes.</p>
                            
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                                <p style="margin: 5px 0;"><strong>📅 Date:</strong> {booking.booking_date}</p>
                                <p style="margin: 5px 0;"><strong>⏰ Time:</strong> {booking.booking_time} ({booking.timezone})</p>
                            </div>
                            
                            <p>We've prepared a custom strategy walkthrough based on your interest in <strong>{booking.company_name}</strong>'s revenue optimization.</p>
                            
                            <a href="{booking.meeting_link}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Join Meeting Now</a>
                            
                            <p style="margin-top: 40px; font-size: 14px; color: #64748b;">
                                Need to move the meeting? <a href="/reschedule/{booking.reschedule_token}">Reschedule here</a>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            """
        },
        "confirmation": {
            "subject": f"✅ Confirmed: {booking.meeting_title}",
            "body": f"""
                <html>
                <body style="font-family: sans-serif; color: #1e293b; line-height: 1.6;">
                    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                        <div style="background: #10b981; padding: 30px; text-align: center; color: white;">
                            <h1 style="margin: 0; font-size: 24px;">Demo Confirmed!</h1>
                        </div>
                        <div style="padding: 40px;">
                            <p>Hi {booking.name},</p>
                            <p>Great news! Your <strong>{booking.meeting_title}</strong> has been successfully scheduled and we've reserved your slot.</p>
                            
                            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #dcfce7;">
                                <p style="margin: 5px 0;"><strong>📅 Date:</strong> {booking.booking_date}</p>
                                <p style="margin: 5px 0;"><strong>⏰ Time:</strong> {booking.booking_time} ({booking.timezone})</p>
                                <p style="margin: 5px 0;"><strong>🔗 Link:</strong> <a href="{booking.meeting_link}">{booking.meeting_link}</a></p>
                            </div>
                            
                            <p>We've assigned one of our senior GTM specialists to lead this strategy session. We'll be reviewing your goals for <strong>{booking.company_name}</strong> and showcasing how our intelligence engine can accelerate your revenue.</p>
                            
                            <p style="margin-top: 40px; font-size: 14px; color: #64748b;">
                                You'll receive another reminder 30 minutes before we start. 
                                <br>Need to change something? <a href="/reschedule/{booking.reschedule_token}">Reschedule your demo here</a>.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            """
        }
    }
    
    return templates.get(reminder_type, templates["30min"])
