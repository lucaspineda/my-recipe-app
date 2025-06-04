'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserAuth } from '../hooks/userAuth';
import Button from '../components/Button/Button';
import { Eye, EyeOff } from 'lucide-react';
import TagManager from 'react-gtm-module';
import GoogleSignInButton from '../components/GoogleButton/GoogleButton';

export default function Signup() {
  const [password, setPassword] = useState('');
  const [passwordChecks, setPasswordChecks] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
  };

  const router = useRouter();

  const schema = z.object({
    email: z.string().email('Email não é válido'),
    password: z
      .string({ required_error: 'Senha é obrigatório' })
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula'),
  });

  const { signUpWithEmail, loading, error: signUpError } = useUserAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const handleSignUpWithEmail = async (data) => {
    const user = await signUpWithEmail(data.email, data.password, router);
    console.log('User signed up:', user);
    if (user) {
      TagManager.dataLayer({
        dataLayer: {
          event: 'sign_up',
        },
      });
    }
  };

  return (
    <main className="flex flex-col text-center h-screen justify-center w-full max-w-[420px] justify-self-center">
      <div className="flex flex-col">
        <h1 className="text-2xl">Bem-Vindo ao Chefinho IA</h1>
        <h2 className="my-6">Crie sua conta</h2>
        <GoogleSignInButton />
        <div className="flex items-center my-4">
          <hr className="flex-grow border-t border-gray-400" />
          <span className="mx-4 text-sm text-gray-700">Ou continuar com e-mail</span>
          <hr className="flex-grow border-t border-gray-400" />
        </div>

        <form onSubmit={handleSubmit(handleSignUpWithEmail)} className="flex flex-col text-left">
          <input
            {...register('email')}
            className="global-input"
            id="login"
            type="text"
            placeholder="Digite seu e-mail"
            data-clarity-unmask="true"
          />
          {errors?.email?.message && (
            <span className="text-red-700 text-sm m-2">
              {typeof errors?.email?.message === 'string' && errors?.email?.message}
            </span>
          )}
          <div className="relative w-full">
            <input
              {...register('password')}
              className="global-input mt-2 pr-10"
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              data-clarity-mask="true"
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordChecks(true);
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-2 -translate-y-1/3 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {passwordChecks && (
            <ul className="text-sm mt-2 ml-2 space-y-1">
              <li className={checks.minLength ? 'text-green-600' : 'text-red-500'}>
                {checks.minLength ? '✔' : '○'} Pelo menos 8 caracteres
              </li>
              <li className={checks.hasUpperCase ? 'text-green-600' : 'text-red-500'}>
                {checks.hasUpperCase ? '✔' : '○'} Pelo menos uma letra maiúscula
              </li>
              <li className={checks.hasLowerCase ? 'text-green-600' : 'text-red-500'}>
                {checks.hasLowerCase ? '✔' : '○'} Pelo menos uma letra minúscula
              </li>
            </ul>
          )}
          {errors?.password?.message && (
            <span className="text-red-700 text-sm m-2">
              {typeof errors?.password?.message === 'string' && errors?.password?.message}
            </span>
          )}
          {signUpError && <span className="text-red-700 text-sm m-2">{signUpError}</span>}
          <Button className="mt-8" loading={loading}>
            Cadastrar
          </Button>
        </form>
        <span className="text-xs mt-4">
          Clicando no botão, você concorda com nossos Termos de Serviço e Política de Privacidade
        </span>
        <span className="mt-6">
          Já tem uma conta? <Link href="/login">Login</Link>
        </span>
      </div>
    </main>
  );
}
