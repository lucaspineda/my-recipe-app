import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { cache } from 'react';

// Public web config (same project as app/hooks/userAuth.ts). Re-declared here
// so server components can read Firestore without importing the client auth
// module, which calls setPersistence() with browser-only APIs at import time.
const firebaseConfig = {
  apiKey: 'AIzaSyAUTRpjufvz16h_B-1a9S-zk5r-3-b6wBY',
  authDomain: 'recipe-app-1bbdc.firebaseapp.com',
  projectId: 'recipe-app-1bbdc',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export interface RecipeDoc {
  title: string;
  introduction?: string;
  ingredients?: string[];
  preparationMethod?: string[];
  observations?: string[];
  nutritionalInfo?: {
    calorias?: string;
    proteinas?: string;
    carboidratos?: string;
    gorduras?: string;
    fibras?: string;
  };
  imageUrl?: string;
  createdAt?: { seconds: number } | null;
}

// Cached per-request so generateMetadata and the layout share one read.
export const getRecipe = cache(async (id: string): Promise<RecipeDoc | null> => {
  try {
    const snap = await getDoc(doc(db, 'recipes', id));
    return snap.exists() ? (snap.data() as RecipeDoc) : null;
  } catch {
    // Network/permission failure: degrade gracefully to generic metadata.
    return null;
  }
});
