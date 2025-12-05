/**
 * Detects the MIME type of an image based on file extension.
 * Falls back to application/octet-stream if the extension is not recognized.
 */
export function getImageMimeType(filename: string): string | null {
  const ext = filename.toLowerCase().split('.').pop();

  const imageMimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    tiff: 'image/tiff',
    tif: 'image/tiff',
  };

  return imageMimeTypes[ext ?? ''] ?? null;
}

/**
 * Checks if a file is an image based on its filename extension.
 */
export function isImageFile(filename: string): boolean {
  return getImageMimeType(filename) !== null;
}
