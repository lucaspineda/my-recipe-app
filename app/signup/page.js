import React from "react";
import Link from "next/link";

export default function page() {
  return (
    <main className="px-5 flex flex-col text-center mt-8">
      <h1 className="text-2xl">Bem-Vindo ao Chefinho IA</h1>
      <h2 className="my-6">Crie sua conta</h2>
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
        <button
          className="bg-secondary w-full mt-12 py-4 text-white rounded-2xl
					border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold"
        >
          Cadastrar
        </button>
      </form>
      <span className="text-xs mt-4">
        Clicando no botão, você concorda com nossos Termos de Serviço e Política
        de Privacidade
      </span>
      <span className="mt-6">
        Já tem uma conta? <Link href="/login">Login</Link>
      </span>
    </main>
  );
}
