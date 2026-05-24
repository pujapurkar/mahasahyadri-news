// Marathi digits converter
export function toMarathiDigits(input: string | number): string {
  const marathiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(input).replace(/\d/g, (d) => marathiDigits[parseInt(d)]);
}

/**
 * Safely parses a SQL Server datetime string to a JS Date object.
 *
 * SQL Server returns: "2026-04-03 15:30:00.123"
 * Strategy: Treat it as IST (UTC+05:30) since your SQL Server is local (IST).
 * If your SQL Server stores UTC, remove the '+05:30' suffix below.
 */
export function parseSQLDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  return new Date(String(dateStr).trim());
}

// Get current date in Marathi
export function getCurrentDate(lang: 'mr' | 'en' = 'mr'): string {
  const date = new Date();

  if (lang === 'mr') {
    const formatted = date.toLocaleDateString('mr-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
    return toMarathiDigits(formatted);
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}

// Relative time in Marathi (or English)
export function getRelativeTime(dateStr: string, lang: 'mr' | 'en' = 'mr'): string {
  if (!dateStr) return lang === 'mr' ? 'अज्ञात वेळ' : 'Unknown time';

  // UTC string directly locale mein convert karo
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return lang === 'mr' ? 'अज्ञात वेळ' : 'Unknown time';

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  };

  if (lang === 'mr') {
    return toMarathiDigits(date.toLocaleString('mr-IN', options));
  }
  return date.toLocaleString('en-IN', options);
}
// Format date in Marathi
export function formatDate(dateStr: string, lang: 'mr' | 'en' = 'mr'): string {
  if (!dateStr) return '';

  const utc = new Date(dateStr);
  if (isNaN(utc.getTime())) return '';

  // Explicit IST
  const ist = new Date(utc.getTime() + 5.5 * 60 * 60 * 1000);

  if (lang === 'mr') {
    return toMarathiDigits(
      ist.toLocaleDateString('mr-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    );
  }
  return ist.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function getMarathiDate(): string {
  return getCurrentDate('mr');
}

// Parse gallery JSON
export function parseGallery(galleryJson: string): string[] {
  if (!galleryJson || galleryJson === '[]' || galleryJson === '') return [];
  try {
    const parsed = JSON.parse(galleryJson);
    const arr = Array.isArray(parsed) ? parsed : [];
    return arr.map((path: string) => {
      // Cloudinary URL
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      // Local path 
      return path.startsWith('/') ? path : `/${path}`;
    });
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

