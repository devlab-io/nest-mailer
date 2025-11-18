import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Transporter, createTransport } from 'nodemailer';
import { SmtpMailerService } from './smtp-mailer.service';
import { MailerConfig } from '../config/mailer.config';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('SmtpMailerService', () => {
  let service: SmtpMailerService;
  let mockSendMail: jest.Mock;

  const mockMailerConfig: MailerConfig = {
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      ignoreTLS: false,
      auth: {
        user: 'user@example.com',
        pass: 'password',
      },
    },
    mailer: {
      from: 'test@example.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

    mockSendMail = jest.fn();
    (createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    } as unknown as Transporter);
  });

  describe('constructor', () => {
    it('should create instance with valid SMTP config', () => {
      service = new SmtpMailerService(mockMailerConfig);
      expect(service).toBeDefined();
      // createTransport is called lazily, not in constructor
      expect(createTransport).not.toHaveBeenCalled();
    });

    it('should throw error if SMTP config is missing', () => {
      const invalidConfig: MailerConfig = {
        mailer: {
          from: 'test@example.com',
        },
      };

      expect(() => new SmtpMailerService(invalidConfig)).toThrow(
        'SMTP configuration is required for SmtpMailerService',
      );
    });

    it('should not log warning for secured connection', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const secureConfig: MailerConfig = {
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          secure: true,
          ignoreTLS: false,
        },
        mailer: {
          from: 'test@example.com',
        },
      };
      new SmtpMailerService(secureConfig);
      expect(warnSpy).not.toHaveBeenCalledWith(
        'You are using an unsecured connection to the SMTP',
      );
    });

    it('should log warning for unsecured connection when secure is false', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const insecureConfig: MailerConfig = {
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
      new SmtpMailerService(insecureConfig);
      expect(warnSpy).toHaveBeenCalledWith(
        'You are using an unsecured connection to the SMTP',
      );
    });

    it('should log warning when ignoreTLS is true', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const ignoreTLSConfig: MailerConfig = {
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          ignoreTLS: true,
        },
        mailer: {
          from: 'test@example.com',
        },
      };
      new SmtpMailerService(ignoreTLSConfig);
      expect(warnSpy).toHaveBeenCalledWith(
        'You are not using TLS certificate with the SMTP',
      );
    });

    it('should create transporter without auth when auth is not provided', async () => {
      const configWithoutAuth: MailerConfig = {
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
      service = new SmtpMailerService(configWithoutAuth);
      // Trigger initialization by calling send
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });
      await service.send('test@example.com', 'Test', 'Body');
      expect(createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        ignoreTLS: false,
        auth: undefined,
      });
    });
  });

  describe('send', () => {
    beforeEach(() => {
      service = new SmtpMailerService(mockMailerConfig);
    });

    it('should send an email successfully', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      await service.send('recipient@example.com', 'Test Subject', 'Test Body');

      // Verify createTransport was called with correct config
      expect(createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        ignoreTLS: false,
        auth: {
          user: 'user@example.com',
          pass: 'password',
        },
      });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test Body',
      });
    });

    it('should throw InternalServerErrorException when send fails', async () => {
      const error = new Error('SMTP connection failed');
      mockSendMail.mockRejectedValueOnce(error);

      await expect(
        service.send('recipient@example.com', 'Test Subject', 'Test Body'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException with error message', async () => {
      const error = new Error('Custom SMTP error');
      mockSendMail.mockRejectedValueOnce(error);

      await expect(
        service.send('recipient@example.com', 'Test Subject', 'Test Body'),
      ).rejects.toThrow('Failed to send email: Custom SMTP error');
    });

    it('should handle non-Error exceptions', async () => {
      mockSendMail.mockRejectedValueOnce('string error');

      await expect(
        service.send('recipient@example.com', 'Test Subject', 'Test Body'),
      ).rejects.toThrow('Failed to send email: Unknown error');
    });
  });
});
