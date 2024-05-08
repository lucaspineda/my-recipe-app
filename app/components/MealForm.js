import React from 'react'
import Image from "next/image";

export default function MealForm() {
    const mealOptions = [
        {
            text: "Almoço",
            value: "almoco"
        },
        {
            text: "Café da Manhã",
            value: "cafe"
        },
        {
            text: "Lanche",
            value: "lanche"
        },
        {
            text: "Janta",
            value: "janta"
        },
    ]
    return (
        <form className="mt-24 w-full flex flex-col">
            <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl">1</div>
            <label className="secondary-header py-3">Adicione ingredientes que você possuí em casa</label>
            <div class="relative">
                <input className="global-input"
                    id="ingredientes" type="string" placeholder="Digite Seus Ingredientes" />
                <div class="icon-div-for-input">
                    <Image src="/fork-knife.svg" width={24} height={24} alt="Fork Icon" />
                </div>
            </div>
            <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl mt-10">2</div>
            <label className="secondary-header py-3">Selecione qual refeição irá preparar</label>
            <div class="relative">
                <select id="countries" class="global-input focus:ring-blue-500 focus:border-blue-500">
                    {mealOptions.map((option) => (
                        <option value={option.value}>{option.text}</option>
                    ))}
                </select>
            </div>
            <button className="bg-secondary w-full mt-24 py-4 text-white rounded-2xl
                border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold mb-4">
                    Gerar Receita
            </button>
        </form>
    )
}
