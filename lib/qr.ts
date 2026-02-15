export function getQrImageUrl(payload: string, size = 200) {
  const safeSize = Math.max(64, Math.min(size, 512));
  const data = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${safeSize}x${safeSize}&data=${data}`;
}
