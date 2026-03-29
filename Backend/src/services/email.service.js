const nodemailer = require('nodemailer');
const config = require('../config/config');

let isEmailTransportReady = false;
let transporter = null;

function createTransporter() {
    const hasBrevoConfig =
        config.BREVO_SMTP_HOST &&
        config.BREVO_SMTP_USER &&
        config.BREVO_SMTP_PASS;

    if (hasBrevoConfig) {
        console.log('Email provider selected: Brevo SMTP');
        return nodemailer.createTransport({
            host: config.BREVO_SMTP_HOST,
            port: Number(config.BREVO_SMTP_PORT || 587),
            secure: false,
            auth: {
                user: config.BREVO_SMTP_USER,
                pass: config.BREVO_SMTP_PASS,
            },
        });
    }

    const hasGoogleConfig =
        config.GOOGLE_USER &&
        config.GOOGLE_CLIENT_ID &&
        config.GOOGLE_CLIENT_SECRET &&
        config.GOOGLE_REFRESH_TOKEN;

    if (hasGoogleConfig) {
        console.log('Email provider selected: Gmail OAuth2');
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: config.GOOGLE_USER,
                clientId: config.GOOGLE_CLIENT_ID,
                clientSecret: config.GOOGLE_CLIENT_SECRET,
                refreshToken: config.GOOGLE_REFRESH_TOKEN,
            },
        });
    }

    return null;
}

function getFromAddress() {
    return config.EMAIL_FROM || config.BREVO_SMTP_USER || config.GOOGLE_USER;
}

async function ensureTransportReady() {
    if (!transporter) {
        transporter = createTransporter();
    }

    if (!transporter) {
        isEmailTransportReady = false;
        throw new Error('Email provider is not configured');
    }

    try {
        await transporter.verify();
        isEmailTransportReady = true;
        return transporter;
    } catch (error) {
        isEmailTransportReady = false;
        console.error('Error verifying email transporter:', error);
        throw error;
    }
}

function getEmailTransportStatus() {
    return isEmailTransportReady;
}

function buildEmailLayout({ preheader, title, subtitle, bodyHtml, accent = '#0f766e' }) {
    return `
        <div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</div>
        <div style="margin:0;padding:28px 0;background:radial-gradient(circle at top left,#e0f2fe 0%,#f8fafc 40%,#eef2ff 100%);font-family:'Trebuchet MS','Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;margin:0 auto;padding:0 14px;">
                <tr>
                    <td>
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:18px;overflow:hidden;background:#ffffff;border:1px solid #dbeafe;box-shadow:0 14px 45px rgba(15,23,42,0.08);">
                            <tr>
                                <td style="padding:30px 30px 24px;background:linear-gradient(120deg, ${accent} 0%, #1d4ed8 100%);color:#ffffff;">
                                    <p style="margin:0;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;opacity:0.9;">Nova Auth</p>
                                    <h1 style="margin:10px 0 0;font-size:28px;line-height:1.25;font-weight:700;">${title}</h1>
                                    <p style="margin:10px 0 0;font-size:15px;line-height:1.6;opacity:0.96;">${subtitle}</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:28px 30px 26px;">
                                    ${bodyHtml}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:18px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                                    <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">This is an automated security email from Nova Auth.</p>
                                    <p style="margin:6px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">Please do not reply directly to this message.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    `;
}

async function sendOTPEmail(to, otp) {
    try {
        const activeTransporter = await ensureTransportReady();
        const from = getFromAddress();

        if (!from) {
            throw new Error('EMAIL_FROM is not configured');
        }

        const otpBody = `
            <p style="margin:0 0 14px;font-size:16px;line-height:1.75;color:#1e293b;">Use this one-time passcode to verify your email address and secure your account.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 14px;">
                <tr>
                    <td style="padding:16px 24px;border-radius:12px;background:#ecfeff;border:1px solid #99f6e4;">
                        <span style="font-size:34px;line-height:1;letter-spacing:8px;font-weight:800;color:#0f766e;">${otp}</span>
                    </td>
                </tr>
            </table>
            <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#334155;">This code expires in <strong>10 minutes</strong>.</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">If you did not request this code, you can ignore this email and your account remains safe.</p>
        `;

        const info = await activeTransporter.sendMail({
            from,
            to,
            subject: 'Nova Auth verification code',
            text: `Nova Auth verification\n\nYour one-time code is: ${otp}\nThis code expires in 10 minutes.\n\nIf you did not request this code, you can ignore this email.`,
            html: buildEmailLayout({
                preheader: 'Use this secure code to verify your Nova Auth account.',
                title: 'Verify Your Email',
                subtitle: 'Complete your signup by entering the one-time code below.',
                bodyHtml: otpBody,
                accent: '#0f766e',
            }),
        });
        isEmailTransportReady = true;
        console.log('OTP email sent:', info.messageId);
    } catch (error) {
        isEmailTransportReady = false;
        console.error('Error sending OTP email:', error);
        throw error;
    }
}

async function sendEmailVerifiedEmail(to) {
    try {
        const activeTransporter = await ensureTransportReady();
        const from = getFromAddress();

        if (!from) {
            throw new Error('EMAIL_FROM is not configured');
        }

        const verifiedBody = `
            <p style="margin:0 0 14px;font-size:16px;line-height:1.75;color:#1e293b;">Great news. Your email has been verified successfully and your Nova Auth account is now fully active.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 14px;">
                <tr>
                    <td style="padding:12px 16px;border-radius:999px;background:#eff6ff;border:1px solid #bfdbfe;">
                        <span style="font-size:14px;font-weight:700;color:#1d4ed8;">Status: Verified</span>
                    </td>
                </tr>
            </table>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#334155;">You can now sign in and use all protected features.</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">If this verification was not done by you, please reset your password immediately.</p>
        `;

        const info = await activeTransporter.sendMail({
            from,
            to,
            subject: 'Your email is now verified - Nova Auth',
            text: `Nova Auth account update\n\nYour email has been verified successfully.\nYou can now sign in and access all features.\n\nIf you did not perform this action, reset your password immediately.`,
            html: buildEmailLayout({
                preheader: 'Your Nova Auth email verification is complete.',
                title: 'Email Verified Successfully',
                subtitle: 'Your account security setup is complete.',
                bodyHtml: verifiedBody,
                accent: '#1d4ed8',
            }),
        });

        isEmailTransportReady = true;
        console.log('Email verified notification sent:', info.messageId);
    } catch (error) {
        isEmailTransportReady = false;
        console.error('Error sending verified email notification:', error);
        throw error;
    }
}

module.exports = {
    sendOTPEmail,
    sendEmailVerifiedEmail,
    getEmailTransportStatus,
};