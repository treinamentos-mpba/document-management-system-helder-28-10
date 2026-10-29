function getMaxUploadSizeBytes() {
  const configuredSize = process.env.MAX_UPLOAD_SIZE_BYTES;
  const maxUploadSizeBytes = Number(configuredSize);

  if (
    configuredSize === undefined ||
    !Number.isSafeInteger(maxUploadSizeBytes) ||
    maxUploadSizeBytes <= 0
  ) {
    throw new Error('MAX_UPLOAD_SIZE_BYTES deve ser um inteiro positivo.');
  }

  return maxUploadSizeBytes;
}

module.exports = { getMaxUploadSizeBytes };