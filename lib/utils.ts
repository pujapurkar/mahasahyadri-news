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
  
  const trimmed = String(dateStr).trim();
  
  // PostgreSQL ISO format: "2026-05-06T03:31:00.000Z" (UTC)
  // Convert to IST by adding 5:30 hours
  const date = new Date(trimmed);
  
  if (!isNaN(date.getTime())) {
    // Add 5:30 hours for IST display
    return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  }

  return new Date(NaN);
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

  const then = parseSQLDate(dateStr);

  if (isNaN(then.getTime())) {
    return lang === 'mr' ? 'अज्ञात वेळ' : 'Unknown time';
  }

  if (lang === 'mr') {
    // तारीख: "०३ एप्रि २०२६"
    const datePart = toMarathiDigits(
      then.toLocaleDateString('mr-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    );

    // वेळ: "दुपारी ३:४७"
    const timePart = toMarathiDigits(
      then.toLocaleTimeString('mr-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    );

    return `${datePart}, ${timePart}`;
  }

  // English format
  const datePart = then.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const timePart = then.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}
// Format date in Marathi
export function formatDate(dateStr: string, lang: 'mr' | 'en' = 'mr'): string {
  const date = parseSQLDate(dateStr); // ← use the same safe parser

  if (isNaN(date.getTime())) return '';

  if (lang === 'mr') {
    const formatted = date.toLocaleDateString('mr-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return toMarathiDigits(formatted);
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

