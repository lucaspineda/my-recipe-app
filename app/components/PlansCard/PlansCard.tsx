import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { auth, db } from "../../hooks/userAuth";

export default function PlansCard({ plan }) {
  const [loading, setLoading] = useState(false)
  const handlePlanSelecting = async () => {
    setLoading(true)
    // await updateDoc(doc(db, "users", auth.currentUser.uid), {
    //   plan: {

    //   }
    // });
    
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
          <span className="text-2xl font-semibold">R$ {plan?.cost?.toString().replace('.', ',')}</span>
          <span>/ Mês</span>
        </div>
        <p className="mb-6 mt-2">{plan.description}</p>
        <button
          className="bg-secondary py-2 px-4 w-min text-white rounded-md
					border-none shadow-lg self-center"
          onClick={handlePlanSelecting}
        >
          Escolher
        </button>
      </div>
    </>
  );
}
