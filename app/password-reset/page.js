import React from "react";
import Link from "next/link";

export default function PasswordReset() {
  return (
    <main className="flex flex-col text-center h-screen justify-center">
      <div>
        <h1 className="text-2xl">Bem-Vindo ao Chefinho IA</h1>
        <h2 className="my-6">Digite seu e-mail para receber um link para reset de senha</h2>
        <form className="flex flex-col">
          <input
            className="global-input"
            id="login"
            type="string"
            placeholder="Digite seu e-mail"
          />
          <button
            className="bg-secondary w-full mt-6 py-4 text-white rounded-2xl
          border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold"
          >
            Resetar Senha
          </button>
        </form>
        <span className="text-xs mt-4 text-center block">
          Resetou a senha?&nbsp;
          <Link href="/login">Faça o Login</Link>
        </span>
      </div>
    </main>
  );
}
