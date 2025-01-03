import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { auth, db } from "../../hooks/userAuth";
import Button from "../Button/Button";
import { Plan, User } from "../../types";
import { useUserStore } from "../../store/user";

interface PlansCardProps {
  plan: Plan;
}

export default function PlansCard({ plan }: PlansCardProps) {
  const [loading, setLoading] = useState(false);
  const { setUser, user } = useUserStore();

  const handlePlanSelecting = async () => {
    setLoading(true);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      plan: {
        planId: plan.id,
        startedAt: serverTimestamp(),
        expiresAt: expiresAt,
        cost: plan.cost,
        name: plan.name,
        recipesCount: plan.recipeCount ?? null,
      },
    });
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const userReturn = userDoc.data();
    setUser(userReturn as User);
    setLoading(false);
  };
  return (
    <>
      <div className="flex flex-col bg-white rounded-md py-4 px-8">
        <div className="flex content-center mb-2 justify-between">
          <h3 className="">{plan.name}</h3>
          {plan.recommended && !plan.active && user.plan.planId !== 3 && (
            <span
              className="bg-white border-secondary border text-secondary px-1 w-min rounded-md
              self-center text-sm"
            >
              Recomendado
            </span>
          )}
          {plan.active && (
            <span
              className="bg-white border-secondary border text-secondary px-1 w-min rounded-md
              self-center text-sm"
            >
              Atual
            </span>
          )}
        </div>
        <div>
          <span className="text-2xl font-semibold">
            R$ {plan?.cost?.toString().replace(".", ",")}
          </span>
          <span>/ Mês</span>
        </div>
        <p className="mb-6 mt-2 font-normal">{plan.description}</p>
        {!plan.active && (
          <Button
            text="Escolher"
            loading={loading}
            className="bg-secondary py-2 px-4 w-min text-white rounded-md
        border-none shadow-lg self-center"
            onClick={handlePlanSelecting}
          />
        )}
      </div>
    </>
  );
}
