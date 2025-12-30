
interface BaseEmailProps {
    subject: string;
    description?: string;
    recipientName?: string;
  }
  
  interface OtpEmailProps extends BaseEmailProps {
    otp: string;
    expirationMinutes: number;
  }
  
  interface WelcomeEmailProps {
    recipientName: string;
    ctaText: string;
    ctaUrl: string;
  }
  
  /* ---------------------------------------------------
     Base Layout (shared wrapper)
  --------------------------------------------------- */
  const baseLayout = (content: string) => `
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
  export const otpDisplay = (otp: string) =>
    baseLayout(`
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
  
  /* ---------------------------------------------------
     OTP-based Emails (reset, recovery)
  --------------------------------------------------- */
  const otpTemplate = ({
    subject,
    description,
    recipientName,
    otp,
    expirationMinutes,
  }: OtpEmailProps) =>
    baseLayout(`
      <h2 style="margin-top:0;">${subject}</h2>
  
      <p>Hello <strong>${recipientName ?? 'User'}</strong>,</p>
  
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
  const welcomeTemplate = ({
    recipientName,
    ctaText,
    ctaUrl,
  }: WelcomeEmailProps) =>
    baseLayout(`
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
  
  /* ---------------------------------------------------
     Exported Templates
  --------------------------------------------------- */
  export const emailTemplates = {
    passwordReset: (props: OtpEmailProps) =>
      otpTemplate(props),
  
    accountRecovery: (props: OtpEmailProps) =>
      otpTemplate(props),
  
    welcomeVendor: (props: WelcomeEmailProps) =>
      welcomeTemplate(props),
  
    welcomeBuyer: (props: WelcomeEmailProps) =>
      welcomeTemplate(props),
  };
  