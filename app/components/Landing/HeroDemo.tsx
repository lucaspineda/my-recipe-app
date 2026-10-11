import type { CSSProperties } from 'react';
import { ArrowRight, ChefHat, Clock } from 'lucide-react';
import Ladrilho from './Ladrilho';
import styles from './Landing.module.css';

const ingredients = ['ovos', 'arroz de ontem', 'tomate', 'muçarela', 'cebolinha'];

export default function HeroDemo() {
  return (
    <div className="relative overflow-hidden rounded-2xl px-4 py-10 sm:px-8 md:py-16">
      <Ladrilho size={76} className="absolute inset-0" />
      <figure className="relative mx-auto grid max-w-4xl items-center gap-6 rounded-2xl bg-[#fffaf3] p-6 shadow-[0_24px_48px_-16px_rgba(5,38,45,0.7)] sm:p-8 md:grid-cols-[1fr_auto_1.15fr] md:gap-8 md:p-10">
        <figcaption className="sr-only">Exemplo de receita criada pelo Chefinho IA</figcaption>

        <div>
          <p className={`${styles.display} text-2xl text-secondary`}>O que tem aí na geladeira?</p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Ingredientes">
            {ingredients.map((ingredient, index) => (
              <li
                key={ingredient}
                className={`${styles.chip} rounded-full bg-secondary px-3 py-1 text-sm font-medium text-white`}
                style={{ '--i': index } as CSSProperties}
              >
                {ingredient}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-[#4a5a5f]">Para o almoço, em até 30 minutos.</p>
        </div>

        <div
          aria-hidden="true"
          className={`${styles.arrow} flex h-11 w-11 items-center justify-center justify-self-center rounded-full bg-tertiary text-[#24343a]`}
        >
          <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
        </div>

        <div className={`${styles.recipe} border-t-2 border-dashed border-secondary/20 pt-6 md:border-l-2 md:border-t-0 md:pl-8 md:pt-0`}>
          <p className="text-sm text-[#4a5a5f]">O Chefinho sugere</p>
          <p className={`${styles.display} mt-1 text-3xl leading-tight text-secondary md:text-4xl`}>
            Arroz de forno cremoso
          </p>
          <p className="mt-3 leading-relaxed text-[#24343a]">
            O arroz que sobrou ganha ovos batidos e tomate picado, vai para o forno coberto de muçarela e sai dourado
            por cima.
          </p>
          <div className="mt-4 flex gap-5 text-sm font-medium text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" />
              30 min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ChefHat className="h-4 w-4" aria-hidden="true" />
              Iniciante
            </span>
          </div>
        </div>
      </figure>
    </div>
  );
}
