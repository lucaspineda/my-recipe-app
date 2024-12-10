'use client'
import React, { useEffect, useState } from "react";
import PlansCard from "../components/PlansCard/PlansCard"
import { getDoc, doc, collection, getDocs } from "firebase/firestore";
import { db } from "../hooks/userAuth";

export default function Plans() {
  const [plans, setPlans] = useState([])
  
  const getPlans = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "plans"));
      const localPlans = []
      console.log("Cached document data:", plans);
      // setPlans(plans)
      querySnapshot.forEach((doc) => {
        localPlans.push(doc.data())
      });
      localPlans.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0))
      setPlans(localPlans)
    } catch (e) {
      console.log("Error getting cached document:", e);
    }
  }
  
  
  
  useEffect(() => {
    getPlans()
  }, [])
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
