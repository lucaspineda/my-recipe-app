'use client';

import GoogleIcon from './GoogleIcon';
import { useGoogleLogin } from '@react-oauth/google';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { useUserAuth } from '../../hooks/userAuth';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../../hooks/userAuth';
import { toast } from 'react-toastify';

const notify = () => toast.error('Erro ao entrar com o Google. Tente novamente.');

export default function GoogleSignInButton({ auth }) {
  const { createUserInDB } = useUserAuth();
  const [loading, setLoading] = useState(false);

  const signInWithGoogleAccessToken = async (accessToken) => {
    setLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(null, accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        console.log('Usuário não encontrado no Firestore, criando novo usuário...');
        await createUserInDB(user.email);
      }
      return userCredential;
    } catch (error) {
      console.error('signInWithGoogleAccessToken error:', error);
      notify();

    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await signInWithGoogleAccessToken(tokenResponse.access_token);
      // await signInWithGoogleAccessToken('invalid token'); // teste do toast
    },
    onError: (error) => {
      setLoading(false);
      console.log('Google login failed', error);
    },
  });

  return (
    <>
      <button
        type="button"
        className="global-input flex items-center justify-center gap-2 mb-4"
        onClick={() => googleSignIn()}
        title="Entrar com o Google"
        disabled={loading}
      >
        <i>
          <GoogleIcon />
        </i>
        <span className="text-gray-500">
          {loading ? 'Entrando...' : 'Entrar com o Google'}
        </span>
      </button>
    </>
  );
}
