'use client';

import Link from 'next/link';
import Button from '../components/Button/Button';
import GoogleSignInButton from '../components/GoogleButton/GoogleButton';
import FacebookSignInButton from '../components/FacebookButton/FacebookButton';
import { useLoginForm } from '../hooks/useLoginForm';

// The login page as it was before the landing redesign: the control arm of the landing A/B test
export default function LegacyLogin({ redirectTo }: { redirectTo: string }) {
  const { register, errors, onSubmit, loading, signInError, signupHref } = useLoginForm(redirectTo);

  return (
    <main className="flex flex-col text-center h-screen justify-center w-full max-w-[420px] justify-self-center">
      <div>
        <h1 className="text-2xl">Bem-Vindo ao Chefinho IA</h1>
        <h2 className="my-6">Faça seu login</h2>
        <div className="space-y-2">
          <GoogleSignInButton redirectTo={redirectTo} />
          <FacebookSignInButton redirectTo={redirectTo} />
        </div>
        <div className="flex items-center my-4">
          <hr className="flex-grow border-t border-gray-400" />
          <span className="mx-4 text-sm text-gray-700">Ou continuar com e-mail</span>
          <hr className="flex-grow border-t border-gray-400" />
        </div>
        <form onSubmit={onSubmit} className="flex flex-col justify-start items-start">
          <input
            {...register('email')}
            className="global-input"
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
            <Link href={signupHref}>Faça seu cadastro</Link>
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
