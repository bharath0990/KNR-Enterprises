/**
 * Standard Indian Standard Time (IST, Asia/Kolkata) Date & Time Formatting Utilities
 * Strictly displays genuine timestamps formatted in Indian Standard Time (UTC+05:30)
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format a date string, timestamp, or Date object into a readable IST datetime string.
 * Example output: "21 Nov 2026, 11:43 AM IST"
 */
export function formatISTDateTime(input?: string | number | Date | null): string {
  if (!input) return '—';
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return '—';

    const datePart = new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);

    const timePart = new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return `${datePart}, ${timePart} IST`;
  } catch {
    return '—';
  }
}

/**
 * Format a date string, timestamp, or Date object into an IST date string.
 * Example output: "21 Nov 2026"
 */
export function formatISTDate(input?: string | number | Date | null): string {
  if (!input) return '—';
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return '—';

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Format a date string, timestamp, or Date object into an IST time string.
 * Example output: "11:43 AM IST"
 */
export function formatISTTime(input?: string | number | Date | null): string {
  if (!input) return '—';
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return '—';

    const timePart = new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return `${timePart} IST`;
  } catch {
    return '—';
  }
}

/**
 * Returns a human-friendly relative time string or falls back to IST date.
 * Example outputs: "Just now", "5 mins ago", "2 hours ago", "Yesterday", "21 Nov 2026"
 */
export function formatRelativeTime(input?: string | number | Date | null): string {
  if (!input) return '—';
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return '—';

    const now = Date.now();
    const diffMs = now - d.getTime();

    // Future timestamp safeguard
    if (diffMs < 0) {
      return formatISTDateTime(d);
    }

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} mins ago`;
    if (diffHour === 1) return '1 hour ago';
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;

    return formatISTDate(d);
  } catch {
    return '—';
  }
}
