import nodemailer from 'nodemailer';
import { db } from './db.js';

export class EmailServiceError extends Error {
  code: string;
  isConfigurationError: boolean;
  actionUrl?: string;
  detectedIp?: string;

  constructor(
    code: string,
    message: string,
    isConfigurationError: boolean = false,
    actionUrl?: string,
    detectedIp?: string
  ) {
    super(message);
    this.name = 'EmailServiceError';
    this.code = code;
    this.isConfigurationError = isConfigurationError;
    this.actionUrl = actionUrl;
    this.detectedIp = detectedIp;
  }
}

export interface SendEmailOptions {
  to: string;
  customerName?: string;
  subject: string;
  html: string;
  text: string;
  fromName?: string;
  fromEmail?: string;
}

export interface SendOtpOptions {
  to: string;
  customerName: string;
  otp: string;
  validityMinutes?: number;
}

/**
 * Inspect active configuration for transactional email providers
 */
export function getEmailProviderStatus() {
  const settings = db.getSettings();

  const brevoApiKey = process.env.BREVO_API_KEY || settings.brevoApiKey;
  const smtpHost = !brevoApiKey ? (process.env.SMTP_HOST || settings.smtpHost) : undefined;

  let provider: 'brevo' | 'smtp' | 'none' = 'none';
  if (brevoApiKey) provider = 'brevo';
  else if (smtpHost) provider = 'smtp';

  const fromAddress = process.env.EMAIL_FROM || settings.emailSenderAddress || 'support@notesvidya.com';
  const fromName = process.env.EMAIL_FROM_NAME || settings.emailSenderName || 'NotesVidya';

  return {
    isConfigured: provider !== 'none',
    provider,
    fromAddress,
    fromName
  };
}

/**
 * Extract clean email address from RFC format (e.g. "NotesVidya <support@notesvidya.com>" -> "support@notesvidya.com")
 */
function extractEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return raw.trim();
}

/**
 * Send email via Brevo Transactional Email API (POST https://api.brevo.com/v3/smtp/email)
 */
async function sendViaBrevo(
  apiKey: string,
  fromName: string,
  fromEmail: string,
  toEmail: string,
  toName: string,
  subject: string,
  html: string,
  text: string
): Promise<{ id: string }> {
  const cleanFromEmail = extractEmailAddress(fromEmail);
  const cleanToEmail = extractEmailAddress(toEmail).toLowerCase();

  const payload = {
    sender: {
      name: fromName || 'NotesVidya',
      email: cleanFromEmail
    },
    to: [
      {
        email: cleanToEmail,
        name: toName || cleanToEmail
      }
    ],
    subject,
    htmlContent: html,
    textContent: text
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey.trim()
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.message || errorJson.code || JSON.stringify(errorJson);
    } catch {
      errorDetail = await response.text().catch(() => '');
    }

    // Check for Brevo Authorised IPs restriction (HTTP 401 with unrecognised IP)
    const lowerDetail = errorDetail.toLowerCase();
    if (
      response.status === 401 &&
      (lowerDetail.includes('unrecognised ip') ||
        lowerDetail.includes('unrecognized ip') ||
        lowerDetail.includes('authorised_ips') ||
        lowerDetail.includes('authorized_ips'))
    ) {
      const ipMatch = errorDetail.match(/address\s+([a-fA-F0-9:.]+)/i);
      const detectedIp = ipMatch ? ipMatch[1] : '';
      throw new EmailServiceError(
        'BREVO_IP_NOT_AUTHORIZED',
        `Brevo API rejected delivery with HTTP 401: We have detected you are using an unrecognised IP address ${detectedIp}. If you performed this action make sure to add the new IP address or turn OFF "Authorized IP addresses" in your Brevo security settings: https://app.brevo.com/security/authorised_ips`,
        true,
        'https://app.brevo.com/security/authorised_ips',
        detectedIp
      );
    }

    if (response.status === 401) {
      throw new EmailServiceError(
        'BREVO_INVALID_API_KEY',
        `Brevo API rejected delivery with HTTP 401: Invalid or unauthorized API key. ${errorDetail}`,
        true
      );
    }

    throw new EmailServiceError('BREVO_API_ERROR', `Brevo API rejected delivery with HTTP ${response.status}: ${errorDetail}`);
  }

  const result: any = await response.json().catch(() => ({}));
  return { id: result.messageId || 'brevo-dispatched' };
}

/**
 * Send email via SMTP using Nodemailer (fallback only when Brevo is not configured or Brevo API fails)
 */
async function sendViaSmtp(options: SendEmailOptions, host: string, port: number, user?: string, pass?: string, secure?: boolean) {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: secure || port === 465,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000
  });

  const fromFormatted = `${options.fromName || 'NotesVidya'} <${options.fromEmail || 'support@notesvidya.com'}>`;

  const info = await transporter.sendMail({
    from: fromFormatted,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  });

  return info;
}

/**
 * Main transactional email dispatcher
 */
export async function sendTransactionalEmail(options: SendEmailOptions): Promise<{ provider: string; id?: string }> {
  const settings = db.getSettings();

  const brevoApiKey = process.env.BREVO_API_KEY || settings.brevoApiKey;
  const fromName = options.fromName || process.env.EMAIL_FROM_NAME || settings.emailSenderName || 'NotesVidya';
  const rawFrom = options.fromEmail || process.env.EMAIL_FROM || settings.emailSenderAddress || 'support@notesvidya.com';
  const cleanFromEmail = extractEmailAddress(rawFrom);

  // 1. Primary & required provider: Brevo API
  if (brevoApiKey) {
    try {
      const result = await sendViaBrevo(
        brevoApiKey,
        fromName,
        cleanFromEmail,
        options.to,
        options.customerName || options.to,
        options.subject,
        options.html,
        options.text
      );
      return { provider: 'brevo', id: result.id };
    } catch (brevoErr: any) {
      // Check if SMTP fallback is configured (e.g. Brevo SMTP Relay smtp-relay.brevo.com or standard SMTP)
      const smtpHost = process.env.SMTP_HOST || settings.smtpHost;
      if (smtpHost) {
        console.warn('Brevo API delivery failed, attempting configured SMTP fallback:', brevoErr.message);
        try {
          const port = Number(process.env.SMTP_PORT || settings.smtpPort || 587);
          const user = process.env.SMTP_USER || settings.smtpUser;
          const pass = process.env.SMTP_PASS || settings.smtpPass;
          const secure = process.env.SMTP_SECURE === 'true' || !!settings.smtpSecure;

          const info = await sendViaSmtp(
            { ...options, fromEmail: cleanFromEmail, fromName },
            smtpHost,
            port,
            user,
            pass,
            secure
          );
          return { provider: 'smtp', id: info.messageId };
        } catch (smtpErr: any) {
          console.error('SMTP fallback also failed:', smtpErr.message);
        }
      }
      throw brevoErr;
    }
  }

  // 2. SMTP fallback ONLY if Brevo is not configured
  const smtpHost = process.env.SMTP_HOST || settings.smtpHost;
  if (smtpHost) {
    const port = Number(process.env.SMTP_PORT || settings.smtpPort || 587);
    const user = process.env.SMTP_USER || settings.smtpUser;
    const pass = process.env.SMTP_PASS || settings.smtpPass;
    const secure = process.env.SMTP_SECURE === 'true' || !!settings.smtpSecure;

    const info = await sendViaSmtp(
      { ...options, fromEmail: cleanFromEmail, fromName },
      smtpHost,
      port,
      user,
      pass,
      secure
    );
    return { provider: 'smtp', id: info.messageId };
  }

  // Not configured: Real Brevo credentials required
  throw new EmailServiceError(
    'BREVO_NOT_CONFIGURED',
    'Brevo API key (BREVO_API_KEY) is not configured. Please set BREVO_API_KEY and EMAIL_FROM in environment variables or Store Settings to send customer verification OTP emails.',
    true
  );
}

/**
 * Render official NotesVidya OTP email HTML and Plain Text templates
 */
export function renderOtpEmailTemplate(params: SendOtpOptions) {
  const { customerName, otp, validityMinutes = 10 } = params;
  const settings = db.getSettings();
  const supportEmail = settings.contactEmail || 'support@notesvidya.com';

  const subject = 'Your NotesVidya Verification OTP';

  const text = `NotesVidya
Email Verification

Hello ${customerName},

Thank you for choosing NotesVidya - Your Digital Library of Knowledge.

Your 6-digit OTP is: ${otp}
OTP validity: ${validityMinutes} minutes
Do not share this OTP with anyone.

If you did not request this verification code, please ignore this email or reach our support team at ${supportEmail}.

Warm regards,
NotesVidya Team
https://notesvidya.com
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your NotesVidya Verification OTP</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    .wrapper { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #4338ca 0%, #312e81 100%); padding: 32px 24px; text-align: center; }
    .brand-title { color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .brand-sub { color: #c7d2fe; font-size: 13px; font-weight: 500; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .intro { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .otp-card { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 14px; padding: 24px; text-align: center; margin: 28px 0; }
    .otp-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #4338ca; margin-bottom: 8px; }
    .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #4338ca; font-family: 'Courier New', Courier, monospace; display: inline-block; padding: 4px 12px; }
    .otp-expiry { font-size: 13px; font-weight: 600; color: #475569; margin-top: 10px; }
    .security-notice { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 6px; font-size: 13px; line-height: 1.5; color: #991b1b; margin-bottom: 24px; }
    .support-info { font-size: 12px; line-height: 1.5; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">NotesVidya</h1>
      <div class="brand-sub">Email Verification</div>
    </div>
    
    <div class="body">
      <div class="greeting">Hello ${customerName},</div>
      
      <p class="intro">
        Thank you for choosing NotesVidya. To complete your account verification, please enter your 6-digit OTP:
      </p>
      
      <div class="otp-card">
        <div class="otp-label">Your 6-digit OTP</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">OTP validity: <strong>${validityMinutes} minutes</strong></div>
      </div>
      
      <div class="security-notice">
        <strong>Security Notice:</strong> Do not share this OTP with anyone. NotesVidya representatives will never ask for your verification code or password.
      </div>
      
      <div class="support-info">
        If you did not attempt to register at NotesVidya, please disregard this email. For assistance, contact our support desk at <a href="mailto:${supportEmail}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">${supportEmail}</a>.
      </div>
    </div>
    
    <div class="footer">
      <div>&copy; 2025 NotesVidya. All rights reserved.</div>
      <div style="margin-top: 4px;">NotesVidya Knowledge Center &bull; Bengaluru, India</div>
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

/**
 * Generate and dispatch official NotesVidya OTP verification email
 */
export async function sendOtpVerificationEmail(params: SendOtpOptions): Promise<{ provider: string; id?: string }> {
  const { to, customerName, otp, validityMinutes = 10 } = params;
  const { subject, html: htmlContent, text: textContent } = renderOtpEmailTemplate(params);

  // Dispatch real email
  const result = await sendTransactionalEmail({
    to,
    customerName,
    subject,
    html: htmlContent,
    text: textContent
  });

  // Record outbound notification in database audit log (without logging the plain OTP in logs)
  try {
    db.addEmail({
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientEmail: to,
      recipientName: customerName,
      subject,
      type: 'otp_verification',
      contentSnippet: `Account verification OTP dispatched (expires in ${validityMinutes} min). Provider: ${result.provider}`,
      sentAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to record email audit record:', err);
  }

  return result;
}
