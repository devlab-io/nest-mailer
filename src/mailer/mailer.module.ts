import { DynamicModule, Global, Module } from '@nestjs/common';
import { provideMailerService } from './mailer.provider';
import { provideMailerConfig, MailerConfig } from './config/mailer.config';

/**
 * Global NestJS module for email sending functionality.
 * Supports both Resend and SMTP providers.
 *
 * @example
 * ```typescript
 * // Using configuration object
 * MailerModule.forRoot({
 *   resend: { apiKey: 're_xxx' },
 *   mailer: { from: 'noreply@example.com' },
 * })
 *
 * // Using environment variables
 * MailerModule.forRoot()
 * ```
 */
@Global()
@Module({})
export class MailerModule {
  /**
   * Configures the MailerModule with optional configuration.
   * If no configuration is provided, the module will use environment variables.
   *
   * @param config - Optional partial configuration object
   * @returns A dynamic module configuration
   *
   * @example
   * ```typescript
   * // With Resend
   * MailerModule.forRoot({
   *   resend: { apiKey: 're_xxx' },
   *   mailer: { from: 'noreply@example.com' },
   * })
   *
   * // With SMTP
   * MailerModule.forRoot({
   *   smtp: {
   *     host: 'smtp.example.com',
   *     port: 587,
   *     secure: false,
   *     ignoreTLS: false,
   *     auth: { user: 'user', pass: 'pass' },
   *   },
   *   mailer: { from: 'noreply@example.com' },
   * })
   *
   * // Using environment variables only
   * MailerModule.forRoot()
   * ```
   */
  static forRoot(config?: Partial<MailerConfig>): DynamicModule {
    return {
      module: MailerModule,
      imports: [],
      providers: [provideMailerConfig(config), provideMailerService()],
      exports: [provideMailerConfig(config), provideMailerService()],
    };
  }
}
