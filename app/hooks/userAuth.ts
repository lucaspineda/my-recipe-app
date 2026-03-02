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
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { trackEvent } from "../lib/utils";
import { FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAUTRpjufvz16h_B-1a9S-zk5r-3-b6wBY",
  authDomain: "recipe-app-1bbdc.firebaseapp.com",
  projectId: "recipe-app-1bbdc",
};
export const app = initializeApp(firebaseConfig);
import { browserLocalPersistence, setPersistence } from 'firebase/auth';
export const auth = getAuth(app);
// Enable persistent auth state
setPersistence(auth, browserLocalPersistence);
export const db = getFirestore(app);

const FreePlan: UserPlan = {
  recipeCount: 3,
  planId: 1,
  startedAt: serverTimestamp(),
 
  name: "Básico",
  cost: 0,
};

export const useUserAuth = () => {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const auth = getAuth();
  const { setUser } = useUserStore();

  const getUser = async () => {
    if (!auth.currentUser) {
      console.log('No authenticated user');
      return;
    }
    
    const docRef = doc(db, "users", auth.currentUser.uid);
    console.log(auth.currentUser.uid, 'auth.currentUser.uid')
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const user = docSnap.data();
      setUser({ ...user, uid: auth.currentUser.uid } as UserDB);
    } else {
      console.log("No such user document! Creating one now...");
      await createUserInDB(auth.currentUser.email);
      const newDocSnap = await getDoc(docRef);
      if (newDocSnap.exists()) {
        const user = newDocSnap.data();
        setUser({ ...user, uid: auth.currentUser.uid } as UserDB);
      }
    }
  };

  const getUserByUid = async (uid: string) => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const user = docSnap.data();
      return user;
    } else {
      console.log("No such user document!!");
      return null;
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

  // TODO: Refatorar para não usar o auth.currentUser.uid
  const createUserInDB = async (email) => {
    await setDoc(doc(db, "users", auth.currentUser.uid), {
      email,
      createdAt: serverTimestamp(),
      plan: FreePlan,
    });
    console.log("Usuário criado no Firestore com sucesso");
  };

  const createUserInDBByUid = async (email, uid) => {
    await setDoc(doc(db, "users", uid), {
      email,
      createdAt: serverTimestamp(),
      plan: FreePlan,
    });
    console.log("Usuário criado no Firestore com sucesso");
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
        await createUserInDB(email);
        await getUser();
        await trackEvent("signup", { method: "email", email });
      }
      if (router) {
        router.push("/recipe");
      }

      return userCredential.user;
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("Este e-mail já está cadastrado.");
      } else {
        setError("Erro ao cadastrar");
        console.log(error);
      }
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
        await trackEvent("signin", { method: "email", email });
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

  const signInWithGoogleAccessToken = async (accessToken) => {
    setLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(null, accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      console.log(userCredential, "userCredential");
      const user = userCredential.user;
      const userExists = (await getUserByUid(user.uid)) || false;
      if (!userExists) {
        await createUserInDBByUid(user.email, user.uid);
      } else {
        console.log("Usuário já existe no banco de dados:", user.email);
      }
      // TODO: need to refactor and remove duplicate getUser functions calls
      getUser();
      await trackEvent("signin", { method: "google", email: user.email });
      console.log("Usuário autenticado com sucesso:", user.email);
      return userCredential;
    } catch (error) {
      console.error("signInWithGoogleAccessToken error:", error);
      setError("Erro ao entrar com o Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookResponse = async (response: any) => {
    setLoading(true);
    try {
      if (response.accessToken) {
        const credential = FacebookAuthProvider.credential(response.accessToken);
        const result = await signInWithCredential(auth, credential);

        if (result.user) {
          const userExists = await getUserByUid(result.user.uid);
          if (!userExists) {
            await createUserInDBByUid(result.user.email, result.user.uid);
          } else {
            console.log('User already exists in DB');
          }
          await getUser();
          await trackEvent("signin", { method: "facebook", email: result.user.email });
        }
      } else {
        console.error('No access token received from Facebook:', response);
        setError('Não foi possível obter acesso do Facebook. Tente novamente.');
      }
    } catch (error) {
      console.error('Detailed Facebook auth error:', {
        error,
        code: error?.code,
        message: error?.message,
        stack: error?.stack
      });
      setError('Erro ao entrar com o Facebook. Tente novamente.');
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
    signInWithGoogleAccessToken,
    handleFacebookResponse,
    error,
    loading,
    createUserInDB,
    getUserByUid,
    createUserInDBByUid,
  };
};
