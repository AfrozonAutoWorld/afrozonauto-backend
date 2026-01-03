import sendMail from '../utils/mailer';
import { emailTemplates, otpDisplay } from '../utils/mailer.templates';
import { TOKEN_EXPIRY_MINUTES } from '../secrets';
import prisma from '../db';
import { inject, injectable } from 'inversify';
import { ApiError } from '../utils/ApiError';
import { TYPES } from '../config/types';
import { UserRepository } from '../repositories/UserRepository';
import { ProfileService } from './ProfileService';
import { TokenType } from '../types/customRequest';
import { Profile } from '../generated/prisma/client';


@injectable()
export class MailService {
  constructor(
    @inject(TYPES.AddressRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.ProfileService)
    private readonly profileService: ProfileService,
  ) { }

  async sendVerification(email: string, token: number) {

    const html = otpDisplay(token.toString())
    await sendMail(
      email,
      'Verify Your Email Address',
      html,
    )

  }
  async vendorWelcome(email: string,  recipientName: string, ctaText: string, ctaUrl: string) {

    const html = emailTemplates.welcomeVendor({
      recipientName,
      ctaText,
      ctaUrl,
    })
    await sendMail(
      email,
      'Verify Your Email Address',
      html,
    )

  }
  async WelcomeBuyer(email: string,  recipientName: string, ctaText: string, ctaUrl: string) {

    const html = emailTemplates.welcomeBuyer({
      recipientName,
      ctaText,
      ctaUrl,
    })
    await sendMail(
      email,
      'Verify Your Email Address',
      html,
    )
  }

  async sendPasswordReset(
    email: string,
    token: number,
    profile?: Partial<Profile>
  ) {
    const html = emailTemplates.passwordReset({
      otp: token.toString(),
      subject: 'Password Reset Code',
      description: 'Password Reset Code',
      recipientName: profile?.firstName || 'Anonymous',
      expirationMinutes: Number(TOKEN_EXPIRY_MINUTES || 10),
    });
  
    await sendMail(
      email,
      'Password Reset Code',
      html
    );
  }
  
  
  async accountRecovery(email: string, token: number, firstName?: string) {
    const html = emailTemplates.accountRecovery(
      {
        recipientName: firstName || 'Anonymous',
        otp: token.toString(),
        subject: "Account Recovery",
        description: "Account Recovery",
        expirationMinutes: Number(TOKEN_EXPIRY_MINUTES || 10)
      }
    )

    await sendMail(
      email,
      'Account Recovery',
      html,
    )
  }
    
}
