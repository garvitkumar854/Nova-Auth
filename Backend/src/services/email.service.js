const nodemailer = require('nodemailer');
const config = require('../config/config');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: config.GOOGLE_USER,
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        refreshToken: config.GOOGLE_REFRESH_TOKEN
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Error setting up email transporter:', error);
    } else {
        console.log('Email transporter is ready to send emails.');
    }
});

async function sendOTPEmail(to, otp) {
    try {
        const info = await transporter.sendMail({
            from: config.GOOGLE_USER,
            to,
            subject: 'Your Nova Auth verification code',
            text: `Nova Auth email verification\n\nYour one-time code is: ${otp}\n\nThis code expires in 10 minutes.\nIf you did not request this, you can safely ignore this email.`,
            html: `
                <div style="margin:0; padding:24px 0; background:#f4f7fb; font-family:Arial,Helvetica,sans-serif; color:#1f2937;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden;">
                        <tr>
                            <td style="padding:28px 28px 18px; background:linear-gradient(135deg, #0f766e 0%, #155e75 100%); color:#ffffff;">
                                <h1 style="margin:0; font-size:22px; line-height:1.3;">Nova Auth Verification</h1>
                                <p style="margin:8px 0 0; font-size:14px; opacity:0.95;">Use the code below to complete your sign in.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:26px 28px 22px;">
                                <p style="margin:0 0 14px; font-size:15px; color:#111827;">Hello,</p>
                                <p style="margin:0 0 18px; font-size:15px; color:#374151;">Here is your one-time verification code:</p>
                                <div style="display:inline-block; padding:14px 20px; border:1px dashed #0f766e; background:#ecfeff; border-radius:10px; font-size:30px; letter-spacing:8px; font-weight:700; color:#0f766e;">${otp}</div>
                                <p style="margin:18px 0 0; font-size:14px; color:#4b5563;">This code expires in <strong>10 minutes</strong>.</p>
                                <p style="margin:8px 0 0; font-size:14px; color:#6b7280;">If you did not request this code, you can safely ignore this email.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:18px 28px 24px; border-top:1px solid #e5e7eb; background:#f9fafb;">
                                <p style="margin:0; font-size:12px; color:#6b7280;">For your security, never share this code with anyone.</p>
                                <p style="margin:8px 0 0; font-size:12px; color:#9ca3af;">Nova Auth</p>
                            </td>
                        </tr>
                    </table>
                </div>
            `
        });
        console.log('OTP email sent:', info.messageId);
    } catch (error) {
        console.log('Error sending OTP email:', error);
    }
}

module.exports = {
    sendOTPEmail
}