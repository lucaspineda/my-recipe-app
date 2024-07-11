"use client";

import MealForm from "../components/MealForm/MealForm";
import { useRef } from 'react'
// import PeopleCookingImg from "./../public/people-cooking.svg"

export default function Home() {
  const targetRef = useRef(null);
  return (
    <div className="bg-primary flex items-center flex-col">
      <main className="flex items-center flex-col text-center w-full">
        <MealForm ref={targetRef} />
      </main>
    </div>
  );
}
