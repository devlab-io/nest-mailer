import { Test, TestingModule } from '@nestjs/testing';
import { provideMailerService } from './mailer.provider';
import { MailerConfigToken, MailerConfig } from './config/mailer.config';
import { MailerServiceToken, MailerService } from './mailer.service';
import { ResendMailerService } from './resend/resend-mailer.service';
import { SmtpMailerService } from './smtp/smtp-mailer.service';

jest.mock('./resend/resend-mailer.service', () => ({
  ResendMailerService: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}));

jest.mock('./smtp/smtp-mailer.service', () => ({
  SmtpMailerService: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}));

describe('provideMailerService', () => {
  let provider: ReturnType<typeof provideMailerService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with Resend config', () => {
    const resendConfig: MailerConfig = {
      resend: {
        apiKey: 're_test123',
      },
      mailer: {
        from: 'test@example.com',
      },
    };

    it('should provide ResendMailerService when Resend API key is present', () => {
      provider = provideMailerService();
      const factory = (provider as any).useFactory as (
        config: MailerConfig,
      ) => MailerService;

      factory(resendConfig);

      expect(ResendMailerService).toHaveBeenCalledWith(resendConfig);
      expect(SmtpMailerService).not.toHaveBeenCalled();
    });

    it('should use MailerServiceToken as provide token', () => {
      provider = provideMailerService();
      expect((provider as any).provide).toBe(MailerServiceToken);
    });

    it('should inject MailerConfigToken', () => {
      provider = provideMailerService();
      expect((provider as any).inject).toEqual([MailerConfigToken]);
    });
  });

  describe('with SMTP config', () => {
    const smtpConfig: MailerConfig = {
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        ignoreTLS: false,
      },
      mailer: {
        from: 'test@example.com',
      },
    };

    it('should provide SmtpMailerService when Resend API key is not present', () => {
      provider = provideMailerService();
      const factory = (provider as any).useFactory as (
        config: MailerConfig,
      ) => MailerService;

      factory(smtpConfig);

      expect(SmtpMailerService).toHaveBeenCalledWith(smtpConfig);
      expect(ResendMailerService).not.toHaveBeenCalled();
    });
  });

  describe('integration with NestJS module', () => {
    it('should be injectable in a NestJS module', async () => {
      const resendConfig: MailerConfig = {
        resend: {
          apiKey: 're_test123',
        },
        mailer: {
          from: 'test@example.com',
        },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: MailerConfigToken,
            useValue: resendConfig,
          },
          provideMailerService(),
        ],
      }).compile();

      const service = module.get<MailerService>(MailerServiceToken);

      expect(service).toBeDefined();
      expect(ResendMailerService).toHaveBeenCalledWith(resendConfig);
    });
  });
});
