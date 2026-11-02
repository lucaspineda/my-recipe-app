"use client";

import { useRef, Suspense } from 'react';
import MealForm from "../components/MealForm/MealForm";
import LandingHeader from "../components/Landing/LandingHeader";
import LandingHero from "../components/Landing/LandingHero";
import AfterRecipeSection from "../components/Landing/AfterRecipeSection";
import TestimonialsSection from "../components/Landing/TestimonialsSection";
import LandingFooter from "../components/Landing/LandingFooter";
import { instrumentSans } from "../lib/fonts";

export default function Landing() {
  const formSectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Hero CTA: jump to the form and put the cursor in the ingredients field
  const startWithIngredients = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    formSectionRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    formRef.current?.querySelector<HTMLInputElement>('input[type="text"]')?.focus({ preventScroll: true });
  };

  return (
    <div className={`landing ${instrumentSans.className} min-h-screen bg-white text-zinc-900 antialiased`}>
      <LandingHeader />
      <main>
        <LandingHero onStart={startWithIngredients} />
        <AfterRecipeSection />
        <TestimonialsSection />

        <section
          id="criar-receita"
          ref={formSectionRef}
          aria-labelledby="criar-receita-titulo"
          className="scroll-mt-16 border-t border-zinc-200 px-4 py-20 sm:px-8 md:scroll-mt-[72px] md:py-28"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              id="criar-receita-titulo"
              className="text-balance text-center text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-zinc-900 md:text-5xl"
            >
              Monte sua receita
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-balance text-center text-[17px] leading-relaxed text-zinc-600">
              Comece pelos ingredientes. Ao tocar em Gerar Receita, você cria sua conta e ganha 3 receitas grátis. O
              que você preencheu fica guardado.
            </p>
            <div className="landing-form mt-10 rounded-3xl border border-zinc-200 bg-white p-5 shadow-lift sm:p-8 md:mt-12 md:p-10">
              <Suspense fallback={null}>
                <MealForm ref={formRef} />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
