import { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  updatePassword,
  User,
} from "firebase/auth";
import { Router } from "next/router";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const useUserAuth = () => {
  const [error, setError] = useState<string>("");
  const auth = getAuth();

  const signInWithEmail = async (
    email: string,
    password: string,
    router?: AppRouterInstance
  ) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (router) {
        router.push("/recipe");
      }
      return userCredential.user;
    } catch {
      console.log("dados incorretos 1");
      setError("Dados incorretos");
    }
  };

  const saveNewPassword = async (user, password) => {
    try {
      console.log("chamou aqui", user, password);
      await updatePassword(user, password);
      console.log("chamou aqui 2");
      return true
    } catch {
      setError("Erro ao atualizar senha, tente novamente");
      console.log("Erro ao atualizar senha, tente novamente");
      return falseß
    }
  };

  const reauthenticateAndSaveNewPassword = async (
    user: User,
    currentPassword,
    newPassword
  ) => {
    try {
      const userLocal = await signInWithEmail(user.email, currentPassword);
      if (userLocal) {
        const passworSaved = await saveNewPassword(user, newPassword);
        if (passworSaved) {
          return true;
        }
      }
    } catch {
      console.log("Erro ao salvar nova senha");
      setError("Erro ao atualizar senha");
    }
  };
  return {
    signInWithEmail,
    saveNewPassword,
    reauthenticateAndSaveNewPassword,
    error,
  };
};
