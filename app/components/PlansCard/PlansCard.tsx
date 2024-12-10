import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { auth, db } from "../../hooks/userAuth";
import Button from "../Button/Button";
import { Plan } from "../../types";
import { useUserStore } from "../../store/user";

interface PlansCardProps {
  plan: Plan;
}

export default function PlansCard({
  plan,
}: PlansCardProps) {
  const [loading, setLoading] = useState(false);
  const { setUserPlanId } = useUserStore()

  const handlePlanSelecting = async () => {
    setLoading(true);
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      plan: {
        planId: plan.id,
        updatedAt: serverTimestamp(),
        cost: plan.cost,
      },
    });
    setUserPlanId(plan.id);
    setLoading(false);
  };
  return (
    <>
      <div className="flex flex-col bg-white rounded-md py-4 px-8">
        <div className="flex content-center mb-2 justify-between">
          <h3 className="">{plan.name}</h3>
          {plan.recommended && (
            <span
              className="bg-white border-secondary border text-secondary px-1 w-min rounded-md
              self-center text-sm"
            >
              Recomendado
            </span>
          )}
        </div>
        <div>
          <span className="text-2xl font-semibold">
            R$ {plan?.cost?.toString().replace(".", ",")}
          </span>
          <span>/ Mês</span>
        </div>
        <p className="mb-6 mt-2">{plan.description}</p>
        {plan.active ? (
          <Button
            text="Atual"
            loading={loading}
            className="bg-secondary py-2 px-4 w-min text-white rounded-md
        border-none shadow-lg self-center"
          />
        ) : (
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
