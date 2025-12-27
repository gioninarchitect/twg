/**
 * Tea With God - Email Service
 * Handles all transactional emails
 */

const nodemailer = require('nodemailer');

// Create transporter with SMTP settings from .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.log('[Email] SMTP connection error:', error.message);
  } else {
    console.log('[Email] SMTP server ready');
  }
});

/**
 * Send email with retry logic
 */
async function sendEmail(options) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Tea With God'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Sent to', options.to, '- MessageID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Email Templates
 */

// Base email wrapper with branding
function emailWrapper(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tea With God</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0D0D0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #1A1A1A; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.08); }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo-text { color: #D4AF37; font-size: 24px; font-weight: 600; font-family: Georgia, serif; }
    h1 { color: #FAFAFA; font-size: 28px; margin: 0 0 16px; font-family: Georgia, serif; }
    h2 { color: #D4AF37; font-size: 20px; margin: 24px 0 12px; }
    p { color: rgba(250,250,250,0.8); font-size: 16px; line-height: 1.6; margin: 0 0 16px; }
    .highlight-box { background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.3); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
    .code { font-size: 28px; font-weight: 700; color: #D4AF37; letter-spacing: 2px; font-family: monospace; }
    .btn { display: inline-block; background: #D4AF37; color: #0D0D0D; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px 4px; }
    .btn-secondary { background: transparent; color: #D4AF37; border: 2px solid #D4AF37; }
    .btn:hover { background: #F4E4BC; }
    .steps { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 24px; margin: 24px 0; }
    .step { display: flex; align-items: flex-start; margin-bottom: 16px; }
    .step-num { background: #D4AF37; color: #0D0D0D; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; margin-right: 16px; flex-shrink: 0; }
    .step-text { color: rgba(250,250,250,0.8); }
    .step-text strong { color: #FAFAFA; }
    .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 32px 0; }
    .footer { text-align: center; color: rgba(250,250,250,0.4); font-size: 13px; margin-top: 32px; }
    .footer a { color: #D4AF37; text-decoration: none; }
    .bank-details { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .bank-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .bank-row:last-child { border-bottom: none; }
    .bank-label { color: rgba(250,250,250,0.6); }
    .bank-value { color: #FAFAFA; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">Tea With God</span>
      </div>
      ${content}
      <div class="divider"></div>
      <div class="footer">
        <p>Questions? Reply to this email or WhatsApp us.</p>
        <p><a href="https://teawithgod.com">teawithgod.com</a></p>
        <p style="margin-top: 16px; font-style: italic; color: rgba(250,250,250,0.3);">
          "She was broken, but beautiful. Like pottery mended with gold."
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send Order Confirmation Email
 */
async function sendOrderConfirmation(order) {
  const planNames = {
    book: 'Book Access',
    journey: 'Journey Access',
    premium: 'Premium Access'
  };

  const content = `
    <h1>Order Received</h1>
    <p>Hi ${order.first_name},</p>
    <p>Thank you for your order. We've received your details and are ready for your payment.</p>

    <div class="highlight-box">
      <p style="margin: 0; color: rgba(250,250,250,0.6); font-size: 14px;">Your Order Reference</p>
      <p class="code" style="margin: 8px 0 0;">${order.order_ref}</p>
    </div>

    <h2>Payment Details</h2>
    <div class="bank-details">
      <div class="bank-row">
        <span class="bank-label">Bank</span>
        <span class="bank-value">First National Bank (FNB)</span>
      </div>
      <div class="bank-row">
        <span class="bank-label">Account Name</span>
        <span class="bank-value">Tea With God</span>
      </div>
      <div class="bank-row">
        <span class="bank-label">Account Number</span>
        <span class="bank-value">62812345678</span>
      </div>
      <div class="bank-row">
        <span class="bank-label">Branch Code</span>
        <span class="bank-value">250655</span>
      </div>
      <div class="bank-row" style="background: rgba(212,175,55,0.1); margin: 8px -20px -20px; padding: 12px 20px; border-radius: 0 0 12px 12px;">
        <span class="bank-label">Reference</span>
        <span class="bank-value" style="color: #D4AF37;">${order.order_ref}</span>
      </div>
    </div>

    <p><strong>Amount:</strong> R${order.amount}.00 (${planNames[order.plan] || order.plan})</p>

    <p style="color: rgba(250,250,250,0.6); font-size: 14px;">
      Please use your order reference (${order.order_ref}) when making payment so we can identify it.
    </p>

    <p style="text-align: center; margin-top: 32px;">
      <a href="https://teawithgod.com/checkout.html" class="btn">Upload Proof of Payment</a>
    </p>
  `;

  return sendEmail({
    to: order.email,
    subject: `Order Received - ${order.order_ref}`,
    html: emailWrapper(content),
  });
}

/**
 * Send Access Code Email (after payment verification)
 */
async function sendAccessCode(order, accessCode) {
  const content = `
    <h1>Payment Verified!</h1>
    <p>Hi ${order.first_name},</p>
    <p>Great news! Your payment has been verified and your access code is ready.</p>

    <div class="highlight-box">
      <p style="margin: 0; color: rgba(250,250,250,0.6); font-size: 14px;">Your Access Code</p>
      <p class="code" style="margin: 8px 0 0;">${accessCode}</p>
    </div>

    <h2>Get Started</h2>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Download the app</strong><br>Available on Android and as a Web App</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Open the app</strong><br>Create your account or continue as guest</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Enter your code</strong><br>Go to Settings and tap "Redeem Code"</div>
      </div>
      <div class="step" style="margin-bottom: 0;">
        <div class="step-num">4</div>
        <div class="step-text"><strong>Begin your journey</strong><br>All 40 days are now unlocked for you</div>
      </div>
    </div>

    <p style="text-align: center; margin-top: 32px;">
      <a href="https://play.google.com/store/apps/details?id=com.teawithgod" class="btn">Download for Android</a>
      <a href="https://teawithgod.com/app" class="btn btn-secondary">Open Web App</a>
    </p>

    <p style="color: rgba(250,250,250,0.6); font-size: 14px; text-align: center; margin-top: 24px;">
      Keep this code safe. You can use it to restore access on a new device.
    </p>
  `;

  return sendEmail({
    to: order.email,
    subject: `Your Tea With God Access Code`,
    html: emailWrapper(content),
  });
}

/**
 * Send Proof Received Confirmation
 */
async function sendProofReceived(order) {
  const content = `
    <h1>Payment Proof Received</h1>
    <p>Hi ${order.first_name},</p>
    <p>We've received your proof of payment for order <strong>${order.order_ref}</strong>.</p>

    <div class="highlight-box">
      <p style="margin: 0; color: rgba(250,250,250,0.8);">
        We're verifying your payment now.<br>
        You'll receive your access code within <strong>1-2 hours</strong> during business hours.
      </p>
    </div>

    <p style="color: rgba(250,250,250,0.6); font-size: 14px;">
      While you wait, you can download the app and explore the first 3 days for free.
    </p>

    <p style="text-align: center; margin-top: 24px;">
      <a href="https://play.google.com/store/apps/details?id=com.teawithgod" class="btn btn-secondary">Download App</a>
    </p>
  `;

  return sendEmail({
    to: order.email,
    subject: `Payment Proof Received - ${order.order_ref}`,
    html: emailWrapper(content),
  });
}

/**
 * Send B2B Organization Codes
 */
async function sendOrganizationCodes(org, codes) {
  const codesFormatted = codes.map(c => `<li style="padding: 4px 0;"><code style="background: rgba(212,175,55,0.1); padding: 4px 8px; border-radius: 4px; color: #D4AF37;">${c}</code></li>`).join('');

  const content = `
    <h1>Your Access Codes</h1>
    <p>Hi ${org.contact_name || 'Partner'},</p>
    <p>Here are ${codes.length} access codes for <strong>${org.name}</strong>.</p>

    <div class="highlight-box" style="text-align: left;">
      <p style="margin: 0 0 12px; color: rgba(250,250,250,0.6); font-size: 14px;">Access Codes:</p>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${codesFormatted}
      </ul>
    </div>

    <h2>Distribution</h2>
    <p>Share these codes with your members. Each code can only be used once.</p>

    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Forward this email</strong> or copy codes to share</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Members download the app</strong> from Play Store or web</div>
      </div>
      <div class="step" style="margin-bottom: 0;">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Members enter their code</strong> in Settings > Redeem Code</div>
      </div>
    </div>

    <p style="color: rgba(250,250,250,0.6); font-size: 14px;">
      Need more codes? Reply to this email or visit your partner dashboard.
    </p>
  `;

  return sendEmail({
    to: org.contact_email,
    subject: `Your Tea With God Access Codes (${codes.length})`,
    html: emailWrapper(content),
  });
}

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendAccessCode,
  sendProofReceived,
  sendOrganizationCodes,
};
