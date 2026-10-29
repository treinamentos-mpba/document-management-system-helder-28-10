export function formatFileSize(size) {
  if (size < 1024) {
    return `${size} bytes`;
  }

  const sizeInKilobytes = size / 1024;
  return sizeInKilobytes < 1024
    ? `${sizeInKilobytes.toFixed(1)} KB`
    : `${(sizeInKilobytes / 1024).toFixed(1)} MB`;
}