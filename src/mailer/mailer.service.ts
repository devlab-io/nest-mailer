/**
 * Interface for mailer service implementations.
 * Defines the contract for sending emails.
 */
export interface MailerService {
  /**
   * Sends an email to the specified recipient.
   *
   * @param to - The recipient's email address
   * @param subject - The email subject
   * @param text - The email body content (plain text)
   * @returns A promise that resolves when the email is sent successfully
   * @throws {InternalServerErrorException} When the email fails to send
   */
  send(to: string, subject: string, text: string): Promise<void>;
}

/**
 * Injection token for the MailerService.
 * Use this token to inject the mailer service in your services.
 *
 * @example
 * ```typescript
 * constructor(
 *   @Inject(MailerServiceToken)
 *   private readonly mailerService: MailerService,
 * ) {}
 * ```
 */
export const MailerServiceToken: symbol = Symbol('MailerService');
