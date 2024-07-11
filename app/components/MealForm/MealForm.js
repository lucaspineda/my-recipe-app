import React from "react";
import Image from "next/image";
import { forwardRef } from "react";
import Link from "next/link";
import Input from "../Input/Input";

export const MealForm = forwardRef(({}, ref) => {
  const mealOptions = [
    {
      text: "Almoço",
      value: "almoco",
    },
    {
      text: "Café da Manhã",
      value: "cafe",
    },
    {
      text: "Lanche",
      value: "lanche",
    },
    {
      text: "Janta",
      value: "janta",
    },
  ];

  return (
    <form className="w-full flex flex-col text-left" ref={ref}>
      <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl">
        1
      </div>
      <label className="secondary-header py-3">
        Adicione ingredientes que você possuí em casa
      </label>
      <Input
        id="Ingredients"
        placeholder="Digite Seus Ingredientes"
        imgSource="/images/fork-knife.svg"
        imgAlt="Icone de faca"
      />
      <div className="bg-tertiary px-6 py-2 rounded-full self-start text-2xl mt-10">
        2
      </div>
      <label className="secondary-header py-3">
        Selecione qual refeição irá preparar
      </label>
      <div className="relative">
        <select
          id="countries"
          className="global-input focus:ring-blue-500 focus:border-blue-500"
        >
          {mealOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.text}
            </option>
          ))}
        </select>
        <Image
          src="/images/arrow-down.svg"
          className="top-4 right-4 absolute h-4 w-auto"
          width={24}
          height={24}
          alt="Arow Down Icon"
        />
      </div>
      <Link
        href="/signup"
        className="bg-secondary w-full my-20 py-4 text-white rounded-2xl
                border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold text-center no-underline"
      >
        Gerar Receita
      </Link>
    </form>
  );
});

MealForm.displayName = "MealForm";

export default MealForm;
