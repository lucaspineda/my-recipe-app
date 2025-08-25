import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  text: string;
  year: number;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "Maria Silva",
    text: "A IA sem falhas ajuda a criar ideias de receitas e me dá assistência - é um divisor de águas para todos os que gostam de cozinhar!",
    year: 2024,
    rating: 5
  },
  {
    name: "João Santos",
    text: "Nunca mais fico sem saber o que cozinhar! O Chefinho IA sempre me surpreende com receitas deliciosas usando ingredientes que já tenho em casa.",
    year: 2024,
    rating: 5
  },
  {
    name: "Ana Costa",
    text: "Economizei muito tempo e dinheiro desde que comecei a usar. As receitas são práticas e sempre dão certo!",
    year: 2024,
    rating: 5
  },
  {
    name: "Carlos Oliveira",
    text: "Como chef profissional, fico impressionado com a qualidade das sugestões. Uma ferramenta incrível para inspiração culinária.",
    year: 2024,
    rating: 5
  }
];

const avatarColors = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500'
];

export default function TestimonialSection() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-16 bg-white rounded-2xl shadow-lg mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          O que nossos usuários dizem
        </h2>
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-lg font-semibold text-gray-700">4.9/5</span>
        </div>
        <p className="text-lg text-gray-600">
          Adorado por <span className="font-bold text-secondary">mais de 15.000</span> cozinheiros brasileiros
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white font-bold text-lg`}>
                {testimonial.name.charAt(0)}
              </div>
              <div className="ml-4">
                <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                <div className="flex items-center gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">({testimonial.year})</span>
                </div>
              </div>
            </div>
            <p className="text-gray-700 italic leading-relaxed">
              &quot;{testimonial.text}&quot;
            </p>
          </div>
        ))}
      </div>

      {/* Avatares dos usuários */}
      <div className="flex justify-center items-center mt-12 gap-4">
        <div className="flex -space-x-2">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={`w-10 h-10 rounded-full border-2 border-white ${avatarColors[i]} flex items-center justify-center text-white font-bold text-sm`}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-600 ml-4">
          <span className="font-semibold">+15.000</span> usuários satisfeitos
        </div>
      </div>
    </section>
  );
}