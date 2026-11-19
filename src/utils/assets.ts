/**
 * Utility to resolve static public assets cleanly across:
 * 1. Local development (http://localhost:3000)
 * 2. GitHub Pages subpaths (https://bharath0990.github.io/KNR-Enterprises/)
 * 3. Custom domain deployments (https://knrenterprises.in)
 */
export function getAssetUrl(path: string | undefined | null): string {
  if (!path) return '';

  // Leave external/remote URLs (Unsplash, Supabase Storage, CDN, data/blob URIs) untouched
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  // Strip leading slash or dot-slash
  const cleanPath = path.replace(/^(\.\/|\/)/, '');
  const baseUrl = import.meta.env.BASE_URL || './';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return `${prefix}${cleanPath}`;
}
