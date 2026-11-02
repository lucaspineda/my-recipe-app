import { BookmarkCheck, ChefHat, Clock, Coffee, Sparkles } from 'lucide-react';

const exampleIngredients = ['ovos', 'tomate', 'queijo minas', 'cebola'];

const exampleRecipe = {
  title: 'Omelete de tomate com queijo minas',
  intro: 'Um café da manhã rápido, com o queijo derretendo por dentro e tomate fresquinho.',
  ingredients: [
    { name: 'Ovos', quantity: '3 unidades' },
    { name: 'Tomate sem sementes', quantity: '1 pequeno' },
    { name: 'Queijo minas em cubos', quantity: '60 g' },
    { name: 'Cebola picada', quantity: '½ unidade' },
  ],
  steps: [
    'Bata os ovos com uma pitada de sal e pimenta-do-reino.',
    'Refogue a cebola e o tomate em fio de azeite por 3 minutos.',
    'Despeje os ovos, espalhe o queijo e tampe a frigideira em fogo baixo por 4 minutos.',
    'Dobre ao meio e sirva em seguida.',
  ],
};

interface LandingHeroProps {
  onStart: () => void;
}

export default function LandingHero({ onStart }: LandingHeroProps) {
  return (
    <section className="px-4 pt-10 text-center sm:px-8 md:pt-20">
      <h1 className="mx-auto max-w-[1000px] text-balance text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.03em] text-zinc-900 sm:text-6xl lg:text-[5rem] lg:leading-none lg:tracking-[-0.035em]">
        Seus ingredientes viram receitas completas
      </h1>
      <p className="mx-auto mt-5 max-w-[52ch] text-balance text-[17px] leading-relaxed text-zinc-600 md:mt-6 md:text-[19px]">
        Diga o que tem em casa e escolha a refeição, o tempo e o seu nível na cozinha. O Chefinho IA cria a receita
        com quantidades e modo de preparo, e guarda para você.
      </p>

      {/* Looks like the ingredient field; any click takes you to the real form below */}
      <div
        onClick={onStart}
        className="mx-auto mt-8 flex max-w-[760px] cursor-text flex-col gap-3 rounded-[22px] border border-zinc-200 bg-white p-3 text-left shadow-lift sm:flex-row sm:items-center sm:pl-4 md:mt-11"
      >
        <div aria-hidden="true" className="flex flex-1 flex-wrap items-center gap-2">
          {exampleIngredients.map((name) => (
            <span key={name} className="rounded-[10px] bg-zinc-100 px-3 py-2 text-[15px] font-medium text-zinc-900">
              {name}
            </span>
          ))}
          <span className="flex items-center gap-1.5 px-1 py-2 text-[15px] text-zinc-500">
            <span className="h-[18px] w-[1.5px] bg-zinc-900" />
            Adicionar mais
          </span>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onStart();
          }}
          className="flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-basil px-6 text-base font-semibold text-white transition-colors hover:bg-basil-dark"
        >
          <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
          Começar
        </button>
      </div>

      <ul aria-hidden="true" className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-zinc-600">
        <li className="flex items-center gap-1.5">
          <Coffee className="h-4 w-4" />
          Café da manhã
        </li>
        <li className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          15 min
        </li>
        <li className="flex items-center gap-1.5">
          <ChefHat className="h-4 w-4" />
          Iniciante
        </li>
      </ul>
      <p className="mt-5 text-sm text-zinc-500">
        <strong className="font-semibold text-zinc-900">3 receitas grátis</strong> ao criar sua conta
      </p>

      {/* Example result, cropped by the section edge */}
      <div className="-mx-4 mt-14 h-[420px] overflow-hidden px-4 sm:mx-auto sm:max-w-[1048px] sm:px-6 md:mt-[72px]">
        <div
          role="img"
          aria-label={`Exemplo de receita criada a partir de ${exampleIngredients.join(', ')}: ${exampleRecipe.title}`}
          className="grid rounded-t-3xl border border-b-0 border-zinc-200 bg-white px-5 py-6 text-left shadow-lift motion-safe:animate-rise md:grid-cols-[1fr_1.1fr] md:gap-12 md:px-10 md:py-9"
        >
          <div>
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-basil">
              <BookmarkCheck className="h-[15px] w-[15px]" />
              Salva em Minhas receitas
            </p>
            <p className="mt-3 text-2xl font-semibold leading-[1.1] tracking-[-0.025em] text-zinc-900 md:text-[30px]">
              {exampleRecipe.title}
            </p>
            <p className="mt-2.5 text-[15px] leading-relaxed text-zinc-600">{exampleRecipe.intro}</p>
            <div className="mt-4 flex flex-wrap gap-1.5 text-[13px] text-zinc-600">
              <span className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1.5">
                <Clock className="h-3.5 w-3.5" />
                15 min
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1.5">
                <ChefHat className="h-3.5 w-3.5" />
                Iniciante
              </span>
              <span className="rounded-lg bg-zinc-100 px-2.5 py-1.5">1 porção</span>
            </div>
            <p className="mt-6 text-sm font-semibold text-zinc-900">Ingredientes</p>
            <ul className="mt-2.5 divide-y divide-zinc-200 text-[15px] text-zinc-900">
              {exampleRecipe.ingredients.map((item) => (
                <li key={item.name} className="flex justify-between gap-3 py-2.5">
                  {item.name}
                  <span className="whitespace-nowrap text-zinc-600">{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mt-6 text-sm font-semibold text-zinc-900 md:mt-0">Modo de preparo</p>
            <ol className="mt-2.5 divide-y divide-zinc-200 text-[15px] leading-relaxed text-zinc-600">
              {exampleRecipe.steps.map((step, index) => (
                <li key={step} className="flex gap-3.5 py-2.5">
                  <span className="w-5 shrink-0 font-semibold tabular-nums text-zinc-900">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
