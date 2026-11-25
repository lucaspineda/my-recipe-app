// A cookie that says "this browser was signed in last time". The server reads it to decide what "/" shows
// before Firebase Auth has loaded in the browser: the landing page for everyone else, a loading screen for
// returning users. It only picks the first render; access is still decided by Firebase Auth and the rules.

export const SIGNED_IN_COOKIE = 'cf_signed_in';
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function setSignedInHint(signedIn: boolean) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = signedIn
    ? `${SIGNED_IN_COOKIE}=1; path=/; max-age=${MAX_AGE}; samesite=lax${secure}`
    : `${SIGNED_IN_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
}
