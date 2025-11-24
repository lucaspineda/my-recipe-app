import { ChefHat, Clock, Users, Sparkles } from 'lucide-react';

const stats = [
  {
    icon: ChefHat,
    number: "50.000+",
    label: "Receitas Criadas",
    description: "Receitas únicas geradas pela IA"
  },
  {
    icon: Users,
    number: "15.000+",
    label: "Usuários Ativos",
    description: "Cozinheiros usando diariamente"
  },
  {
    icon: Clock,
    number: "5 segs",
    label: "Tempo Médio",
    description: "Para gerar uma receita completa"
  },
  {
    icon: Sparkles,
    number: "98%",
    label: "Satisfação",
    description: "Dos usuários recomendam"
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