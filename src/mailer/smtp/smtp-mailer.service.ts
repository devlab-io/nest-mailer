import { InternalServerErrorException, Logger } from '@nestjs/common';
import { MailerConfig } from '../config/mailer.config';
import { MailerService } from '../mailer.service';

/**
 * Mailer service implementation using SMTP.
 * This service sends emails through an SMTP server using nodemailer.
 *
 * @example
 * ```typescript
 * const service = new SmtpMailerService({
 *   smtp: {
 *     host: 'smtp.example.com',
 *     port: 587,
 *     secure: false,
 *     ignoreTLS: false,
 *     auth: { user: 'user', pass: 'pass' },
 *   },
 *   mailer: { from: 'noreply@example.com' },
 * });
 * await service.send('user@example.com', 'Subject', 'Body');
 * ```
 */
export class SmtpMailerService implements MailerService {
  private readonly logger = new Logger(SmtpMailerService.name);
  private readonly config: MailerConfig;
  private transporter: any;

  /**
   * Creates a new instance of SmtpMailerService.
   * Initializes the SMTP transporter and logs warnings for insecure configurations.
   *
   * @param config - The mailer configuration containing SMTP settings
   * @throws {Error} If SMTP configuration is not provided
   */
  constructor(config: MailerConfig) {
    this.config = config;
    if (!this.config.smtp) {
      throw new Error('SMTP configuration is required for SmtpMailerService');
    }
    if (!this.config.smtp.secure) {
      this.logger.warn('You are using an unsecured connection to the SMTP');
    }
    if (this.config.smtp.ignoreTLS) {
      this.logger.warn('You are not using TLS certificate with the SMTP');
    }
    this.logger.log('Using Smtp Mailer');
  }

  /**
   * Initializes the SMTP transporter with lazy import.
   * This prevents nodemailer from being loaded when not using SMTP.
   */
  private async initializeTransporter(): Promise<void> {
    if (!this.transporter) {
      const { createTransport } = await import('nodemailer');
      this.transporter = createTransport({
        host: this.config.smtp!.host,
        port: this.config.smtp!.port,
        secure: this.config.smtp!.secure,
        ignoreTLS: this.config.smtp!.ignoreTLS,
        auth: this.config.smtp!.auth,
      });
    }
  }

  /**
   * Sends an email using the SMTP transporter.
   *
   * @param to - The recipient's email address
   * @param subject - The email subject
   * @param text - The email body content (plain text)
   * @returns A promise that resolves when the email is sent successfully
   * @throws {InternalServerErrorException} When the email fails to send
   */
  async send(to: string, subject: string, text: string) {
    // Ensure transporter is initialized
    if (!this.transporter) {
      await this.initializeTransporter();
    }

    // TODO : save mail in database
    try {
      await this.transporter.sendMail({
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
