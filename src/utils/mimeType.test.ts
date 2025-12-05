import { describe, it, expect } from '@jest/globals';
import { getImageMimeType, isImageFile } from './mimeType.js';

describe('getImageMimeType', () => {
  it('returns correct MIME type for JPEG files', () => {
    expect(getImageMimeType('photo.jpg')).toBe('image/jpeg');
    expect(getImageMimeType('photo.jpeg')).toBe('image/jpeg');
    expect(getImageMimeType('PHOTO.JPG')).toBe('image/jpeg');
  });

  it('returns correct MIME type for PNG files', () => {
    expect(getImageMimeType('image.png')).toBe('image/png');
    expect(getImageMimeType('IMAGE.PNG')).toBe('image/png');
  });

  it('returns correct MIME type for GIF files', () => {
    expect(getImageMimeType('animation.gif')).toBe('image/gif');
  });

  it('returns correct MIME type for WebP files', () => {
    expect(getImageMimeType('image.webp')).toBe('image/webp');
  });

  it('returns correct MIME type for SVG files', () => {
    expect(getImageMimeType('icon.svg')).toBe('image/svg+xml');
  });

  it('returns null for non-image files', () => {
    expect(getImageMimeType('document.pdf')).toBeNull();
    expect(getImageMimeType('file.txt')).toBeNull();
    expect(getImageMimeType('archive.zip')).toBeNull();
  });

  it('returns null for files without extension', () => {
    expect(getImageMimeType('noextension')).toBeNull();
  });
});

describe('isImageFile', () => {
  it('returns true for image files', () => {
    expect(isImageFile('photo.jpg')).toBe(true);
    expect(isImageFile('image.png')).toBe(true);
    expect(isImageFile('animation.gif')).toBe(true);
  });

  it('returns false for non-image files', () => {
    expect(isImageFile('document.pdf')).toBe(false);
    expect(isImageFile('file.txt')).toBe(false);
  });
});
