import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../hooks/userAuth";
import { getAuth } from "firebase/auth";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

/**
 * Recipe data interface supporting both raw (Portuguese) and saved (English) formats.
 */
interface RecipeData {
  // Raw format (from API)
  titulo?: string;
  introducao?: string;
  ingredientes?: any[];
  modoDePreparo?: string[];
  // Saved format (from Firestore)
  title?: string;
  introduction?: string;
  ingredients?: any[];
  preparationMethod?: string[];
}

/**
 * Generates an AI image for a recipe and saves it to Firestore.
 * @param recipeId - The Firestore document ID of the recipe.
 * @param recipe - Recipe data (supports both raw and saved formats).
 * @returns The generated image URL or null if generation fails.
 */
export async function generateRecipeImage(
  recipeId: string,
  recipe: RecipeData
): Promise<string | null> {
  try {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
      console.error("No auth token available for image generation");
      return null;
    }

    const imageResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/gemini/generate-image`,
      {
        recipeTitle: recipe.titulo || recipe.title,
        recipeDescription: recipe.introducao || recipe.introduction,
        ingredients: recipe.ingredientes || recipe.ingredients,
        preparationMethod: recipe.modoDePreparo || recipe.preparationMethod,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    );

    if (imageResponse.data.imageUrl) {
      await updateDoc(doc(db, "recipes", recipeId), {
        imageUrl: imageResponse.data.imageUrl,
      });
      return imageResponse.data.imageUrl;
    }

    return null;
  } catch (error) {
    console.error("Error generating recipe image:", error);
    return null;
  }
}
