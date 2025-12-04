import { getIssueAttachmentTool } from './getIssueAttachment.js';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Backlog } from 'backlog-js';
import { createTranslationHelper } from '../createTranslationHelper.js';
import { PassThrough } from 'stream';

describe('getIssueAttachmentTool', () => {
  const createMockStream = (data: string): PassThrough => {
    const stream = new PassThrough();
    stream.push(Buffer.from(data));
    stream.push(null);
    return stream;
  };

  const mockTranslationHelper = createTranslationHelper();

  describe('when fetching an image attachment', () => {
    let mockBacklog: Partial<Backlog>;

    beforeEach(() => {
      // Create fresh mock for each test
      mockBacklog = {
        getIssueAttachment: jest
          .fn<
            () => Promise<{
              body: PassThrough;
              url: string;
              filename: string;
            }>
          >()
          .mockImplementation(() =>
            Promise.resolve({
              body: createMockStream('fake-image-data'),
              url: 'https://example.com/attachment/1',
              filename: 'screenshot.png',
            })
          ),
      };
    });

    it('returns image content with base64 data', async () => {
      const tool = getIssueAttachmentTool(
        mockBacklog as Backlog,
        mockTranslationHelper
      );

      const result = await tool.handler({
        issueKey: 'TEST-1',
        attachmentId: 1,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: expect.stringContaining('screenshot.png'),
      });
      expect(result.content[1]).toMatchObject({
        type: 'image',
        mimeType: 'image/png',
        data: expect.any(String),
      });
    });

    it('correctly encodes image data as base64', async () => {
      const tool = getIssueAttachmentTool(
        mockBacklog as Backlog,
        mockTranslationHelper
      );

      const result = await tool.handler({
        issueKey: 'TEST-1',
        attachmentId: 1,
      });

      const imageContent = result.content[1];
      if (imageContent.type !== 'image') {
        throw new Error('Expected image content');
      }
      const decodedData = Buffer.from(imageContent.data, 'base64').toString();
      expect(decodedData).toBe('fake-image-data');
    });
  });

  describe('when fetching a non-image attachment', () => {
    const mockBacklog: Partial<Backlog> = {
      getIssueAttachment: jest
        .fn<
          () => Promise<{
            body: PassThrough;
            url: string;
            filename: string;
          }>
        >()
        .mockImplementation(() =>
          Promise.resolve({
            body: createMockStream('fake-pdf-data'),
            url: 'https://example.com/attachment/2',
            filename: 'document.pdf',
          })
        ),
    };

    const tool = getIssueAttachmentTool(
      mockBacklog as Backlog,
      mockTranslationHelper
    );

    it('returns metadata only for non-image files', async () => {
      const result = await tool.handler({
        issueKey: 'TEST-1',
        attachmentId: 2,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const textContent = result.content[0];
      if (textContent.type !== 'text') {
        throw new Error('Expected text content');
      }
      const parsed = JSON.parse(textContent.text);
      expect(parsed.filename).toBe('document.pdf');
      expect(parsed.message).toContain('not an image');
    });
  });

  describe('when resolving issue fails', () => {
    const mockBacklog: Partial<Backlog> = {
      getIssueAttachment: jest.fn(),
    };

    const tool = getIssueAttachmentTool(
      mockBacklog as Backlog,
      mockTranslationHelper
    );

    it('returns an error when neither issueId nor issueKey is provided', async () => {
      const result = await tool.handler({
        attachmentId: 1,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
    });
  });

  describe('image format detection', () => {
    const createMockBacklogWithFilename = (
      filename: string
    ): Partial<Backlog> => ({
      getIssueAttachment: jest
        .fn<
          () => Promise<{
            body: PassThrough;
            url: string;
            filename: string;
          }>
        >()
        .mockImplementation(() =>
          Promise.resolve({
            body: createMockStream('fake-image-data'),
            url: 'https://example.com/attachment/1',
            filename,
          })
        ),
    });

    it('detects JPEG files', async () => {
      const mockBacklog = createMockBacklogWithFilename('photo.jpg');
      const tool = getIssueAttachmentTool(
        mockBacklog as Backlog,
        mockTranslationHelper
      );
      const result = await tool.handler({
        issueKey: 'TEST-1',
        attachmentId: 1,
      });

      expect(result.content[1]).toMatchObject({
        type: 'image',
        mimeType: 'image/jpeg',
      });
    });

    it('detects GIF files', async () => {
      const mockBacklog = createMockBacklogWithFilename('animation.gif');
      const tool = getIssueAttachmentTool(
        mockBacklog as Backlog,
        mockTranslationHelper
      );
      const result = await tool.handler({
        issueKey: 'TEST-1',
        attachmentId: 1,
      });

      expect(result.content[1]).toMatchObject({
        type: 'image',
        mimeType: 'image/gif',
      });
    });

    it('detects WebP files', async () => {
      const mockBacklog = createMockBacklogWithFilename('image.webp');
      const tool = getIssueAttachmentTool(
        mockBacklog as Backlog,
        mockTranslationHelper
      );
      const result = await tool.handler({
        issueKey: 'TEST-1',
        attachmentId: 1,
      });

      expect(result.content[1]).toMatchObject({
        type: 'image',
        mimeType: 'image/webp',
      });
    });
  });
});
