'use client';

import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import LandingHeader from '../components/Landing/LandingHeader';
import LandingFooter from '../components/Landing/LandingFooter';
import GoogleSignInButton from '../components/GoogleButton/GoogleButton';
import FacebookSignInButton from '../components/FacebookButton/FacebookButton';
import { useLoginForm } from '../hooks/useLoginForm';
import { instrumentSans } from '../lib/fonts';

const socialButtonClass =
  'flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-300 bg-white text-[15px] font-medium text-zinc-900 transition-colors hover:border-zinc-400 hover:bg-zinc-50';

const inputClass =
  'h-12 w-full rounded-xl border-[1.5px] border-zinc-300 bg-white px-3.5 text-base text-zinc-900 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-[3px] focus:ring-zinc-900/10 aria-[invalid=true]:border-red-600';

const errorText = (message: unknown) => (typeof message === 'string' ? message : null);

// Login in the style of the redesigned landing page: the redesign arm of the landing A/B test
export default function Login({ redirectTo }: { redirectTo: string }) {
  const { register, errors, onSubmit, showPassword, setShowPassword, loading, signInError, signupHref } =
    useLoginForm(redirectTo);
  const emailError = errorText(errors?.email?.message);
  const passwordError = errorText(errors?.password?.message);
  const fromRecipe = redirectTo === '/recipe';

  return (
    <div className={`landing ${instrumentSans.className} flex min-h-screen flex-col bg-white text-zinc-900 antialiased`}>
      <LandingHeader />
      <main className="flex-1 px-4 pb-20 pt-8 sm:px-8 md:pt-14">
        <div className="mx-auto max-w-[440px]">
          <div className="text-center">
            <h1 className="text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-zinc-900 md:text-[2.5rem]">
              {fromRecipe ? 'Entre para gerar sua receita' : 'Entre na sua conta'}
            </h1>
            <p className="mx-auto mt-3 max-w-[40ch] text-balance text-[17px] leading-relaxed text-zinc-600">
              {fromRecipe
                ? 'O que você preencheu fica guardado. Depois de entrar, é só gerar a receita.'
                : 'Suas receitas, lista de compras e planejamento da semana estão te esperando.'}
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5 shadow-lift sm:p-8">
            <div className="flex flex-col gap-3">
              <GoogleSignInButton redirectTo={redirectTo} className={socialButtonClass} />
              <FacebookSignInButton redirectTo={redirectTo} className={socialButtonClass} />
            </div>

            <div className="my-6 flex items-center gap-4 text-sm text-zinc-500">
              <span className="h-px flex-1 bg-zinc-200" />
              ou com e-mail
              <span className="h-px flex-1 bg-zinc-200" />
            </div>

            <form onSubmit={onSubmit} noValidate className="flex flex-col">
              <label htmlFor="login-email" className="text-sm font-medium text-zinc-900">
                E-mail
              </label>
              <input
                {...register('email')}
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? 'login-email-error' : undefined}
                className={`mt-1.5 ${inputClass}`}
              />
              {emailError && (
                <p id="login-email-error" className="mt-1.5 text-sm text-red-700">
                  {emailError}
                </p>
              )}

              <label htmlFor="login-password" className="mt-5 text-sm font-medium text-zinc-900">
                Senha
              </label>
              <div className="relative mt-1.5">
                <input
                  {...register('password')}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  aria-invalid={passwordError ? true : undefined}
                  aria-describedby={passwordError ? 'login-password-error' : undefined}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute inset-y-0 right-1 my-auto grid h-10 w-10 place-items-center rounded-lg text-zinc-500 hover:text-zinc-900"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordError && (
                <p id="login-password-error" className="mt-1.5 text-sm text-red-700">
                  {passwordError}
                </p>
              )}
              <Link
                href="/password-reset"
                className="mt-2.5 self-end text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
              >
                Esqueceu a senha?
              </Link>
              {signInError && (
                <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-800">
                  {signInError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-basil px-6 text-base font-semibold text-white transition-colors hover:bg-basil-dark"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                Entrar
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[15px] text-zinc-600">
            Ainda não tem conta?{' '}
            <Link href={signupHref} className="font-semibold text-zinc-900 underline underline-offset-4">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
