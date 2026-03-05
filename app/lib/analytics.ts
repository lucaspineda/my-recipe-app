import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../hooks/userAuth";
import { getAuth } from "firebase/auth";

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

    const eventsCollection = collection(db, "events");
    await addDoc(eventsCollection, {
      userId,
      userEmail,
      eventName,
      host,
      route,
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
