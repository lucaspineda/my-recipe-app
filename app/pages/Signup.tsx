'use client';

import Link from 'next/link';
import { BookmarkCheck, CalendarDays, Check, Circle, Eye, EyeOff, Loader2, ShoppingCart, Sparkles } from 'lucide-react';
import LandingHeader from '../components/Landing/LandingHeader';
import LandingFooter from '../components/Landing/LandingFooter';
import GoogleSignInButton from '../components/GoogleButton/GoogleButton';
import FacebookSignInButton from '../components/FacebookButton/FacebookButton';
import { useSignupForm } from '../hooks/useSignupForm';
import { instrumentSans } from '../lib/fonts';

const benefits = [
  {
    icon: Sparkles,
    title: 'Receitas com o que você tem',
    text: 'Diga os ingredientes e receba a receita com quantidades e modo de preparo.',
  },
  {
    icon: BookmarkCheck,
    title: 'Tudo salvo em Minhas receitas',
    text: 'Volte a qualquer receita quando quiser cozinhar de novo.',
  },
  {
    icon: ShoppingCart,
    title: 'Lista de compras pronta',
    text: 'Os ingredientes da receita vão direto para a lista.',
  },
  {
    icon: CalendarDays,
    title: 'Planejamento da semana',
    text: 'Encaixe cada receita no café, almoço ou jantar do dia.',
  },
];

const passwordRules = [
  { key: 'minLength', label: 'Pelo menos 8 caracteres' },
  { key: 'hasUpperCase', label: 'Uma letra maiúscula' },
  { key: 'hasLowerCase', label: 'Uma letra minúscula' },
] as const;

const socialButtonClass =
  'flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-300 bg-white text-[15px] font-medium text-zinc-900 transition-colors hover:border-zinc-400 hover:bg-zinc-50';

const inputClass =
  'h-12 w-full rounded-xl border-[1.5px] border-zinc-300 bg-white px-3.5 text-base text-zinc-900 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-[3px] focus:ring-zinc-900/10 aria-[invalid=true]:border-red-600';

const errorText = (message: unknown) => (typeof message === 'string' ? message : null);

// Signup in the style of the redesigned landing page: the redesign arm of the landing A/B test
export default function Signup({ redirectTo }: { redirectTo: string }) {
  const { register, errors, onSubmit, checks, onPasswordChange, showPassword, setShowPassword, loading, signUpError, loginHref } =
    useSignupForm(redirectTo);
  const passwordField = register('password');
  const emailError = errorText(errors?.email?.message);
  const passwordError = errorText(errors?.password?.message);
  const fromRecipe = redirectTo === '/recipe';

  return (
    <div className={`landing ${instrumentSans.className} flex min-h-screen flex-col bg-white text-zinc-900 antialiased`}>
      <LandingHeader />
      <main className="flex-1 px-4 pb-20 pt-8 sm:px-8 md:pt-14">
        {/* Mobile: intro, form, benefits. Desktop: intro and benefits on the left, form on the right */}
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_440px] lg:grid-rows-[auto_1fr] lg:gap-x-16">
          <div className="lg:pt-8">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-basil/10 px-3 py-1.5 text-[13px] font-semibold text-basil">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              3 receitas grátis por mês
            </p>
            <h1 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-zinc-900 md:text-5xl">
              {fromRecipe ? 'Falta só criar sua conta' : 'Crie sua conta grátis'}
            </h1>
            <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-zinc-600">
              {fromRecipe
                ? 'O que você preencheu fica guardado. Depois do cadastro, é só gerar a receita.'
                : 'Gere suas primeiras receitas sem pagar nada e guarde todas em um só lugar.'}
            </p>
          </div>

          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-lift sm:p-8">
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
                <label htmlFor="signup-email" className="text-sm font-medium text-zinc-900">
                  E-mail
                </label>
                <input
                  {...register('email')}
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? 'signup-email-error' : undefined}
                  className={`mt-1.5 ${inputClass}`}
                />
                {emailError && (
                  <p id="signup-email-error" className="mt-1.5 text-sm text-red-700">
                    {emailError}
                  </p>
                )}

                <label htmlFor="signup-password" className="mt-5 text-sm font-medium text-zinc-900">
                  Senha
                </label>
                <div className="relative mt-1.5">
                  <input
                    {...passwordField}
                    onChange={(e) => {
                      passwordField.onChange(e);
                      onPasswordChange(e.target.value);
                    }}
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Crie uma senha"
                    aria-invalid={passwordError ? true : undefined}
                    aria-describedby="signup-password-rules"
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
                <ul id="signup-password-rules" className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]">
                  {passwordRules.map(({ key, label }) => (
                    <li
                      key={key}
                      className={`flex items-center gap-1.5 ${checks[key] ? 'text-basil' : 'text-zinc-500'}`}
                    >
                      {checks[key] ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Circle className="h-3 w-3" aria-hidden="true" />
                      )}
                      {label}
                      {checks[key] && <span className="sr-only">(ok)</span>}
                    </li>
                  ))}
                </ul>
                {passwordError && <p className="mt-2 text-sm text-red-700">{passwordError}</p>}
                {signUpError && (
                  <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-800">
                    {signUpError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-basil px-6 text-base font-semibold text-white transition-colors hover:bg-basil-dark"
                >
                  {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                  Criar conta
                </button>
              </form>

              <p className="mt-4 text-balance text-center text-[13px] leading-relaxed text-zinc-500">
                Ao criar sua conta, você concorda com os{' '}
                <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-900">
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-900">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>

            <p className="mt-6 text-center text-[15px] text-zinc-600">
              Já tem uma conta?{' '}
              <Link href={loginHref} className="font-semibold text-zinc-900 underline underline-offset-4">
                Entrar
              </Link>
            </p>
          </div>

          <div className="border-t border-zinc-200 pt-10 lg:col-start-1 lg:row-start-2 lg:border-t-0 lg:pt-0">
            <h2 className="text-sm font-semibold text-zinc-900">Com sua conta</h2>
            <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {benefits.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-900">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold tracking-[-0.01em] text-zinc-900">{title}</p>
                    <p className="mt-0.5 text-[15px] leading-relaxed text-zinc-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[15px] text-zinc-600">
              Precisa de mais receitas?{' '}
              <Link href="/plans-public" className="font-semibold text-zinc-900 underline underline-offset-4">
                Ver planos
              </Link>
            </p>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
