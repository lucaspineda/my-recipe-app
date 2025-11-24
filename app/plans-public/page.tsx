'use client';
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../hooks/userAuth';
import { Plan } from '../types';
import { useRouter } from 'next/navigation';
import PlanCard from '../components/PlanCard/PlanCard';

export default function PublicPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getPlans = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'plans'));
      const localPlans: Plan[] = [];
      querySnapshot.forEach((doc) => {
        localPlans.push(doc.data() as Plan);
      });
      localPlans.sort((a, b) => (a.id > b.id ? 1 : b.id > a.id ? -1 : 0));
      console.log('Loaded plans:', localPlans);
      setPlans(localPlans);
    } catch (e) {
      console.error('Error getting plans:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPlans();
  }, []);

  const handleSelectPlan = () => {
    router.push('/signup');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Carregando planos...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen py-16">
      <main className="container flex flex-col px-4">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-secondary bg-clip-text text-transparent">
            Escolha Seu Plano Ideal
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Crie receitas personalizadas com IA e transforme seus ingredientes em refeições incríveis
          </p>
          <p className="text-sm text-gray-500">Cancele quando quiser • Sem taxas ocultas</p>
        </div>

        {/* Plans Grid */}
        <section className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onSelectPlan={handleSelectPlan} />
          ))}
        </section>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center max-w-2xl mx-auto">
          <p className="text-gray-600 mb-4">
            ✨ Todos os planos incluem acesso completo à plataforma e atualizações gratuitas
          </p>
          <p className="text-sm text-gray-500">
            Tem dúvidas?{' '}
            <a
              href="https://wa.me/5511976783992"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary underline hover:text-secondary/80 transition-colors"
            >
              Entre em contato conosco
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
