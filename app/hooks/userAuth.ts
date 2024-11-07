import { useEffect, useState } from 'react'
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from 'next/router';


export const useUserAuth = () => {
  const auth = getAuth();
  const router = useRouter();
  const [error, setError] = useState<string>('');


  const signInWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        router.push("/recipe");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        setError("Dados incorretos")
      });
  };
  return {signInWithEmail, error}
}