const crypto = require('crypto');

const EMAIL_TOKEN_TTL_HOURS = Number(process.env.EMAIL_VERIFICATION_TTL_HOURS || 24);

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const createVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_TOKEN_TTL_HOURS * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
};

const getAppBaseUrl = () => {
  const raw = process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`;
  return raw.replace(/\/$/, '');
};

const getFrontendUrl = () => {
  const raw = process.env.FRONTEND_URL;
  return raw ? raw.replace(/\/$/, '') : '';
};

const buildVerificationUrl = (path, token) => {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}${path}?token=${encodeURIComponent(token)}`;
};

const buildVerificationEmail = ({ name, verifyUrl, roleLabel }) => {
  const appName = process.env.APP_NAME || 'CertiChain';
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const subject = `${appName} - Verify your ${roleLabel} email`;
  const logoUrl = process.env.EMAIL_LOGO_URL ? process.env.EMAIL_LOGO_URL.trim() : '';
  const supportEmail = process.env.SUPPORT_EMAIL
    || `support@${appName.replace(/\s+/g, '').toLowerCase()}.com`;

  const html = `
  <div style="background:#f5f6fb;padding:24px 0;font-family:'Segoe UI', Arial, sans-serif;color:#111827;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td style="background:linear-gradient(135deg,#6d28d9,#8b5cf6);padding:28px 32px;color:#fff;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="vertical-align:middle;">
                <h1 style="margin:0;font-size:22px;letter-spacing:0.2px;">${appName}</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Verify your email</p>
              </td>
              <td style="text-align:right;vertical-align:middle;">
                ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" style="height:28px;max-width:140px;object-fit:contain;"/>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px;">
          <h2 style="margin:0 0 8px;font-size:20px;">Almost there</h2>
          <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;">${greeting}<br/>Please verify your ${roleLabel} email to activate your account.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
            <p style="margin:0;font-size:14px;color:#475569;">This link expires in ${EMAIL_TOKEN_TTL_HOURS} hours.</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 32px 28px;">
          <a href="${verifyUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;">Verify Email</a>
          <p style="margin:14px 0 0;font-size:12px;color:#6b7280;line-height:1.5;">
            If the button does not work, copy and paste this link into your browser:<br/>
            <a href="${verifyUrl}" style="color:#6d28d9;word-break:break-all;">${verifyUrl}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#0f172a;color:#e2e8f0;padding:18px 32px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>${appName} - Secure blockchain certificate verification</div>
            <div style="opacity:0.7;">Need help? ${supportEmail}</div>
          </div>
        </td>
      </tr>
    </table>
  </div>
  `;

  const text = `${greeting}\n\nPlease verify your ${roleLabel} email by visiting:\n${verifyUrl}\n\nThis link expires in ${EMAIL_TOKEN_TTL_HOURS} hours.\nIf you did not create this account, you can ignore this email.`;

  return { subject, html, text };
};

const renderVerificationPage = ({ success, message, loginPath = '/login' }) => {
  const frontend = getFrontendUrl();
  const loginUrl = frontend ? `${frontend}${loginPath}` : '';
  const statusTitle = success ? 'Email verified' : 'Verification failed';
  const statusColor = success ? '#16a34a' : '#dc2626';

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${statusTitle}</title>
  </head>
  <body style="font-family: Arial, sans-serif; background: #f9fafb; color: #111827; padding: 32px;">
    <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
      <h2 style="margin-top: 0; color: ${statusColor};">${statusTitle}</h2>
      <p style="font-size: 15px;">${message}</p>
      ${loginUrl ? `<a href="${loginUrl}" style="display:inline-block;margin-top:12px;color:#4f46e5;text-decoration:none;">Go to login</a>` : ''}
    </div>
  </body>
  </html>`;
};

module.exports = {
  EMAIL_TOKEN_TTL_HOURS,
  hashToken,
  createVerificationToken,
  buildVerificationUrl,
  buildVerificationEmail,
  renderVerificationPage
};
