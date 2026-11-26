import { ChefHat, Users, Star, Gift } from 'lucide-react';

// Real figures, written as lower bounds so they stay true as they grow.
// Checked in BigQuery on 2026-11-26: 7,282 recipes, 5,031 accounts,
// average survey rating 4.34 from 137 ratings.
const stats = [
  {
    icon: ChefHat,
    number: "7.000+",
    label: "Receitas Criadas",
    description: "Receitas geradas pela IA do Chefinho"
  },
  {
    icon: Users,
    number: "5.000+",
    label: "Contas Criadas",
    description: "Pessoas que já criaram conta"
  },
  {
    icon: Star,
    number: "4,3/5",
    label: "Nota Média",
    description: "Em mais de 130 avaliações de usuários"
  },
  {
    icon: Gift,
    number: "3 grátis",
    label: "Receitas Grátis",
    description: "Ao criar sua conta"
  }
];

export default function StatsSection() {
  return (
    <section className="w-full max-w-6xl mx-auto py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow h-[260px] flex flex-col justify-between">
              <div className="flex justify-center mb-2">
                <div className="bg-secondary/10 p-3 rounded-full">
                  <stat.icon className="w-8 h-8 text-secondary" />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm font-semibold text-gray-700 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500">
                  {stat.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}