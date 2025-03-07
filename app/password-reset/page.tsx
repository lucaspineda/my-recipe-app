
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../components/Input/Input";
import Button from "../components/Button/Button";
import { useUserAuth } from "../hooks/userAuth";

const schema = z.object({
  email: z.string().email("Email é obrigatório"),
});
export default function PasswordReset() {
  const [emailSent, setEmailSent] = useState<boolean>(false)

  const {
    sendPasswordRecoverEmail,
    loading,
    error: passwordRecoverError,
  } = useUserAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const resetPassword = async (data) => {
    const passwordSent = await sendPasswordRecoverEmail(data.email)
    if(passwordSent) setEmailSent(true)
  };

  return (
    <main className="flex flex-col text-center h-screen justify-center w-full max-w-[420px] justify-self-center">
      <div>
        <h1 className="text-2xl">Bem-Vindo ao Chefinho IA</h1>
        <h2 className="my-6">
          Digite seu e-mail para receber um link para recuperar sua senha
        </h2>
        <form
          onSubmit={handleSubmit(resetPassword)}
          className="flex flex-col gap-2 text-start"
        >
          <Input
            {...register("email")}
            className="global-input"
            id="login"
            type="string"
            placeholder="Digite seu e-mail"
          />
          {errors?.email?.message && (
            <span className="text-red-700 text-sm m-2">
              {errors?.email?.message.toString()}
            </span>
          )}
          {passwordRecoverError && (
            <span className="text-red-700 text-sm m-2">{passwordRecoverError}</span>
          )}
          {emailSent && (
            <span className="text-sm m-2">Email enviado, <Link href="/login">voltar para o Login</Link></span>
          )}
          <Button loading={loading} text="Recuperar senha" />
        </form>
        <span className="text-xs mt-4 text-center block">
          Resetou a senha?&nbsp;
          <Link href="/login">Faça o Login</Link>
        </span>
      </div>
    </main>
  );
}
