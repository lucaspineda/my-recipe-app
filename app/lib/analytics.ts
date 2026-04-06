import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../hooks/userAuth";
import { getAuth } from "firebase/auth";
import { getPlatform, isRunningAsPWA } from "./utils";

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

/**
 * Captures UTM params or GCLID from the current URL/cookies and persists
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

  // No UTMs — check for Google Ads GCLID cookie (only on first landing)
  if (!sessionStorage.getItem(UTM_STORAGE_KEY) && hasGclidCookie()) {
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
 */
export async function trackPageVisit(pageName: string) {
  await trackEvent("page_visit", { pageName });
}
