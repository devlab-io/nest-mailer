import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { ResendMailerService } from './resend/resend-mailer.service';
import { MailerConfig } from './config/mailer.config';

describe('ResendMailerService', () => {
  let service: ResendMailerService;
  let mockEmailsSend: jest.Mock;

  const mockMailerConfig: MailerConfig = {
    resend: {
      apiKey: 'test-api-key',
    },
    mailer: {
      from: 'test@example.com',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    mockEmailsSend = jest.fn();
    const mockResendImplementation = {
      emails: {
        send: mockEmailsSend,
      },
    };

    (Resend as unknown as jest.MockedClass<typeof Resend>).mockImplementation(
      () =>
        ({
          ...mockResendImplementation,
          headers: {},
          apiKeys: {},
          audiences: {},
          batch: jest.fn(),
          contacts: {},
          domains: {},
          dripCampaigns: {},
          dripCampaignMembers: {},
          links: {},
          segments: {},
          suppressions: {},
          users: {},
        }) as unknown as Resend,
    );

    service = new ResendMailerService(mockMailerConfig);
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      expect(service).toBeDefined();
    });

    it('should throw error if Resend API key is missing', () => {
      const invalidConfig: MailerConfig = {
        mailer: {
          from: 'test@example.com',
        },
      };

      expect(() => new ResendMailerService(invalidConfig)).toThrow(
        'Resend API key is required for ResendMailerService',
      );
    });
  });

  describe('send', () => {
    it('should send an email successfully', async () => {
      const mockResponse = {
        data: { id: 'mock-message-id' },
      };

      mockEmailsSend.mockResolvedValueOnce(mockResponse);

      await service.send('test@example.com', 'Test Subject', 'Test Content');

      expect(mockEmailsSend).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test Content',
      });
    });

    it('should throw InternalServerErrorException with error message when available', async () => {
      const error = new Error('Custom error message');

      mockEmailsSend.mockRejectedValueOnce(error);

      await expect(
        service.send('test@example.com', 'Test Subject', 'Test Content'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw generic InternalServerErrorException when error is not an Error instance', async () => {
      mockEmailsSend.mockRejectedValueOnce('string error');

      await expect(
        service.send('test@example.com', 'Test Subject', 'Test Content'),
      ).rejects.toThrow('Failed to send email');
    });
  });
});
