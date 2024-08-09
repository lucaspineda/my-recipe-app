import React from "react";
import PlansCard from "../components/PlansCard/PlansCard"

const plans = [
  {
    id: 1,
    name: 'Grátis',
    price: '0',
    description: '2 Receitas grátis por mês',
    active: true,
    recommended: false
  },
  {
    id: 2,
    name: 'Premium',
    price: '9,99',
    description: '40 Receitas todo mês',
    active: false,
    recommended: true
  },
  {
    id: 3,
    name: 'Premius Plus',
    price: '49,99',
    description: 'Receitas ilimitadas para você criar',
    active: false,
    recommended: false
  }
]

export default function Plans() {
  return (
    <main className="flex flex-col">
      <div className="flex flex-col items-center mt-8 text-center">
        <h1>Planos</h1>
        <p>Crie receitas com o plano certo para você</p>
      </div>
      <section className="flex flex-col gap-8 mt-4">
        {plans.map((plan) => (
          <PlansCard key={plan.id} plan={plan}/>
        ))}
      </section>
    </main>
  );
}
