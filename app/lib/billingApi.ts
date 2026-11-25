import axios from 'axios';
import { auth } from '../hooks/userAuth';

// Calls a /subscription/* route on the backend with the user's Firebase ID token.
export async function postBilling<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Usuário não autenticado');
  const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/subscription/${path}`, body, {
    headers: { Authorization: token },
  });
  return response.data as T;
}

// The backend sends a Portuguese `message` with each error it expects (declined card, no subscription, ...).
export function billingErrorMessage(error: any, fallback: string): string {
  return error?.response?.data?.message || fallback;
}

export const PIX_SUPPORT_WHATSAPP = 'https://wa.me/5511976783992';
