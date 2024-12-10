import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updatePassword,
  User,
} from "firebase/auth";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { initializeApp } from "firebase/app";
import {
  getDoc,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { doc, setDoc } from "firebase/firestore";
import { Plan, UserPlan } from "../types";
import { useUserStore } from "../store/user";

const firebaseConfig = {
  apiKey: "AIzaSyAUTRpjufvz16h_B-1a9S-zk5r-3-b6wBY",
  authDomain: "recipe-app-1bbdc.firebaseapp.com",
  projectId: "recipe-app-1bbdc",
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const useUserAuth = () => {
  const [error, setError] = useState<string>("");
  const [signUpWithEmailLoading, setSignUpWithEmailLoading] =
    useState<boolean>(false);
  const [signInWithEmailLoading, setSignInWithEmailLoading] =
    useState<boolean>(false);
  // const [saveNewPasswordLoading, setSaveNewPasswordLoading] = useState<boolean>(false);
  const [reauthenticateLoading, setReauthenticateLoading] =
    useState<boolean>(false);
  const [passwordRecoverLoading, setPasswordRecoverLoading] =
    useState<boolean>(false);

  const auth = getAuth();
  const { setUserPlanId } = useUserStore();

  const getUserPlanId = async () => {
    const docRef = doc(db, "users", auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const plan: UserPlan = docSnap.data().plan;
      setUserPlanId(plan?.planId);
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
  };

  const createUserInDB = async (email) => {
    await setDoc(doc(db, "users", auth.currentUser.uid), {
      email,
      createdAt: serverTimestamp(),
    });
  };

  const registerLoginInDB = async (email) => {
    await setDoc(doc(db, "users", auth.currentUser.uid), {
      email,
      lastLoginAt: serverTimestamp(),
    });
  };

  const signUpWithEmail = async (email, password, router) => {
    setSignUpWithEmailLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (userCredential) {
        createUserInDB(email);
      }
      if (router) {
        router.push("/recipe");
      }

      return userCredential.user;
    } catch {
      setError("Erro ao cadastrar");
      console.log("erro ao cadastrar usuário");
    } finally {
      setSignUpWithEmailLoading(false);
    }
  };

  const signInWithEmail = async (
    email: string,
    password: string,
    router?: AppRouterInstance
  ) => {
    setSignInWithEmailLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (router) {
        router.push("/recipe");
      }
      if (userCredential) {
        registerLoginInDB(email);
      }
      return userCredential.user;
    } catch {
      console.log("dados incorretos 1");
      setError("Dados incorretos");
    } finally {
      setSignInWithEmailLoading(false);
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
    setReauthenticateLoading(true);
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
      setReauthenticateLoading(false);
    }
  };

  const sendPasswordRecoverEmail = async (email) => {
    setPasswordRecoverLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch {
      console.log("Erro ao enviar email");
      setError("Erro ao enviar email");
      return false;
    } finally {
      setPasswordRecoverLoading(false);
    }
  };
  return {
    getUserPlanId,
    signUpWithEmail,
    signUpWithEmailLoading,
    signInWithEmail,
    signInWithEmailLoading,
    reauthenticateAndSaveNewPassword,
    reauthenticateLoading,
    sendPasswordRecoverEmail,
    passwordRecoverLoading,
    error,
  };
};
