import { Brain, Utensils, Clock, Heart } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: "IA Avançada",
    description: "Nossa inteligência artificial analisa seus ingredientes e cria receitas personalizadas em segundos"
  },
  {
    icon: Utensils,
    title: "Receitas Personalizadas",
    description: "Cada receita é única e adaptada aos ingredientes que você tem disponível em casa"
  },
  {
    icon: Clock,
    title: "Rápido e Prático",
    description: "Gere receitas completas em menos de 10 segundos, com instruções claras e detalhadas"
  },
  {
    icon: Heart,
    title: "Feito com Amor",
    description: "Desenvolvido por brasileiros para brasileiros, com foco na nossa culinária e ingredientes locais"
  }
];

export default function FeaturesSection() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-16 mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Por que escolher o Chefinho IA?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Transforme sua experiência culinária com tecnologia de ponta e simplicidade brasileira
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-secondary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <feature.icon className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-center leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}