import styles from '../Landing/Landing.module.css';

const steps = [
  {
    title: 'Liste o que tem em casa',
    description: 'Digite os ingredientes da geladeira e da despensa. Sobrou arroz de ontem? Também vale.',
  },
  {
    title: 'Ajuste do seu jeito',
    description:
      'Escolha a refeição, quanto tempo você tem e seu nível na cozinha. No modo criativo, o Chefinho pode sugerir um ingrediente a mais. Em “Só o que eu tenho”, ele usa apenas o que você listou.',
  },
  {
    title: 'Cozinhe e guarde',
    description:
      'A receita chega com ingredientes e modo de preparo e fica salva em Minhas receitas. Dali, você manda os ingredientes para a lista de compras ou coloca o prato no planejamento da semana.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="grid gap-10 py-20 md:grid-cols-12 md:py-24">
      <h2 className={`${styles.display} text-4xl text-secondary md:col-span-4 md:text-5xl`}>Como funciona</h2>
      <ol className="space-y-12 md:col-span-8">
        {steps.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[auto_1fr] gap-x-5">
            <span className="self-start rounded-full bg-tertiary px-4 py-1 text-xl text-[#24343a]" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <h3 className="text-xl font-semibold text-[#24343a]">{step.title}</h3>
              <p className="mt-2 max-w-[38rem] text-lg leading-relaxed text-[#4a5a5f]">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
