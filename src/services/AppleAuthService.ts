import appleSignin from 'apple-signin-auth';
import logger from '../utils/loggers';
import { ApiError } from '../utils/ApiError';
import {APPLE_CLIENT_ID,APPLE_TEAM_ID, APPLE_PRIVATE_KEY,
   APPLE_KEY_IDENTIFIER, APPLE_REDIRECT_URI } from "../secrets"

import { inject, injectable } from 'inversify';
export interface AppleAuthOptions {
  clientID: string;
  teamID: string;
  privateKey: string;
  keyIdentifier: string;
  redirectUri: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token: string;
}


@injectable()
export class AppleAuthService {
  private options: AppleAuthOptions;

  constructor() {
    this.options = {
      clientID: APPLE_CLIENT_ID || '',
      teamID: APPLE_TEAM_ID || '',
      privateKey: APPLE_PRIVATE_KEY || '',
      keyIdentifier: APPLE_KEY_IDENTIFIER || '',
      redirectUri: APPLE_REDIRECT_URI || ''
    };

    
    if (
      !this.options.clientID ||
      !this.options.teamID ||
      !this.options.privateKey ||
      !this.options.keyIdentifier ||
      !this.options.redirectUri
    ) {
      throw ApiError.notFound('Missing Apple authentication environment variables');
    }
  }

  /**
   * Get Apple authorization URL
   */
  getAuthorizationUrl(state?: string, scope?: string): string {
    try {
      const authUrl = appleSignin.getAuthorizationUrl({
        clientID: this.options.clientID,
        redirectUri: this.options.redirectUri,
        state: state || this.generateState(),
        scope: scope || 'email name',
        responseMode: 'form_post'
      });

      logger.info('Generated Apple authorization URL');
      return authUrl;
    } catch (error: any) {
      logger.error('Error generating authorization URL:', error.message);
      throw ApiError.internal('Failed to generate authorization URL', error);
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async getAuthorizationToken(code: string): Promise<TokenResponse> {
    try {
      const clientSecret = this.generateClientSecret();

      const tokenResponse = await appleSignin.getAuthorizationToken(code, {
        clientID: this.options.clientID,
        redirectUri: this.options.redirectUri,
        clientSecret
      });

      logger.info('Successfully exchanged authorization code for tokens');
      return tokenResponse;
    } catch (error: any) {
      logger.error('Error exchanging authorization code:', error.message);
      throw ApiError.badRequest(
        'Failed to exchange authorization code',
        error
      );
    }
  }

  /**
   * Verify ID token and extract user information
   */
  async verifyIdToken(
    idToken: string,
    audience?: string,
    nonce?: string
  ): Promise<any> {
    try {
      const decoded = await appleSignin.verifyIdToken(idToken, {
        audience: audience || this.options.clientID,
        nonce,
        ignoreExpiration: false
      });

      logger.info(`ID token verified for user: ${decoded.sub}`);
      return decoded;
    } catch (error: any) {
      logger.error('Error verifying ID token:', error.message);
      throw ApiError.unauthorized('Invalid or expired ID token', error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAuthorizationToken(refreshToken: string): Promise<string> {
    try {
      const clientSecret = this.generateClientSecret();

      const { access_token } = await appleSignin.refreshAuthorizationToken(
        refreshToken,
        {
          clientID: this.options.clientID,
          clientSecret
        }
      );

      logger.info('Successfully refreshed access token');
      return access_token;
    } catch (error: any) {
      logger.error('Error refreshing authorization token:', error.message);
      throw ApiError.badRequest('Failed to refresh token', error);
    }
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const clientSecret = this.generateClientSecret();

      await appleSignin.revokeAuthorizationToken(refreshToken, {
        clientID: this.options.clientID,
        clientSecret,
        tokenTypeHint: 'refresh_token'
      });

      logger.info('Successfully revoked refresh token');
    } catch (error: any) {
      logger.error('Error revoking refresh token:', error.message);
      // Don't throw - revocation failure shouldn't block logout
      logger.warn('Continuing with logout despite revocation failure');
    }
  }

  /**
   * Revoke access token
   */
  async revokeAccessToken(accessToken: string): Promise<void> {
    try {
      const clientSecret = this.generateClientSecret();

      await appleSignin.revokeAuthorizationToken(accessToken, {
        clientID: this.options.clientID,
        clientSecret,
        tokenTypeHint: 'access_token'
      });

      logger.info('Successfully revoked access token');
    } catch (error: any) {
      logger.warn('Error revoking access token:', error.message);
    }
  }

  /**
   * Verify webhook token from Apple server-to-server notifications
   */
  async verifyWebhookToken(payload: string): Promise<any> {
    try {
      const decoded = await appleSignin.verifyWebhookToken(payload, {
        audience: this.options.clientID
      });

      logger.info('Webhook token verified');
      return decoded;
    } catch (error: any) {
      logger.error('Error verifying webhook token:', error.message);
      throw ApiError.unauthorized('Invalid webhook token', error);
    }
  }

  /**
   * Generate client secret (JWT)
   */
  private generateClientSecret(): string {
    return appleSignin.getClientSecret({
      clientID: this.options.clientID,
      teamID: this.options.teamID,
      privateKey: this.options.privateKey,
      keyIdentifier: this.options.keyIdentifier,
      expAfter: 15777000 
    });
  }

  /**
   * Generate state for CSRF protection
   */
  private generateState(): string {
    return require('crypto').randomBytes(16).toString('hex');
  }
}