import { Test, TestingModule } from '@nestjs/testing';
import {
  provideMailerConfig,
  MailerConfigToken,
  MailerConfig,
  mailerConfigSchema,
} from './mailer.config';

describe('mailer.config', () => {
  describe('mailerConfigSchema', () => {
    it('should parse valid environment variables', () => {
      const env = {
        RESEND_API_KEY: 're_test123',
        EMAIL_FROM: 'test@example.com',
      };

      const result = mailerConfigSchema.parse(env);

      expect(result.RESEND_API_KEY).toBe('re_test123');
      expect(result.EMAIL_FROM).toBe('test@example.com');
    });

    it('should use default values for missing SMTP variables', () => {
      const env = {
        EMAIL_FROM: 'test@example.com',
      };

      const result = mailerConfigSchema.parse(env);

      expect(result.SMTP_HOST).toBe('localhost');
      expect(result.SMTP_PORT).toBe('2500');
      expect(result.SMTP_SECURE).toBe(false);
      expect(result.SMTP_IGNORE_TLS).toBe(true);
    });

    it('should use default value for EMAIL_FROM', () => {
      const env = {};

      const result = mailerConfigSchema.parse(env);

      expect(result.EMAIL_FROM).toBe('no-reply@resend.devlab.io');
    });

    it('should parse SMTP configuration', () => {
      const env = {
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_SECURE: true,
        SMTP_IGNORE_TLS: false,
        SMTP_USER: 'user@example.com',
        SMTP_PASS: 'password123',
        EMAIL_FROM: 'test@example.com',
      };

      const result = mailerConfigSchema.parse(env);

      expect(result.SMTP_HOST).toBe('smtp.example.com');
      expect(result.SMTP_PORT).toBe('587');
      expect(result.SMTP_SECURE).toBe(true);
      expect(result.SMTP_IGNORE_TLS).toBe(false);
      expect(result.SMTP_USER).toBe('user@example.com');
      expect(result.SMTP_PASS).toBe('password123');
    });
  });

  describe('provideMailerConfig', () => {
    beforeEach(() => {
      // Reset environment variables
      delete process.env.RESEND_API_KEY;
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_SECURE;
      delete process.env.SMTP_IGNORE_TLS;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.EMAIL_FROM;
    });

    it('should create a provider with MailerConfigToken', () => {
      const provider = provideMailerConfig();

      expect((provider as any).provide).toBe(MailerConfigToken);
    });

    it('should use environment variables when no config is provided', async () => {
      process.env.RESEND_API_KEY = 're_test123';
      process.env.EMAIL_FROM = 'env@example.com';

      const provider = provideMailerConfig();
      const factory = (provider as any).useFactory as () => MailerConfig;
      const config = factory();

      expect(config.resend?.apiKey).toBe('re_test123');
      expect(config.mailer.from).toBe('env@example.com');
    });

    it('should merge provided config with environment variables', async () => {
      process.env.EMAIL_FROM = 'env@example.com';

      const provider = provideMailerConfig({
        mailer: {
          from: 'custom@example.com',
        },
      });
      const factory = (provider as any).useFactory as () => MailerConfig;
      const config = factory();

      expect(config.mailer.from).toBe('custom@example.com');
    });

    it('should prioritize provided config over environment variables', async () => {
      process.env.RESEND_API_KEY = 'env_key';
      process.env.EMAIL_FROM = 'env@example.com';

      const provider = provideMailerConfig({
        resend: {
          apiKey: 'custom_key',
        },
        mailer: {
          from: 'custom@example.com',
        },
      });
      const factory = (provider as any).useFactory as () => MailerConfig;
      const config = factory();

      expect(config.resend?.apiKey).toBe('custom_key');
      expect(config.mailer.from).toBe('custom@example.com');
    });

    it('should be injectable in a NestJS module', async () => {
      const provider = provideMailerConfig({
        resend: {
          apiKey: 're_test123',
        },
        mailer: {
          from: 'test@example.com',
        },
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [provider],
      }).compile();

      const config = module.get<MailerConfig>(MailerConfigToken);

      expect(config).toBeDefined();
      expect(config.resend?.apiKey).toBe('re_test123');
      expect(config.mailer.from).toBe('test@example.com');
    });
  });
});
