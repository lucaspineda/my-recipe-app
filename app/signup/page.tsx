"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserAuth } from "../hooks/userAuth";
import Button from "../components/Button/Button";

export default function Signup() {
  const router = useRouter();

  const schema = z.object({
    email: z.string().email("Email não é válido"),
    password: z.string({ required_error: "Senha é obrigatório" }).min(1, "Senha é obrigatório"),
  });

  const { signUpWithEmail, loading, error: signUpError } = useUserAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const handleSignUpWithEmail = async (data) => {
    console.log(data);
    await signUpWithEmail(data.email, data.password, router);
  };

  return (
    <main className="flex flex-col text-center h-screen justify-center w-full max-w-[420px] justify-self-center">
      <div className="flex flex-col">
        <h1 className="text-2xl">Bem-Vindo ao Chefinho IA</h1>
        <h2 className="my-6">Crie sua conta</h2>
        <form
          onSubmit={handleSubmit(handleSignUpWithEmail)}
          className="flex flex-col text-left"
        >
          <input
            {...register("email")}
            className="global-input"
            id="login"
            type="string"
            placeholder="Digite seu e-mail"
          />
          {errors?.email?.message && (
            <span className="text-red-700 text-sm m-2">
              {typeof errors?.email?.message === "string" && errors?.email?.message}
            </span>
          )}
          <input
            {...register("password")}
            className="global-input mt-2"
            id="password"
            type="password"
            placeholder="Digite sua senha"
          />
          {errors?.password?.message && (
            <span className="text-red-700 text-sm m-2">
              {typeof errors?.password?.message === "string" && errors?.password?.message}
            </span>
          )}
          {signUpError && (
            <span className="text-red-700 text-sm m-2">{signUpError}</span>
          )}
          <Button className="mt-8" text="Cadastrar" loading={loading}></Button>
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
