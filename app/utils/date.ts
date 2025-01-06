import { Timestamp } from "firebase/firestore";

export const formatDate = (timestamp: Timestamp): String | null => {
  const date = timestamp?.toDate()
  const formattedDate = date?.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return formattedDate
}

export const getRemainingDays = (expirationDate: Timestamp) => {
  const now = new Date();
  const expiration = expirationDate.toDate();
  const diffTime = Math.abs(expiration.getTime() - now.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};