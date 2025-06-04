'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUserAuth } from '../hooks/userAuth';
import Button from '../components/Button/Button';
import GoogleSignInButton from '../components/GoogleButton/GoogleButton';

const schema = z.object({
  email: z.string().email('Email é obrigatório'),
  password: z.string().min(1, { message: 'Senha é obrigatório' }),
});

export default function Login() {
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
    await signInWithEmail(data.email, data.password, router);
  };

  return (
    <main className="flex flex-col text-center h-screen justify-center w-full max-w-[420px] justify-self-center">
      <div>
        <h1 className="text-2xl">Bem-Vindo ao Chefinho IA</h1>
        <h2 className="my-6">Faça seu login</h2>
        <GoogleSignInButton />
        <div className="flex items-center my-4">
          <hr className="flex-grow border-t border-gray-400" />
          <span className="mx-4 text-sm text-gray-700">Ou continuar com e-mail</span>
          <hr className="flex-grow border-t border-gray-400" />
        </div>
        <form onSubmit={handleSubmit(handleSignInWithEmail)} className="flex flex-col justify-start items-start">
          <input
            {...register('email')}
            className="global-input"
            data-clarity-unmask="true"
            id="login"
            type="text"
            placeholder="Digite seu e-mail"
          />
          {errors?.email?.message && (
            <span className="text-red-700 text-sm m-2">{errors?.email?.message.toString()}</span>
          )}
          <input
            {...register('password')}
            className="global-input mt-2"
            id="password"
            type="password"
            placeholder="Digite sua senha"
          />
          {errors?.password?.message && (
            <span className="text-red-700 text-sm m-2">{errors?.password?.message.toString()}</span>
          )}
          {signInError && <span className="text-red-700 text-sm m-2">{signInError}</span>}
          <span className="text-xs mt-8 text-left"></span>
          <Button loading={loading}>Entrar</Button>
        </form>
        <div className="flex flex-col items-center">
          <span className="text-xs mt-4 text-left">
            Não tem conta ainda?&nbsp;
            <Link href="/signup">Faça seu cadastro</Link>
          </span>
          <span className="text-xs mt-4 text-left">
            Perdeu a senha?&nbsp;
            <Link href="/password-reset">Clique aqui para recuperar a senha</Link>
          </span>
        </div>
      </div>
    </main>
  );
}
