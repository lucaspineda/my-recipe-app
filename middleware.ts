import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_MAX_AGE, VARIANT_COOKIE, VISITOR_COOKIE, pickLandingVariant } from './app/lib/landingExperiment';
import { SIGNED_IN_COOKIE } from './app/lib/signedInHint';

// Assigns the landing A/B variant on the server, so the HTML for "/" already contains the visitor's landing page
// instead of a blank screen that waits for JavaScript. Same cookies and 50/50 rule as assignLandingVariant().
export function middleware(request: NextRequest) {
  // Returning signed-in users get their dashboard, not the test
  if (request.cookies.has(SIGNED_IN_COOKIE)) return NextResponse.next();

  const currentVariant = request.cookies.get(VARIANT_COOKIE)?.value;
  const currentVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const variant = pickLandingVariant(request.nextUrl.searchParams.get('lp'), currentVariant);
  const visitorId = currentVisitorId || crypto.randomUUID();
  if (variant === currentVariant && visitorId === currentVisitorId) return NextResponse.next();

  // Hand the cookies to this request's render too, then set them in the browser
  request.cookies.set(VARIANT_COOKIE, variant);
  request.cookies.set(VISITOR_COOKIE, visitorId);
  const response = NextResponse.next({ request: { headers: request.headers } });
  const options = {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
  response.cookies.set(VARIANT_COOKIE, variant, options);
  response.cookies.set(VISITOR_COOKIE, visitorId, options);
  return response;
}

export const config = { matcher: '/' };
