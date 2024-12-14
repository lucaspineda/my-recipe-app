"use client";
import React, { useEffect, useState } from "react";
import PlansCard from "../components/PlansCard/PlansCard";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../hooks/userAuth";
import { Plan } from "../types";
import { useUserStore } from "../store/user";

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const { user } = useUserStore()

  const getPlans = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "plans"));
      const localPlans: Plan[] = [];
      querySnapshot.forEach((doc) => {
        localPlans.push(doc.data() as Plan);
      });
      localPlans.sort((a, b) => (a.id > b.id ? 1 : b.id > a.id ? -1 : 0));
      checkUsersActivePlan(localPlans);
      setPlans(localPlans);
    } catch (e) {
      console.log("Error getting plans:", e);
    }
  };

  const checkUsersActivePlan = (localPlans: Plan[]) => {
    localPlans.forEach(plan => {
      if(plan.id === user.plan.planId) {
        plan.active = true
      }
    });
  };

  useEffect(() => {
    getPlans();
  }, [user]);
  return (
    <main className="flex flex-col">
      <div className="flex flex-col items-center mt-8 text-center">
        <h1>Planos</h1>
        <p>Crie receitas com o plano certo para você</p>
      </div>
      <section className="flex flex-col gap-8 mt-4">
        {plans.map((plan) => (
          <PlansCard
            key={plan.id}
            plan={plan}
          />
        ))}
      </section>
    </main>
  );
}
