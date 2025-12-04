import { z } from 'zod';
import { Backlog, Entity } from 'backlog-js';
import { buildToolSchema, DynamicToolDefinition } from '../types/tool.js';
import { TranslationHelper } from '../createTranslationHelper.js';
import { resolveIdOrKey } from '../utils/resolveIdOrKey.js';
import { getImageMimeType, isImageFile } from '../utils/mimeType.js';
import { PassThrough } from 'stream';

const getIssueAttachmentSchema = buildToolSchema((t) => ({
  issueId: z
    .number()
    .optional()
    .describe(
      t(
        'TOOL_GET_ISSUE_ATTACHMENT_ISSUE_ID',
        'The numeric ID of the issue (e.g., 12345)'
      )
    ),
  issueKey: z
    .string()
    .optional()
    .describe(
      t(
        'TOOL_GET_ISSUE_ATTACHMENT_ISSUE_KEY',
        "The key of the issue (e.g., 'PROJ-123')"
      )
    ),
  attachmentId: z
    .number()
    .describe(
      t('TOOL_GET_ISSUE_ATTACHMENT_ATTACHMENT_ID', 'The ID of the attachment')
    ),
}));

/**
 * Reads a Node.js stream and converts it to a Buffer.
 */
async function streamToBuffer(stream: PassThrough): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Type guard to check if FileData is NodeFileData (has filename property)
 */
function isNodeFileData(
  fileData: Entity.File.FileData
): fileData is Entity.File.NodeFileData {
  return 'filename' in fileData;
}

export const getIssueAttachmentTool = (
  backlog: Backlog,
  { t }: TranslationHelper
): DynamicToolDefinition<ReturnType<typeof getIssueAttachmentSchema>> => {
  return {
    name: 'get_issue_attachment',
    description: t(
      'TOOL_GET_ISSUE_ATTACHMENT_DESCRIPTION',
      'Downloads an issue attachment. If the attachment is an image, returns the image data directly so it can be analyzed by the AI agent.'
    ),
    schema: z.object(getIssueAttachmentSchema(t)),
    handler: async ({ issueId, issueKey, attachmentId }) => {
      const result = resolveIdOrKey('issue', { id: issueId, key: issueKey }, t);
      if (!result.ok) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: result.error.message,
            },
          ],
        };
      }

      const fileData = await backlog.getIssueAttachment(
        result.value,
        attachmentId
      );

      // Get filename (only available in Node.js environment)
      if (!isNodeFileData(fileData)) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: 'This tool is only supported in Node.js environment.',
            },
          ],
        };
      }

      const filename = fileData.filename;

      // Check if the file is an image
      if (isImageFile(filename)) {
        const mimeType = getImageMimeType(filename);

        // Convert stream to base64
        const buffer = await streamToBuffer(fileData.body);
        const base64Data = buffer.toString('base64');

        return {
          content: [
            {
              type: 'text' as const,
              text: `Attachment: ${filename} (${buffer.length} bytes)`,
            },
            {
              type: 'image' as const,
              data: base64Data,
              mimeType: mimeType!,
            },
          ],
        };
      }

      // For non-image files, return metadata only
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                filename: fileData.filename,
                url: fileData.url,
                message:
                  'This attachment is not an image. Only image files can be displayed.',
              },
              null,
              2
            ),
          },
        ],
      };
    },
  };
};
