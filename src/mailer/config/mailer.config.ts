import { z } from 'zod';
import { Provider } from '@nestjs/common';

/**
 * Configuration interface for Resend email provider.
 */
export interface ResendConfig {
  /**
   * Resend API configuration.
   */
  resend?: {
    /**
     * Resend API key.
     */
    apiKey: string;
  };
}

/**
 * Configuration interface for SMTP email provider.
 */
export interface SmtpConfig {
  /**
   * SMTP server configuration.
   */
  smtp?: {
    /**
     * SMTP server hostname.
     */
    host: string;
    /**
     * SMTP server port.
     */
    port: number;
    /**
     * Whether to use a secure connection (TLS/SSL).
     */
    secure: boolean;
    /**
     * Whether to ignore TLS certificate validation.
     */
    ignoreTLS: boolean;
    /**
     * SMTP authentication credentials (optional).
     */
    auth?: {
      /**
       * SMTP username.
       */
      user: string;
      /**
       * SMTP password.
       */
      pass: string;
    };
  };
}

/**
 * Complete mailer configuration interface.
 * Extends both ResendConfig and SmtpConfig.
 * The service will use Resend if apiKey is provided, otherwise SMTP.
 */
export interface MailerConfig extends ResendConfig, SmtpConfig {
  /**
   * Common mailer settings.
   */
  mailer: {
    /**
     * Default sender email address.
     */
    from: string;
  };
}

/**
 * Injection token for the MailerConfig.
 * Use this token to inject the mailer configuration in your services.
 */
export const MailerConfigToken = Symbol('MailerConfig');

/**
 * Custom Zod transform to convert string values to boolean.
 * Converts "true", "yes", "1" (case-insensitive) to true
 * Converts "false", "no", "0" (case-insensitive) to false
 * Handles undefined values (will use default from schema)
 */
const booleanFromString = z
  .union([z.boolean(), z.string(), z.number(), z.undefined()])
  .transform((val: boolean | string | number | undefined) => {
    if (val === undefined) {
      return undefined; // Let Zod apply the default
    }
    if (typeof val === 'boolean') {
      return val;
    }
    if (typeof val === 'number') {
      return val > 0;
    }
    const lowerVal = val.toLowerCase().trim();
    if (['true', 'yes', '1'].includes(lowerVal)) {
      return true;
    }
    if (['false', 'no', '0'].includes(lowerVal)) {
      return false;
    }
    // Default to false for unrecognized values
    return false;
  });

/**
 * Zod schema for validating environment variables.
 * Defines the structure and defaults for mailer configuration from environment.
 */
export const mailerConfigSchema = z.object({
  // Resend
  RESEND_API_KEY: z.string().optional(),
  // SMTP
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().default('2500'),
  SMTP_SECURE: booleanFromString.default(false),
  SMTP_IGNORE_TLS: booleanFromString.default(true),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Common
  EMAIL_FROM: z.string().min(1).default('no-reply@resend.devlab.io'),
});

/**
 * Parses environment variables into a MailerConfig object.
 * If RESEND_API_KEY is provided, returns Resend configuration.
 * Otherwise, returns SMTP configuration.
 *
 * @param env - Environment variables object
 * @returns Parsed mailer configuration
 */
function parseMailerConfig(env: NodeJS.ProcessEnv): MailerConfig {
  // Parse environment variables
  const mailerConfig = mailerConfigSchema.parse(env);
  if (mailerConfig.RESEND_API_KEY) {
    return {
      resend: {
        apiKey: mailerConfig.RESEND_API_KEY,
      },
      mailer: {
        from: mailerConfig.EMAIL_FROM,
      },
    };
  } else {
    return {
      smtp: {
        host: mailerConfig.SMTP_HOST,
        port: parseInt(mailerConfig.SMTP_PORT),
        secure: mailerConfig.SMTP_SECURE,
        ignoreTLS: mailerConfig.SMTP_IGNORE_TLS,
        auth:
          mailerConfig.SMTP_USER && mailerConfig.SMTP_PASS
            ? {
                user: mailerConfig.SMTP_USER,
                pass: mailerConfig.SMTP_PASS,
              }
            : undefined,
      },
      mailer: {
        from: mailerConfig.EMAIL_FROM,
      },
    };
  }
}

/**
 * Creates a provider for the MailerConfig.
 * Merges provided configuration with environment variables.
 * Uses useFactory so NestJS automatically caches the result (singleton).
 *
 * @param config - Optional partial configuration to merge with environment variables
 * @returns A NestJS provider for the MailerConfig
 *
 * @example
 * ```typescript
 * // Using only environment variables
 * provideMailerConfig()
 *
 * // Merging with provided config
 * provideMailerConfig({
 *   mailer: { from: 'custom@example.com' },
 * })
 * ```
 */
export function provideMailerConfig(config?: Partial<MailerConfig>): Provider {
  return {
    provide: MailerConfigToken,
    useFactory: (): MailerConfig => {
      const envConfig = parseMailerConfig(process.env);
      if (config) {
        // Merge provided config with defaults from env
        return {
          ...envConfig,
          ...config,
          resend: config.resend || envConfig.resend,
          smtp: config.smtp || envConfig.smtp,
          mailer: {
            ...envConfig.mailer,
            ...config.mailer,
          },
        };
      }
      return envConfig;
    },
  };
}
