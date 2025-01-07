"use client";
import React, { useEffect, useState } from "react";
import PlansCard from "../components/Card/PlansCard";
import { collection, doc, getDocs, Timestamp, updateDoc } from "firebase/firestore";
import { auth, db, useUserAuth } from "../hooks/userAuth";
import { Plan } from "../types";
import { useUserStore } from "../store/user";
import Card from "../components/Card/Card";
import Modal from "../components/Modal/Modal";
import Button from "../components/Button/Button";
import { formatDate } from "../utils/date";

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const { user } = useUserStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getUser } = useUserAuth();

  console.log(user, 'userr')

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
    localPlans.forEach((plan) => {
      if (plan.id === user.plan.planId) {
        plan.active = true;
      }
    });
  };

  const handlePlanCanceling = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        plan: {
          ...user.plan,
          toBeCanceled: true,
        },
      });
      await getUser();
    } catch (e) {
      console.log("Error canceling plan:", e);
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  }

  const formattedDate = formatDate(user?.plan.expiresAt as Timestamp)

  useEffect(() => {
    if (user) {
      getPlans();
    }
  }, [user]);

  if (!user) return null;
  return (
    <main className="flex flex-col">
      <div className="flex flex-col items-center mt-8 text-center">
        <h1>Planos</h1>
        <p>Crie receitas com o plano certo para você</p>
      </div>
      <section className="flex flex-col gap-8 mt-4">
        {plans.map((plan) => (
          <PlansCard key={plan.id} plan={plan} />
        ))}
        {user.plan.planId !== 1 && !user.plan.toBeCanceled && (
          <Card
            buttonColor="bg-red-600"
            buttonText="Cancelar"
            handleButtonClick={() => setModalOpen(true)}
          >
            <p className="font-medium mb-2">Cancelar plano</p>
            <p className="font-normal">
              Ao cancelar seu plano você entrará para o plano básico e perderá
              as funcionalidades dos planos pagos
            </p>
          </Card>
        )}
      </section>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <p className="font-medium">Confirmar Cancelamento de Plano</p>
        <p className="font-normal mt-2">
          Tem certeza que deseja cancelar seu plano? Você ainda terá acesso as
          funcionalidades do seu plano até dia {formattedDate}
        </p>
        <div className="flex gap-4 mt-4">
          <Button text="Cancelar Plano" color="bg-red-500" loading={loading} onClick={handlePlanCanceling} />
          <Button text="Voltar" onClick={() => setModalOpen(false)} />
        </div>
      </Modal>
    </main>
  );
}
