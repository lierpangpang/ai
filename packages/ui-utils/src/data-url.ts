/**
 * Converts a data URL of type text/* to a text string.
 */
export function getTextFromDataUrl(dataUrl: string): string {
  const [header, base64Content] = dataUrl.split(',');
  const mimeType = header.split(';')[0].split(':')[1];

  if (mimeType == null || base64Content == null) {
    throw new Error('Invalid data URL format');
  }

  return window.atob(base64Content);
}
