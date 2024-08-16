import React from "react";
import Link from "next/link";
import "../components/Input/Input.css"

export default function login() {
  return (
    <main className="flex flex-col text-center h-screen justify-center">
      <div>
        <h1 className="text-2xl">Bem-Vindo ao Chefinho IA</h1>
        <h2 className="my-6">Faça seu login</h2>
        <form className="flex flex-col">
          <input
            className="global-input"
            id="login"
            type="string"
            placeholder="Digite seu e-mail"
          />
          <input
            className="global-input mt-2"
            id="password"
            type="password"
            placeholder="Digite sua senha"
          />
          <span className="text-xs mt-2 text-left">
            <Link href="/password-reset">Esqueceu a senha?</Link>
          </span>
          <button
            className="bg-secondary w-full mt-6 py-4 text-white rounded-2xl
          border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold"
          >
            Login
          </button>
        </form>
        <span className="text-xs mt-4 text-left">
          Não tem conta ainda?&nbsp;
          <Link href="/signup">Faça seu cadastro</Link>
        </span>
      </div>
    </main>
  );
}
