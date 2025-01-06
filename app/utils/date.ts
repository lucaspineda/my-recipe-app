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