// A/B test of the logged-out landing page: "control" is the previous page, "redesign" the new one.
// The variant lives in a cookie so it sticks across visits; trackEvent reads it to tag every event.

export type LandingVariant = 'control' | 'redesign';

const VARIANTS: LandingVariant[] = ['control', 'redesign'];
const VARIANT_COOKIE = 'lp_variant';
const VISITOR_COOKIE = 'lp_vid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

const isVariant = (value: string | null): value is LandingVariant => VARIANTS.includes(value as LandingVariant);

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

function writeCookie(name: string, value: string) {
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure}`;
}

function randomId(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function getLandingVariant(): LandingVariant | null {
  const variant = readCookie(VARIANT_COOKIE);
  return isVariant(variant) ? variant : null;
}

/** Anonymous id that links a logged-out visit to the signup that follows it. */
export function getLandingVisitorId(): string | null {
  return readCookie(VISITOR_COOKIE);
}

/**
 * Returns the visitor's variant, assigning one 50/50 on the first visit.
 * `?lp=control` or `?lp=redesign` forces a variant (for QA).
 */
export function assignLandingVariant(): LandingVariant {
  const forced = new URLSearchParams(window.location.search).get('lp');
  const variant = isVariant(forced)
    ? forced
    : getLandingVariant() ?? (Math.random() < 0.5 ? 'control' : 'redesign');

  writeCookie(VARIANT_COOKIE, variant);
  writeCookie(VISITOR_COOKIE, getLandingVisitorId() ?? randomId());
  return variant;
}
