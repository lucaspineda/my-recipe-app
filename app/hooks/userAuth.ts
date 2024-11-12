import { useState } from "react";
import {
  createUserWithEmailAndPassword,
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

  const signUpWithEmail = async (email, password, router) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (router) {
        router.push("/recipe");
      }
      return userCredential.user
    } catch {
      console.log("erro ao cadastrar usuário");
    }
  };

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
      return true;
    } catch {
      setError("Erro ao atualizar senha, tente novamente");
      console.log("Erro ao atualizar senha, tente novamente");
      return false;
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
    signUpWithEmail,
    signInWithEmail,
    saveNewPassword,
    reauthenticateAndSaveNewPassword,
    error,
  };
};
