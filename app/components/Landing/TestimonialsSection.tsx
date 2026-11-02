const testimonials = [
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

export default function TestimonialsSection() {
  return (
    <section className="border-t border-zinc-200 px-4 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-[18ch] text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-zinc-900 md:text-5xl">
          Quem já cozinha com o Chefinho IA
        </h2>
        <ul className="mt-12 grid divide-y divide-zinc-200 md:mt-16 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {testimonials.map((testimonial) => (
            <li key={testimonial.name} className="py-8 first:pt-0 last:pb-0 lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0">
              <figure>
                <blockquote className="max-w-[60ch] text-lg leading-relaxed text-zinc-900 md:text-[19px]">
                  “{testimonial.text}”
                </blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-zinc-600">{testimonial.name}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
