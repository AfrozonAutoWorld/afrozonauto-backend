import nodemailer, { Transporter } from 'nodemailer';
import { MAIL_HOST, MAIL_USERNAME, MAIL_PORT, FROM_EMAIL, MAIL_PASSWORD } from "../secrets"
import logger from "./loggers";
import { ApiError } from './ApiError';

// Singleton transporter instance
let transporter: Transporter | null = null;

/**
 * Get or create nodemailer transporter
 */
export const getTransporter = (): Transporter => {
  if (!transporter) {
    // Validate required environment variables
    if (!MAIL_HOST) {
      throw ApiError.internal(
        'MAIL_HOST is not configured. Please set MAIL_HOST in the environment variables.'
      );
    }

    if (!FROM_EMAIL) {
      throw ApiError.internal(
        'FROM_EMAIL is not configured. Please set FROM_EMAIL in the environment variables.'
      );
    }

    const port = Number(MAIL_PORT) || 587; // Default to 587 for TLS
    const isSecure = port === 465; // Only 465 uses SSL, 587 uses TLS

    // Determine authentication user (prefer MAIL_USERNAME, fallback to FROM_EMAIL)
    const authUser = MAIL_USERNAME || FROM_EMAIL;

    // Configuration object
    const config: any = {
      host: MAIL_HOST || "mail.privateemail.com",
      port: port,
      secure: isSecure, // true for 465, false for 587
    };

    // Add authentication if credentials are provided
    if (authUser && MAIL_PASSWORD) {
      config.auth = {
        user: authUser,
        pass: MAIL_PASSWORD,
      };
    }

    // TLS configuration for port 587
    if (port === 587) {
      config.tls = {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      };
      config.requireTLS = true;
    } else if (port === 465) {
      // SSL configuration for port 465
      config.tls = {
        rejectUnauthorized: false,
      };
    }

    logger.info('Creating email transporter with config:', {
      host: MAIL_HOST,
      port: port,
      secure: isSecure,
      authUser: authUser,
      hasPassword: !!MAIL_PASSWORD
    });

    transporter = nodemailer.createTransport(config);
  }

  return transporter;
};

export const mailerActive = async () => {
  const transporter = getTransporter();
  try {
    await transporter.verify();
    logger.info("✅ Mail server is ready to take messages");
  } catch (error: any) {
    logger.error("🙈 Mail server connection failed:", error);
    throw ApiError.internal( error.message || "Mail server is not available");
  }
}
// Helper function to create text version from HTML
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

const sendMail = async (to: string, subject: string, html: string, textContent?: string) => {

  const transporter = getTransporter();
  const mailOptions = {
    from: FROM_EMAIL,
    to: to,
    subject: subject,
    html: html,
    text: textContent || stripHtml(html)
  };

  logger.info(`Sending mail to - ${to}`);
  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      logger.error(error);
    } else {
      logger.info('Email sent: ' + info.response);
    }
  });
}


export default sendMail
