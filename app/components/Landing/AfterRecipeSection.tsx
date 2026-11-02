import { Check, Clock, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

const savedRecipes = [
  { title: 'Omelete de tomate com queijo minas', time: '15 min' },
  { title: 'Frango ao limão com batata-doce', time: '40 min' },
  { title: 'Arroz frito com ovos e cenoura', time: '25 min' },
  { title: 'Strogonoff de frango', time: '30 min' },
];

const shoppingItems = [
  { name: 'Ovos', quantity: '12 unidades', checked: true },
  { name: 'Tomate', quantity: '4 unidades', checked: true },
  { name: 'Queijo minas', quantity: '300 g', checked: false },
  { name: 'Cebola', quantity: '3 unidades', checked: false },
  { name: 'Batata-doce', quantity: '1 kg', checked: false },
];

const mealSlots = ['Café', 'Almoço', 'Jantar'];
const weekPlan: { day: string; meals: (string | null)[] }[] = [
  { day: 'Seg', meals: [null, 'Frango ao limão', null] },
  { day: 'Ter', meals: ['Omelete', null, 'Arroz frito'] },
  { day: 'Qua', meals: [null, 'Strogonoff', null] },
  { day: 'Qui', meals: [null, null, null] },
];

function Feature({
  title,
  text,
  className = '',
  children,
}: {
  title: string;
  text: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li className={className}>
      <div aria-hidden="true" className="h-[248px] overflow-hidden rounded-2xl bg-zinc-100 p-3 pb-0 sm:p-4 sm:pb-0">
        <div className="h-full rounded-t-xl border border-b-0 border-zinc-200 bg-white p-4">{children}</div>
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-zinc-900">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-600">{text}</p>
    </li>
  );
}

export default function AfterRecipeSection() {
  return (
    <section className="border-t border-zinc-200 px-4 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-12">
          <h2 className="max-w-[18ch] text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-zinc-900 md:text-5xl">
            Salve, monte a lista de compras e planeje a semana
          </h2>
          <p className="max-w-[50ch] text-[17px] leading-relaxed text-zinc-600">
            Toda receita que você gera fica em Minhas receitas. De lá, os ingredientes vão para a lista de compras e a
            receita entra no planejamento da semana.
          </p>
        </div>

        <ul className="mt-12 grid gap-12 sm:grid-cols-2 sm:gap-6 md:mt-16 lg:grid-cols-3">
          <Feature title="Minhas receitas" text="Todas as receitas que você criou ficam guardadas, prontas para repetir.">
            <p className="text-sm font-semibold text-zinc-900">Minhas receitas</p>
            <ul className="mt-2 divide-y divide-zinc-200">
              {savedRecipes.map((recipe) => (
                <li key={recipe.title} className="py-2.5">
                  <p className="truncate text-sm font-medium text-zinc-900">{recipe.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-600">
                    <Clock className="h-3 w-3" />
                    {recipe.time}
                  </p>
                </li>
              ))}
            </ul>
          </Feature>

          <Feature title="Lista de compras" text="Mande os ingredientes da receita para a lista e marque no mercado.">
            <p className="text-sm font-semibold text-zinc-900">Mercado da semana</p>
            <ul className="mt-2 divide-y divide-zinc-200">
              {shoppingItems.map((item) => (
                <li key={item.name} className="flex items-center gap-3 py-2.5 text-sm">
                  <span
                    className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border ${
                      item.checked ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300'
                    }`}
                  >
                    {item.checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className={item.checked ? 'text-zinc-500 line-through' : 'text-zinc-900'}>{item.name}</span>
                  <span className="ml-auto whitespace-nowrap text-xs text-zinc-600">{item.quantity}</span>
                </li>
              ))}
            </ul>
          </Feature>

          <Feature
            title="Planejamento da semana"
            text="Escolha o dia e a refeição, e a receita entra no seu cardápio."
            className="sm:col-span-2 lg:col-span-1"
          >
            <p className="text-sm font-semibold text-zinc-900">Esta semana</p>
            <div className="mt-3 grid grid-cols-[2.25rem_repeat(3,minmax(0,1fr))] gap-1.5 text-xs">
              <span />
              {mealSlots.map((slot) => (
                <span key={slot} className="pb-0.5 font-medium text-zinc-600">
                  {slot}
                </span>
              ))}
              {weekPlan.map(({ day, meals }) => (
                <div key={day} className="contents">
                  <span className="flex items-center font-semibold text-zinc-900">{day}</span>
                  {meals.map((meal, index) =>
                    meal ? (
                      <span
                        key={index}
                        className="flex h-10 items-center rounded-lg bg-zinc-100 px-2 font-medium leading-tight text-zinc-900"
                      >
                        <span className="line-clamp-2">{meal}</span>
                      </span>
                    ) : (
                      <span
                        key={index}
                        className="grid h-10 place-items-center rounded-lg border border-dashed border-zinc-300 text-zinc-400"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    ),
                  )}
                </div>
              ))}
            </div>
          </Feature>
        </ul>
      </div>
    </section>
  );
}
