"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplates = exports.otpDisplay = void 0;
/* ---------------------------------------------------
   Base Layout (shared wrapper)
--------------------------------------------------- */
const baseLayout = (content) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Email</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:30px 15px;">
          <table width="100%" max-width="600" style="background:#ffffff;border-radius:10px;overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td style="background:#0d47a1;padding:20px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:22px;">
                  AfrozonAuto
                </h1>
              </td>
            </tr>
  
            <!-- Body -->
            <tr>
              <td style="padding:30px;color:#333;">
                ${content}
              </td>
            </tr>
  
            <!-- Footer -->
            <tr>
              <td style="background:#f1f1f1;padding:15px;text-align:center;font-size:12px;color:#777;">
                © ${new Date().getFullYear()} AfrozonAuto. All rights reserved.
              </td>
            </tr>
  
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
/* ---------------------------------------------------
   OTP Display (simple)
--------------------------------------------------- */
const otpDisplay = (otp) => baseLayout(`
      <h2 style="margin-top:0;">Verification Code</h2>
      <p>Please use the code below to continue:</p>
  
      <div style="
        margin:20px 0;
        font-size:28px;
        font-weight:bold;
        letter-spacing:6px;
        background:#e3f2fd;
        padding:15px;
        width:fit-content;
        border-radius:8px;
        color:#0d47a1;
      ">
        ${otp}
      </div>
  
      <p style="color:#666;">
        This code will expire shortly. Do not share it with anyone.
      </p>
    `);
exports.otpDisplay = otpDisplay;
/* ---------------------------------------------------
   OTP-based Emails (reset, recovery)
--------------------------------------------------- */
const otpTemplate = ({ subject, description, recipientName, otp, expirationMinutes, }) => baseLayout(`
      <h2 style="margin-top:0;">${subject}</h2>
  
      <p>Hello <strong>${recipientName !== null && recipientName !== void 0 ? recipientName : 'User'}</strong>,</p>
  
      <p>${description}</p>
  
      <div style="
        margin:20px 0;
        font-size:26px;
        font-weight:bold;
        background:#fff3e0;
        padding:15px;
        border-radius:8px;
        color:#e65100;
        width:fit-content;
      ">
        ${otp}
      </div>
  
      <p style="color:#666;">
        This code will expire in <strong>${expirationMinutes} minutes</strong>.
      </p>
  
      <p style="font-size:13px;color:#999;">
        If you did not initiate this request, you can safely ignore this email.
      </p>
    `);
/* ---------------------------------------------------
   Welcome Email (Vendor / Buyer)
--------------------------------------------------- */
const welcomeTemplate = ({ recipientName, ctaText, ctaUrl, }) => baseLayout(`
      <h2 style="margin-top:0;">Welcome to AfrozonAuto 🎉</h2>
  
      <p>Hello <strong>${recipientName}</strong>,</p>
  
      <p>
        We’re excited to have you on AfrozonAuto. Your account has been
        successfully created and you can now start exploring our platform.
      </p>
  
      <a href="${ctaUrl}" style="
        display:inline-block;
        margin:20px 0;
        padding:12px 22px;
        background:#0d47a1;
        color:#ffffff;
        text-decoration:none;
        border-radius:6px;
        font-weight:bold;
      ">
        ${ctaText}
      </a>
  
      <p style="font-size:13px;color:#777;">
        If the button doesn’t work, copy and paste this link into your browser:
        <br/>
        <span style="word-break:break-all;">${ctaUrl}</span>
      </p>
    `);
const sourcingRequestConfirmationTemplate = ({ recipientName, requestNumber, }) => baseLayout(`
      <h2 style="margin-top:0;">We've received your Find a Car request</h2>

      <p>Hello <strong>${recipientName}</strong>,</p>

      <p>
        Thank you for submitting your vehicle sourcing request. Our team will review your
        requirements and get back to you within 48 hours (weekdays; weekend requests by Monday)
        with options and a full landed cost to Nigeria.
      </p>

      <p><strong>Your reference number:</strong> <code style="background:#e8e8e8;padding:4px 8px;border-radius:4px;">${requestNumber}</code></p>
      <p style="font-size:13px;color:#666;">Please keep this number for your records and when contacting us.</p>

      <p style="margin-top:24px;">
        If you have any questions in the meantime, reply to this email or contact our support team.
      </p>

      <p>— The Afrozon AutoGlobal Team</p>
    `);
const adminCreatedUserTemplate = ({ recipientName, email, password, resetToken, loginUrl, resetUrl, }) => baseLayout(`
      <h2 style="margin-top:0;">Welcome to AfrozonAuto</h2>

      <p>Hello <strong>${recipientName}</strong>,</p>

      <p>
        An admin has created an account for you on AfrozonAuto. Below are your login credentials.
        We strongly recommend you change your password after your first login.
      </p>

      <table style="border-collapse:collapse;width:100%;margin:20px 0;">
        <tr>
          <td style="padding:10px;background:#f5f5f5;border-radius:4px;font-weight:bold;width:140px;">Email</td>
          <td style="padding:10px;background:#f5f5f5;border-radius:4px;">${email}</td>
        </tr>
        <tr>
          <td style="padding:10px;font-weight:bold;">Temporary Password</td>
          <td style="padding:10px;">
            <code style="background:#e3f2fd;padding:6px 12px;border-radius:4px;font-size:16px;color:#0d47a1;letter-spacing:2px;">${password}</code>
          </td>
        </tr>
      </table>

      <a href="${loginUrl}" style="
        display:inline-block;
        margin:10px 0 20px;
        padding:12px 22px;
        background:#0d47a1;
        color:#ffffff;
        text-decoration:none;
        border-radius:6px;
        font-weight:bold;
      ">
        Login to your account
      </a>

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />

      <h3 style="margin:0 0 8px;">Reset Your Password</h3>
      <p>
        Use the token below together with your email address to reset your password at any time.
      </p>

      <div style="
        margin:16px 0;
        font-size:24px;
        font-weight:bold;
        background:#fff3e0;
        padding:14px;
        border-radius:8px;
        color:#e65100;
        width:fit-content;
        letter-spacing:4px;
      ">
        ${resetToken}
      </div>

      <a href="${resetUrl}" style="
        display:inline-block;
        margin:10px 0;
        padding:10px 20px;
        background:#e65100;
        color:#ffffff;
        text-decoration:none;
        border-radius:6px;
        font-weight:bold;
        font-size:14px;
      ">
        Reset Password
      </a>

      <p style="font-size:13px;color:#999;margin-top:20px;">
        If you did not expect this email, please contact our support team immediately.
      </p>
    `);
/* ---------------------------------------------------
   Exported Templates
--------------------------------------------------- */
exports.emailTemplates = {
    passwordReset: (props) => otpTemplate(props),
    accountRecovery: (props) => otpTemplate(props),
    welcomeVendor: (props) => welcomeTemplate(props),
    welcomeBuyer: (props) => welcomeTemplate(props),
    sourcingRequestConfirmation: (props) => sourcingRequestConfirmationTemplate(props),
    adminCreatedUser: (props) => adminCreatedUserTemplate(props),
};
