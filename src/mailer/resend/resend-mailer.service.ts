import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { MailerConfig } from '../config/mailer.config';
import { MailerService } from '../mailer.service';

/**
 * Mailer service implementation using Resend API.
 * This service sends emails through the Resend email service.
 *
 * @example
 * ```typescript
 * const service = new ResendMailerService({
 *   resend: { apiKey: 're_xxx' },
 *   mailer: { from: 'noreply@example.com' },
 * });
 * await service.send('user@example.com', 'Subject', 'Body');
 * ```
 */
export class ResendMailerService implements MailerService {
  private readonly logger = new Logger(ResendMailerService.name);
  private readonly resend: Resend;
  private readonly config: MailerConfig;

  /**
   * Creates a new instance of ResendMailerService.
   *
   * @param config - The mailer configuration containing Resend API key
   * @throws {Error} If Resend API key is not provided
   */
  constructor(config: MailerConfig) {
    this.config = config;
    if (!this.config.resend?.apiKey) {
      throw new Error('Resend API key is required for ResendMailerService');
    }
    this.resend = new Resend(this.config.resend.apiKey);
    this.logger.log('Using Resend Mailer');
  }

  /**
   * Sends an email using the Resend API.
   *
   * @param to - The recipient's email address
   * @param subject - The email subject
   * @param text - The email body content (plain text)
   * @returns A promise that resolves when the email is sent successfully
   * @throws {InternalServerErrorException} When the email fails to send
   */
  async send(to: string, subject: string, text: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.config.mailer.from,
        to,
        subject,
        text,
      });
    } catch (error) {
      const message: string =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email: ${message}`, error);
      throw new InternalServerErrorException(
        `Failed to send email: ${message}`,
      );
    }
  }
}
