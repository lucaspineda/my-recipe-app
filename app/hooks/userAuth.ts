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
  const [signUpWithEmailLoading, setSignUpWithEmailLoading] = useState<boolean>(false);
  const [signInWithEmailLoading, setSignInWithEmailLoading] = useState<boolean>(false);
  // const [saveNewPasswordLoading, setSaveNewPasswordLoading] = useState<boolean>(false);
  const [reauthenticateLoading, setReauthenticateLoading] = useState<boolean>(false);
  const auth = getAuth();

  const signUpWithEmail = async (email, password, router) => {
    setSignUpWithEmailLoading(true)
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
      setError("Erro ao cadastrar");
      console.log("erro ao cadastrar usuário");
    } finally {
      setSignUpWithEmailLoading(false)
    }
  };

  const signInWithEmail = async (
    email: string,
    password: string,
    router?: AppRouterInstance
  ) => {
    setSignInWithEmailLoading(true)
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
    } finally {
      setSignInWithEmailLoading(false)
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
    setReauthenticateLoading(true)
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
    } finally {
      setReauthenticateLoading(false)
    }
  };
  return {
    signUpWithEmail,
    signUpWithEmailLoading,
    signInWithEmail,
    signInWithEmailLoading,
    reauthenticateAndSaveNewPassword,
    reauthenticateLoading,
    error,
  };
};
