import { getIssueAttachmentsTool } from './getIssueAttachments.js';
import { jest, describe, it, expect } from '@jest/globals';
import type { Backlog } from 'backlog-js';
import { createTranslationHelper } from '../createTranslationHelper.js';

describe('getIssueAttachmentsTool', () => {
  const mockAttachments = [
    {
      id: 1,
      name: 'screenshot.png',
      size: 12345,
      createdUser: {
        id: 1,
        userId: 'admin',
        name: 'Admin User',
        roleType: 1,
        lang: 'en',
        mailAddress: 'admin@example.com',
        lastLoginTime: '2023-01-01T00:00:00Z',
      },
      created: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'document.pdf',
      size: 54321,
      createdUser: {
        id: 1,
        userId: 'admin',
        name: 'Admin User',
        roleType: 1,
        lang: 'en',
        mailAddress: 'admin@example.com',
        lastLoginTime: '2023-01-01T00:00:00Z',
      },
      created: '2023-01-02T00:00:00Z',
    },
  ];

  const mockBacklog: Partial<Backlog> = {
    getIssueAttachments: jest
      .fn<() => Promise<typeof mockAttachments>>()
      .mockResolvedValue(mockAttachments),
  };

  const mockTranslationHelper = createTranslationHelper();
  const tool = getIssueAttachmentsTool(
    mockBacklog as Backlog,
    mockTranslationHelper
  );

  it('returns list of attachments for an issue by key', async () => {
    const result = await tool.handler({
      issueKey: 'TEST-1',
    });

    if (!Array.isArray(result)) {
      throw new Error('Expected array result');
    }
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('screenshot.png');
    expect(result[1].name).toBe('document.pdf');
  });

  it('calls backlog.getIssueAttachments with correct params when using issue key', async () => {
    await tool.handler({
      issueKey: 'TEST-1',
    });

    expect(mockBacklog.getIssueAttachments).toHaveBeenCalledWith('TEST-1');
  });

  it('calls backlog.getIssueAttachments with correct params when using issue ID', async () => {
    await tool.handler({
      issueId: 123,
    });

    expect(mockBacklog.getIssueAttachments).toHaveBeenCalledWith(123);
  });

  it('throws an error if neither issueId nor issueKey is provided', async () => {
    await expect(tool.handler({})).rejects.toThrow(Error);
  });
});
