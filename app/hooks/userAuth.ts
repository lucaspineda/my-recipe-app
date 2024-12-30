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
import { User as UserDB, UserPlan } from "../types";
import { useUserStore } from "../store/user";

const firebaseConfig = {
  apiKey: "AIzaSyAUTRpjufvz16h_B-1a9S-zk5r-3-b6wBY",
  authDomain: "recipe-app-1bbdc.firebaseapp.com",
  projectId: "recipe-app-1bbdc",
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const FreePlan: UserPlan = {
  recipesCount: 3,
  planId: 1,
  updatedAt: serverTimestamp(),
  name: "Básico",
  cost: 0,
};

export const useUserAuth = () => {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const auth = getAuth();
  const { setUser } = useUserStore();

  const getUser = async () => {
    const docRef = doc(db, "users", auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const user = docSnap.data();
      setUser(user as UserDB);
    } else {
      console.log("No such document!");
    }
  };

  const updateUser = async (user) => {
    const docRef = doc(db, "users", auth.currentUser.uid);
    setLoading(true);
    try {
      await updateDoc(docRef, user);
      return true;
    } catch (e) {
      setError("Erro ao atualizar usuário");
      console.log("Erro ao atualizar usuário", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createUserInDB = async (email) => {
    await setDoc(doc(db, "users", auth.currentUser.uid), {
      email,
      createdAt: serverTimestamp(),
      plan: FreePlan,
    });
  };

  const registerLoginInDB = async (email) => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      email,
      lastLoginAt: serverTimestamp(),
    });
  };

  const signUpWithEmail = async (email, password, router) => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const signInWithEmail = async (
    email: string,
    password: string,
    router?: AppRouterInstance
  ) => {
    setLoading(true);
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
      setLoading(false);
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
    setLoading(true);
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
      setLoading(false);
    }
  };

  const sendPasswordRecoverEmail = async (email) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch {
      console.log("Erro ao enviar email");
      setError("Erro ao enviar email");
      return false;
    } finally {
      setLoading(false);
    }
  };
  return {
    updateUser,
    getUser,
    signUpWithEmail,
    setLoading,
    signInWithEmail,
    reauthenticateAndSaveNewPassword,
    sendPasswordRecoverEmail,
    error,
    loading
  };
};
