import { Provider } from '@nestjs/common';
import { MailerConfigToken, MailerConfig } from './config/mailer.config';
import { MailerService, MailerServiceToken } from './mailer.service';
import { SmtpMailerService } from './smtp/smtp-mailer.service';
import { ResendMailerService } from './resend/resend-mailer.service';

/**
 * Creates a provider for the MailerService.
 * Automatically selects the appropriate implementation based on the configuration:
 * - If Resend API key is provided, uses ResendMailerService
 * - Otherwise, uses SmtpMailerService
 *
 * @returns A NestJS provider for the MailerService
 */
export function provideMailerService(): Provider {
  return {
    provide: MailerServiceToken,
    inject: [MailerConfigToken],
    useFactory: (mailerConfig: MailerConfig): MailerService => {
      if (mailerConfig.resend?.apiKey) {
        return new ResendMailerService(mailerConfig);
      } else {
        return new SmtpMailerService(mailerConfig);
      }
    },
  };
}
