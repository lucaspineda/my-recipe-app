import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export const useUserAuth = () => {
  const [error, setError] = useState<string>("");
  const auth = getAuth();

  const signInWithEmail = async (email, password, router) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/recipe");
    } catch {
      setError("Dados incorretos");
    }
  };
  return { signInWithEmail, error };
};
