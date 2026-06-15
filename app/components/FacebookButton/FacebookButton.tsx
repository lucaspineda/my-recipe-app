'use client';

import { useState } from 'react';
import FacebookLogin from '@greatsumini/react-facebook-login';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '../../hooks/userAuth';
import { toast } from 'react-toastify';
import FacebookIcon from './FacebookIcon';

const handleError = (error: any) => {
  console.error('Facebook sign in error:', error);
  toast.error('Erro ao entrar com o Facebook. Tente novamente.');
};

export default function FacebookSignInButton({ redirectTo = '/' }: { redirectTo?: string }) {
  const router = useRouter();
  const { handleFacebookResponse } = useUserAuth();
  const [loading, setLoading] = useState(false);


  return (
    <FacebookLogin
      appId={'1507399270704823'}
      onSuccess={(response) => {
        setLoading(true);
        handleFacebookResponse(response, router, redirectTo).finally(() => setLoading(false));
      }}
      onFail={(error) => {
        console.log('Facebook Login Failed:', error);
        handleError(error);
        setLoading(false);
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
