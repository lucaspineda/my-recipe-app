import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserAuth } from './userAuth';

const schema = z.object({
  email: z.string().email('Email é obrigatório'),
  password: z.string().min(1, { message: 'Senha é obrigatório' }),
});

// Email login shared by both login page designs (see app/login/page.tsx)
export function useLoginForm(redirectTo: string) {
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { signInWithEmail, loading, error: signInError } = useUserAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const handleSignInWithEmail = async (data) => {
    await signInWithEmail(data.email, data.password, router, redirectTo);
  };

  return {
    register,
    errors,
    onSubmit: handleSubmit(handleSignInWithEmail),
    showPassword,
    setShowPassword,
    loading,
    signInError,
    signupHref: redirectTo === '/recipe' ? '/signup?redirectTo=/recipe' : '/signup',
  };
}
