import { Edit3, Sparkles, Heart } from 'lucide-react';

const steps = [
  {
    icon: Edit3,
    number: "1",
    title: "Liste seus ingredientes",
    description: "Digite os ingredientes que você tem em casa ou uma ideia de receita que sempre quis experimentar.",
    details: [
      "Adicione ingredientes que você já possui",
      "Perfeito para aproveitar sobras!",
      "Inclua suas preferências: vegetariano, vegano, sem glúten, etc."
    ]
  },
  {
    icon: Sparkles,
    number: "2", 
    title: "IA gera sua receita",
    description: "Nossa inteligência artificial cria uma receita personalizada para você em poucos segundos.",
    details: [
      "Processo rápido e inteligente",
      "Receita baseada nos seus ingredientes",
      "Instruções claras e detalhadas"
    ]
  },
  {
    icon: Heart,
    number: "3",
    title: "Cozinhe e aproveite!",
    description: "Agora é só seguir a receita e desfrutar de uma refeição deliciosa feita especialmente para você.",
    details: [
      "Receita salva automaticamente",
      "Fácil de compartilhar com amigos",
      "Sempre disponível quando precisar"
    ]
  }
];

export default function HowItWorksSection() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-16 mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Como é que funciona?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          O Chefinho IA utiliza inteligência artificial para gerar receitas personalizadas com base nos seus ingredientes e preferências.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative z-10">
              <div className="bg-tertiary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 mx-auto">
                {step.number}
              </div>

              <div className="bg-secondary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <step.icon className="w-8 h-8 text-secondary" />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                {step.title}
              </h3>

              <p className="text-gray-600 text-center mb-6 leading-relaxed">
                {step.description}
              </p>

              <ul className="space-y-2">
                {step.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-start text-sm text-gray-600">
                    <div className="w-2 h-2 bg-tertiary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <div className="bg-gradient-to-r from-secondary to-tertiary p-8 rounded-2xl text-white">
          <h3 className="text-2xl font-bold mb-4">
            Pronto para começar?
          </h3>
          <p className="text-lg opacity-90 mb-6">
            Junte-se a mais de 15.000 brasileiros que já descobriram o prazer de cozinhar com IA!
          </p>
          <button 
            onClick={() => document.querySelector('[data-meal-form]')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-secondary px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
          >
            Criar Minha Primeira Receita
          </button>
        </div>
      </div>
    </section>
  );
}