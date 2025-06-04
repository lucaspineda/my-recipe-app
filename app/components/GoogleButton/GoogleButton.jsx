'use client';

import GoogleIcon from './GoogleIcon';
import { useGoogleLogin } from '@react-oauth/google';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { useUserAuth } from '../../hooks/userAuth';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';

const notify = () => toast.error('Erro ao entrar com o Google. Tente novamente.');

export default function GoogleSignInButton() {
    const auth = getAuth();
  
  const { getUserByUid, createUserInDBByUid, getUser } = useUserAuth();
  const [loading, setLoading] = useState(false);

  const signInWithGoogleAccessToken = async (accessToken) => {
    setLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(null, accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      console.log(userCredential, 'userCredential')
      const user = userCredential.user;
      const userExists = await getUserByUid(user.uid) || false;
      if (!userExists) {
        await createUserInDBByUid(user.email, user.uid);
      } else {
        console.log('Usuário já existe no banco de dados:', user.email);
      }
      // TODO: need to refactor and remove duplicate getUser functions calls
      getUser()
      console.log('Usuário autenticado com sucesso:', user.email);
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
        <span className="text-gray-800">
          {loading ? 'Entrando...' : 'Entrar com o Google'}
        </span>
      </button>
    </>
  );
}
