"use client";

import Image from "next/image";
import MealForm from "../components/MealForm/MealForm";
import { useRef } from 'react';
import TestimonialSection from "../components/TestimonialSection/TestimonialSection";
import StatsSection from "../components/StatsSection/StatsSection";
import FeaturesSection from "../components/FeaturesSection/FeaturesSection";
import HowItWorksSection from "../components/HowItWorksSection/HowItWorksSection";

export default function Landing() {
  const targetRef = useRef(null);
  const handleSignupClick = () => {
    targetRef.current.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className="bg-primary flex items-center flex-col">
      <main className="flex items-center flex-col text-center w-full mb-24">
        <Image
          src="/images/yellow-wave.svg"
          width={400}
          height={180}
          alt="landing page decoration"
          className="absolute left-0 top-[-20px] w-auto md:w-[1200px]"
        />
        <Image
          src="/images/people-cooking.svg"
          width={250}
          height={200}
          alt="test"
          className="mt-20 z-10 w-auto"
        />
        <h1 className="font-semibold mt-16 z-10">Chefinho IA</h1>
        <article className="mt-4 w-80 z-10 md:w-[420px] md:text-lg">
          <p>
            Crie receitas incríveis com os ingredientes que você já tem em casa, usando o poder da Inteligência Artificial!
          </p>
        </article>
        <button
          onClick={handleSignupClick}
          className="bg-secondary w-full mt-24 py-4 text-white rounded-xl
					border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) z-10 font-semibold md:w-96"
        >
          Começar
        </button>
      </main>
      
      {/* Seção de Estatísticas */}
      <StatsSection />
      
      {/* Seção de Funcionalidades */}
      <FeaturesSection />
      
      {/* Seção Como Funciona */}
      <HowItWorksSection />
      
      {/* Seção de Depoimentos */}
      <TestimonialSection />
      
      <div data-meal-form>
        <MealForm ref={targetRef} />
      </div>
    </div>
  );
}
