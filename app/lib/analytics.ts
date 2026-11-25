import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../hooks/userAuth";
import { getAuth } from "firebase/auth";
import { getPlatform, isRunningAsPWA } from "./utils";
import { getLandingVariant, getLandingVisitorId } from "./landingExperiment";

const UTM_STORAGE_KEY = "utm_attribution";

interface TrafficAttribution {
  source: string;
  medium: string;
  details: Record<string, string>;
}

function getUtmParamsFromUrl(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const utms: Record<string, string> = {};
  for (const key of utmKeys) {
    const value = params.get(key);
    if (value) utms[key] = value;
  }
  return utms;
}

function hasGclidCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith("_gcl_aw="));
}

// Google Ads adds one of these click ids to the landing URL (gbraid/wbraid on iOS)
const GOOGLE_ADS_CLICK_IDS = ["gclid", "gbraid", "wbraid"];

/** Google Ads click from the URL; the _gcl_aw cookie only exists after GTM has loaded, too late for the first page. */
function getGoogleAdsAttribution(): TrafficAttribution | null {
  const params = new URLSearchParams(window.location.search);
  const clickId = GOOGLE_ADS_CLICK_IDS.find((key) => params.get(key));
  if (!clickId) return null;
  const campaignId = params.get("gad_campaignid");
  return {
    source: "google",
    medium: "cpc",
    details: { clickId, ...(campaignId && { campaignId }) },
  };
}

// Referrer hosts worth naming; anything else external is a plain referral
const REFERRERS: { pattern: RegExp; source: string; medium: string }[] = [
  { pattern: /(^|\.)google\.|googlequicksearchbox/, source: "google", medium: "organic" },
  { pattern: /(^|\.)bing\.com$/, source: "bing", medium: "organic" },
  { pattern: /(^|\.)duckduckgo\.com$/, source: "duckduckgo", medium: "organic" },
  { pattern: /(^|\.)search\.brave\.com$/, source: "brave", medium: "organic" },
  { pattern: /(^|\.)yahoo\./, source: "yahoo", medium: "organic" },
  { pattern: /(^|\.)(youtube\.com|youtu\.be)$/, source: "youtube", medium: "social" },
  { pattern: /(^|\.)instagram\.com$/, source: "instagram", medium: "social" },
  { pattern: /(^|\.)facebook\.com$/, source: "facebook", medium: "social" },
  { pattern: /(^|\.)(t\.co|x\.com|twitter\.com)$/, source: "twitter", medium: "social" },
  { pattern: /(^|\.)tiktok\.com$/, source: "tiktok", medium: "social" },
  { pattern: /(^|\.)whatsapp\.com$/, source: "whatsapp", medium: "social" },
];

// Sign-in and payment pages send people back here mid-visit; they're not where the visitor came from
const IGNORED_REFERRERS = /(^|\.)(accounts\.google\.com|firebaseapp\.com|stripe\.com)$/;

/** Where the visitor came from, by referrer. Direct visits (no referrer) stay "organic"/"none" as before. */
function getReferrerAttribution(): TrafficAttribution | null {
  if (!document.referrer) return null;
  let host: string;
  try {
    host = new URL(document.referrer).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  if (!host || host === window.location.hostname.replace(/^www\./, "") || IGNORED_REFERRERS.test(host)) return null;
  const known = REFERRERS.find(({ pattern }) => pattern.test(host));
  return known
    ? { source: known.source, medium: known.medium, details: {} }
    : { source: host, medium: "referral", details: {} };
}

/**
 * Captures UTM params, a Google Ads click id or the referrer from the current URL/cookies and persists
 * them to sessionStorage. Call once on app load.
 */
export function captureUtmParams(): void {
  if (typeof window === "undefined") return;

  const utms = getUtmParamsFromUrl();

  if (Object.keys(utms).length > 0) {
    // UTMs present — richer attribution, overwrite any previous
    const attribution: TrafficAttribution = {
      source: utms.utm_source,
      medium: utms.utm_medium || "unknown",
      details: {
        ...(utms.utm_campaign && { campaign: utms.utm_campaign }),
        ...(utms.utm_content && { content: utms.utm_content }),
        ...(utms.utm_term && { term: utms.utm_term }),
      },
    };
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(attribution));
    return;
  }

  // A Google Ads click in the URL is a new visit from an ad, so it also overwrites
  const adsAttribution = getGoogleAdsAttribution();
  if (adsAttribution) {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(adsAttribution));
    return;
  }

  // Otherwise only the first page of the session counts: later pages have the site itself as referrer
  if (sessionStorage.getItem(UTM_STORAGE_KEY)) return;

  const referrerAttribution = getReferrerAttribution();
  if (referrerAttribution) {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(referrerAttribution));
    return;
  }

  // No UTMs, click id or referrer — check for Google Ads GCLID cookie (only on first landing)
  if (hasGclidCookie()) {
    const attribution: TrafficAttribution = {
      source: "google",
      medium: "cpc",
      details: { note: "gclid_only" },
    };
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(attribution));
  }
}

function getStoredAttribution(): TrafficAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Tracks an event by saving it to the Firestore `events` collection.
 * @param eventName - The name of the event.
 * @param metadata - Optional metadata associated with the event.
 */
export async function trackEvent(
  eventName: string,
  metadata?: Record<string, any>
) {
  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid || "unknown";
    const userEmail = auth.currentUser?.email || "unknown";

    // Extract host and route from the page URL
    const host = typeof window !== "undefined" ? window.location.host : "unknown";
    const route = typeof window !== "undefined" ? window.location.pathname : "unknown";

    const attribution = getStoredAttribution();

    const eventsCollection = collection(db, "events");
    await addDoc(eventsCollection, {
      userId,
      userEmail,
      eventName,
      host,
      route,
      trafficSource: attribution?.source ?? "organic",
      trafficMedium: attribution?.medium ?? "none",
      trafficDetails: attribution?.details ?? null,
      userPlatform: getPlatform(),
      isPWA: isRunningAsPWA(),
      landingVariant: getLandingVariant(),
      landingVisitorId: getLandingVisitorId(),
      createdAt: serverTimestamp(),
      metadata: metadata || null,
    });
  } catch (error) {
    console.error("Error tracking event:", error);
  }
}

/**
 * Tracks a page visit event.
 * @param pageName - The name of the page being visited.
 * @param metadata - Optional extra metadata for the visit.
 */
export async function trackPageVisit(pageName: string, metadata?: Record<string, any>) {
  await trackEvent("page_visit", { pageName, ...metadata });
}
