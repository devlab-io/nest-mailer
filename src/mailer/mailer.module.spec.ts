import { Test, TestingModule } from '@nestjs/testing';
import { MailerModule } from './mailer.module';
import { MailerServiceToken, MailerService } from './mailer.service';
import { MailerConfigToken, MailerConfig } from './config/mailer.config';

describe('MailerModule', () => {
  describe('forRoot', () => {
    it('should return a dynamic module', () => {
      const dynamicModule = MailerModule.forRoot();

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(MailerModule);
      expect(dynamicModule.providers).toBeDefined();
      expect(dynamicModule.exports).toBeDefined();
    });

    it('should include MailerConfig and MailerService providers', () => {
      const dynamicModule = MailerModule.forRoot();

      expect(dynamicModule.providers).toHaveLength(2);
      expect(dynamicModule.exports).toHaveLength(2);
    });

    it('should accept optional configuration', () => {
      const config: Partial<MailerConfig> = {
        resend: {
          apiKey: 're_test123',
        },
        mailer: {
          from: 'test@example.com',
        },
      };

      const dynamicModule = MailerModule.forRoot(config);

      expect(dynamicModule).toBeDefined();
    });

    it('should work without configuration (using env vars)', () => {
      const dynamicModule = MailerModule.forRoot();

      expect(dynamicModule).toBeDefined();
    });

    it('should be importable in a NestJS module', async () => {
      const config: Partial<MailerConfig> = {
        resend: {
          apiKey: 're_test123',
        },
        mailer: {
          from: 'test@example.com',
        },
      };

      const dynamicModule = MailerModule.forRoot(config);

      const module: TestingModule = await Test.createTestingModule({
        imports: [dynamicModule],
      }).compile();

      const mailerService = module.get<MailerService>(MailerServiceToken);
      const mailerConfig = module.get<MailerConfig>(MailerConfigToken);

      expect(mailerService).toBeDefined();
      expect(mailerConfig).toBeDefined();
    });
  });
});
