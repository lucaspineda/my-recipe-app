'use client';

import { useState } from 'react';
import FacebookLogin from '@greatsumini/react-facebook-login';
import { signInWithCredential, FacebookAuthProvider, getAuth } from 'firebase/auth';
import { useUserAuth } from '../../hooks/userAuth';
import { toast } from 'react-toastify';
import FacebookIcon from './FacebookIcon';

const handleError = (error: any) => {
  console.error('Facebook sign in error:', error);
  toast.error('Erro ao entrar com o Facebook. Tente novamente.');
};

export default function FacebookSignInButton() {
  const auth = getAuth();
  const { getUserByUid, createUserInDBByUid, getUser } = useUserAuth();
  const [loading, setLoading] = useState(false);

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
        }
      } else {
        console.error('No access token received from Facebook:', response);
        toast.error('Não foi possível obter acesso do Facebook. Tente novamente.');
      }
    } catch (error) {
      console.error('Detailed Facebook auth error:', {
        error,
        code: error?.code,
        message: error?.message,
        stack: error?.stack
      });
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FacebookLogin
      appId={'1507399270704823'}
      onSuccess={handleFacebookResponse}
      onFail={(error) => {
        console.log('Facebook Login Failed:', error);
        handleError(error);
      }}
      className="global-input flex items-center justify-center gap-2 mb-4"
      style={{ backgroundColor: 'white', opacity: loading ? 0.7 : 1, pointerEvents: loading ? 'none' : 'auto' }}
      scope="email,public_profile"
    >
      <div className="flex items-center justify-center gap-2">
        <FacebookIcon />
        <span className="text-gray-800">
          {loading ? 'Entrando...' : 'Entrar com o Facebook'}
        </span>
      </div>
    </FacebookLogin>
  );
}
