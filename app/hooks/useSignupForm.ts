import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TagManager from 'react-gtm-module';
import { useUserAuth } from './userAuth';

const schema = z.object({
  email: z.string().email('Email não é válido'),
  password: z
    .string({ required_error: 'Senha é obrigatório' })
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula'),
});

// Email signup shared by both signup page designs (see app/signup/page.tsx)
export function useSignupForm(redirectTo: string) {
  const [password, setPassword] = useState('');
  const [passwordChecks, setPasswordChecks] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
  };

  const router = useRouter();
  const { signUpWithEmail, loading, error: signUpError } = useUserAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const handleSignUpWithEmail = async (data) => {
    const user = await signUpWithEmail(data.email, data.password, router, redirectTo);
    console.log('User signed up:', user);
    if (user) {
      TagManager.dataLayer({
        dataLayer: {
          event: 'sign_up',
        },
      });
    }
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    setPasswordChecks(true);
  };

  return {
    register,
    errors,
    onSubmit: handleSubmit(handleSignUpWithEmail),
    checks,
    passwordChecks,
    onPasswordChange,
    showPassword,
    setShowPassword,
    loading,
    signUpError,
    loginHref: redirectTo === '/recipe' ? '/login?redirectTo=/recipe' : '/login',
  };
}
