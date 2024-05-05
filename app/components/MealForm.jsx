import React from 'react'
import Image from "next/image";

export default function MealForm() {
    const mealOptions = [
        {
            text: "Café da Manhã",
            value: "cafe"
        },
        {
            text: "Almoço",
            value: "almoco"
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
        <form className="mt-12 w-full flex flex-col">
            <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl">1</div>
            <label className="secondary-header py-3">Adicione ingredientes que você possuí em casa</label>
            <div class="relative">
                <input className="w-full global-input"
                    id="ingredientes" type="string" placeholder="Digite Seus Ingredientes" />
                <div class="icon-div-for-input">
                    <Image src="/fork-knife.svg" width={24} height={24} alt="Fork Icon" />
                </div>
            </div>
            <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl mt-10">2</div>
            <label className="secondary-header py-3">Selecione qual refeição irá prepararr</label>
            <div class="relative">
                <select id="countries" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-4">
                    {mealOptions.map((option) => (
                        <option value={option.value}>{option.text}</option>
                    ))}
                </select>
            </div>
        </form>
    )
}
