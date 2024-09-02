"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const auth = getAuth();

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        router.push("/recipe");
      }
    });
  }, [auth, router]);

  const signUpWithEmail = (e) => {
    e.preventDefault();
    console.log(email, password)
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => console.log('User created'))
      .catch((error) => {
        console.log("An error occurred");
      });
  };

  return (
    <main className="flex flex-col text-center h-screen justify-center">
      <div className="flex flex-col">
        <h1 className="text-2xl">Bem-Vindo ao Chefinho IA</h1>
        <h2 className="my-6">Crie sua conta</h2>
        <form className="flex flex-col">
          <input
            className="global-input"
            id="login"
            type="string"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="global-input mt-2"
            id="password"
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="bg-secondary w-full mt-12 py-4 text-white rounded-2xl
					border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold"
            onClick={signUpWithEmail}
          >
            Cadastrar
          </button>
        </form>
        <span className="text-xs mt-4">
          Clicando no botão, você concorda com nossos Termos de Serviço e
          Política de Privacidade
        </span>
        <span className="mt-6">
          Já tem uma conta? <Link href="/login">Login</Link>
        </span>
      </div>
    </main>
  );
}
