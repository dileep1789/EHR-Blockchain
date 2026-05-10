// Contact Email Templates - Matching the style of verification emails

const escapeHtml = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');
};

const getAppName = () => process.env.APP_NAME || 'CertiChain';
const getSupportEmail = () => {
  const appName = getAppName();
  return process.env.SUPPORT_EMAIL || 
         process.env.ADMIN_EMAIL || 
         `support@${appName.replace(/\s+/g, '').toLowerCase()}.com`;
};

// Email to admin with contact message details
const buildContactAdminEmail = ({ name, email, subject, message }) => {
  const appName = getAppName();
  const logoUrl = process.env.EMAIL_LOGO_URL ? process.env.EMAIL_LOGO_URL.trim() : '';
  const escapedName = escapeHtml(name);
  const escapedEmail = escapeHtml(email);
  const escapedSubject = escapeHtml(subject);
  const escapedMessage = escapeHtml(message);
  const timestamp = new Date().toLocaleString('en-US', { 
    dateStyle: 'full', 
    timeStyle: 'long',
    timeZone: 'UTC'
  });

  const emailSubject = `${appName} - New Contact Message: ${subject}`;

  const html = `
  <div style="background:#f5f6fb;padding:24px 0;font-family:'Segoe UI', Arial, sans-serif;color:#111827;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td style="background:linear-gradient(135deg,#6d28d9,#8b5cf6);padding:28px 32px;color:#fff;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="vertical-align:middle;">
                <h1 style="margin:0;font-size:22px;letter-spacing:0.2px;">${appName}</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">New Contact Message</p>
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
          <h2 style="margin:0 0 8px;font-size:20px;">Contact Form Submission</h2>
          <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;color:#475569;">
            You have received a new message from your contact form.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:16px;">
            <p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Sender Information</p>
            <p style="margin:0 0 4px;font-size:14px;"><strong>Name:</strong> ${escapedName}</p>
            <p style="margin:0 0 4px;font-size:14px;"><strong>Email:</strong> <a href="mailto:${escapedEmail}" style="color:#6d28d9;">${escapedEmail}</a></p>
            <p style="margin:0;font-size:12px;color:#64748b;"><strong>Time:</strong> ${timestamp}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px;">
          <div style="background:#ffffff;border:2px solid #e2e8f0;border-radius:14px;padding:16px;">
            <p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Subject</p>
            <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${escapedSubject}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 28px;">
          <div style="background:#ffffff;border:2px solid #e2e8f0;border-radius:14px;padding:16px;">
            <p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#1f2937;white-space:pre-wrap;">${escapedMessage}</p>
          </div>
          <div style="margin-top:16px;padding:12px;background:#fef3c7;border:1px solid #fde047;border-radius:10px;">
            <p style="margin:0;font-size:13px;color:#92400e;">
              <strong>Action Required:</strong> Please reply to this inquiry at your earliest convenience.
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:#0f172a;color:#e2e8f0;padding:18px 32px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>${appName} - Secure blockchain certificate verification</div>
            <div style="opacity:0.7;">Admin Dashboard</div>
          </div>
        </td>
      </tr>
    </table>
  </div>
  `;

  const text = `
${appName} - New Contact Message

SENDER INFORMATION
Name: ${name}
Email: ${email}
Time: ${timestamp}

SUBJECT
${subject}

MESSAGE
${message}

---
Please reply to this inquiry at your earliest convenience.
Reply to: ${email}
  `;

  return { subject: emailSubject, html, text };
};

// Email to user confirming message receipt
const buildContactUserCopyEmail = ({ name, email, subject, message }) => {
  const appName = getAppName();
  const logoUrl = process.env.EMAIL_LOGO_URL ? process.env.EMAIL_LOGO_URL.trim() : '';
  const supportEmail = getSupportEmail();
  const escapedName = escapeHtml(name);
  const escapedSubject = escapeHtml(subject);
  const escapedMessage = escapeHtml(message);
  const greeting = name ? `Hi ${name},` : 'Hi,';

  const emailSubject = `${appName} - We received your message`;

  const html = `
  <div style="background:#f5f6fb;padding:24px 0;font-family:'Segoe UI', Arial, sans-serif;color:#111827;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td style="background:linear-gradient(135deg,#6d28d9,#8b5cf6);padding:28px 32px;color:#fff;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="vertical-align:middle;">
                <h1 style="margin:0;font-size:22px;letter-spacing:0.2px;">${appName}</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Thank you for contacting us</p>
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
          <h2 style="margin:0 0 8px;font-size:20px;">Message Received</h2>
          <p style="margin:0 0 16px;font-size:14.5px;line-height:1.6;">
            ${greeting}<br/>
            Thank you for reaching out to us. We have received your message and will respond as soon as possible.
          </p>
          <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:14px;padding:16px;">
            <p style="margin:0;font-size:14px;color:#1e40af;">
              <strong>📧 Response Time:</strong> We typically respond within 24-48 hours during business days.
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px;">
          <h3 style="margin:0 0 12px;font-size:15px;color:#64748b;">Copy of Your Message</h3>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:12px;">
            <p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Subject</p>
            <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${escapedSubject}</p>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
            <p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#1f2937;white-space:pre-wrap;">${escapedMessage}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 28px;">
          <div style="background:#fef3c7;border:1px solid #fde047;border-radius:12px;padding:16px;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#854d0e;">Need Immediate Assistance?</p>
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
              If your inquiry is urgent, please contact us directly at:<br/>
              <a href="mailto:${supportEmail}" style="color:#6d28d9;font-weight:600;">${supportEmail}</a>
            </p>
          </div>
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

  const text = `
${greeting}

Thank you for contacting ${appName}. We have received your message and will respond as soon as possible.

RESPONSE TIME
We typically respond within 24-48 hours during business days.

COPY OF YOUR MESSAGE
Subject: ${subject}

Message:
${message}

---
If your inquiry is urgent, please contact us directly at: ${supportEmail}

${appName} - Secure blockchain certificate verification
  `;

  return { subject: emailSubject, html, text };
};

module.exports = {
  buildContactAdminEmail,
  buildContactUserCopyEmail
};
