// Marathi digits converter
export function toMarathiDigits(input: string | number): string {
  const marathiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(input).replace(/\d/g, (d) => marathiDigits[parseInt(d)]);
}

// Get current date in Marathi
export function getMarathiDate(): string {
  const date = new Date();
  const formatted = date.toLocaleDateString('mr-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
  return toMarathiDigits(formatted);
}

// Relative time in Marathi
export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'काही सेकंदांपूर्वी';
  if (diffMin < 60) return `${toMarathiDigits(diffMin)} मिनिटांपूर्वी`;
  if (diffHour < 24) return `${toMarathiDigits(diffHour)} तासांपूर्वी`;
  if (diffDay < 2) return 'काल';

  return then.toLocaleDateString('mr-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format date in Marathi
export function formatMarathiDate(dateStr: string): string {
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString('mr-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return toMarathiDigits(formatted);
}

// Parse gallery JSON
export function parseGallery(galleryJson: string): string[] {
  if (!galleryJson || galleryJson === '[]' || galleryJson === '') return [];
  try {
    const parsed = JSON.parse(galleryJson);
    const arr = Array.isArray(parsed) ? parsed : [];
    // Fix paths that don't start with /
    return arr.map(path => path.startsWith('/') ? path : `/${path}`);
  } catch {
    return [];
  }
}

// Truncate text
export function truncateText(text: string, length: number): string {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

// Generate OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mask email
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  if (username.length <= 2) return email;
  const masked = username[0] + '*'.repeat(username.length - 1);
  return masked + '@' + domain;
}