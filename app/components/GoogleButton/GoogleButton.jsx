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
  
  const { signInWithGoogleAccessToken } = useUserAuth();
  const [loading, setLoading] = useState(false);

  const googleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      await signInWithGoogleAccessToken(tokenResponse.access_token);
      setLoading(false);
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
