// Mock resend before any imports to avoid react-dom/server dependency
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn(),
      },
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
    })),
  };
});

