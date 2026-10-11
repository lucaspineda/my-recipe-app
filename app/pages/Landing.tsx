"use client";

import { useRef, Suspense, MouseEvent } from 'react';
import MealForm from "../components/MealForm/MealForm";
import HeroDemo from "../components/Landing/HeroDemo";
import HowItWorksSection from "../components/HowItWorksSection/HowItWorksSection";
import TestimonialSection from "../components/TestimonialSection/TestimonialSection";
import styles from "../components/Landing/Landing.module.css";
import { displayFont } from "../lib/fonts";

export default function Landing() {
  const formSectionRef = useRef<HTMLElement>(null);

  const handleStartClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    formSectionRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className={`${displayFont.variable} mx-auto w-full max-w-6xl text-[#24343a]`}>
      <section className="pt-6 md:pt-14">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <h1 className={`${styles.display} text-5xl leading-[0.95] text-secondary md:col-span-7 md:text-7xl lg:text-[5.75rem]`}>
            Receitas com o que você já tem em casa
          </h1>
          <div className="md:col-span-5">
            <p className="max-w-[34rem] text-lg leading-relaxed text-[#4a5a5f]">
              Liste os ingredientes da geladeira e da despensa. O Chefinho IA monta uma receita completa, com modo de
              preparo, em segundos.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href="#monte-sua-receita"
                onClick={handleStartClick}
                className="rounded-xl bg-secondary px-6 py-4 font-semibold text-white no-underline transition-colors hover:bg-[#0b4f5c] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-tertiary"
              >
                Montar minha receita
              </a>
              <span className="text-sm text-[#4a5a5f]">3 receitas grátis para começar</span>
            </div>
          </div>
        </div>
        <div className="mt-10 md:mt-14">
          <HeroDemo />
        </div>
      </section>

      <HowItWorksSection />

      <TestimonialSection />

      <section
        id="monte-sua-receita"
        ref={formSectionRef}
        className="grid scroll-mt-24 gap-10 pb-8 pt-20 md:pt-24 lg:grid-cols-12"
      >
        <div className="lg:col-span-4">
          <h2 className={`${styles.display} text-4xl text-secondary md:text-5xl`}>Monte sua receita</h2>
          <p className="mt-4 max-w-[28rem] text-lg leading-relaxed text-[#4a5a5f]">
            Você cria sua conta grátis quando pedir a primeira receita e já começa com 3 receitas.
          </p>
        </div>
        <div data-meal-form className="lg:col-span-8">
          <Suspense fallback={null}>
            <MealForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
