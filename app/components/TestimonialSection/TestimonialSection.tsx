import styles from '../Landing/Landing.module.css';

interface Testimonial {
  name: string;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Maria Silva',
    text: 'A IA sem falhas ajuda a criar ideias de receitas e me dá assistência - é um divisor de águas para todos os que gostam de cozinhar!',
  },
  {
    name: 'João Santos',
    text: 'Nunca mais fico sem saber o que cozinhar! O Chefinho IA sempre me surpreende com receitas deliciosas usando ingredientes que já tenho em casa.',
  },
  {
    name: 'Ana Costa',
    text: 'Economizei muito tempo e dinheiro desde que comecei a usar. As receitas são práticas e sempre dão certo!',
  },
  {
    name: 'Carlos Oliveira',
    text: 'Como chef profissional, fico impressionado com a qualidade das sugestões. Uma ferramenta incrível para inspiração culinária.',
  },
];

export default function TestimonialSection() {
  return (
    <section className="grid gap-10 py-20 md:grid-cols-12 md:py-24">
      <div className="md:col-span-4">
        <h2 className={`${styles.display} text-4xl text-secondary md:text-5xl`}>Quem já cozinhou com o Chefinho</h2>
        <p className="mt-4 text-lg leading-relaxed text-[#4a5a5f]">
          Mais de 15 mil pessoas já criaram mais de 50 mil receitas.
        </p>
      </div>
      <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 md:col-span-8">
        {testimonials.map((testimonial) => (
          <figure key={testimonial.name} className="border-l-4 border-tertiary pl-5">
            <blockquote className="text-lg leading-relaxed text-[#24343a]">“{testimonial.text}”</blockquote>
            <figcaption className="mt-3 font-medium text-secondary">{testimonial.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
