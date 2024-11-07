"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUserAuth } from "../hooks/userAuth";

const schema = z.object({
  email: z.string().email("Email é obrigatório"),
  password: z.string("Senha é obrigatório").min(1, "Senha é obrigatório")
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState();

  const router = useRouter();
  const {signInWithEmail, error} = useUserAuth()
  const auth = getAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        router.push("/recipe");
      }
    });
  }, [auth, router]);

  useEffect(() => {
    console.log(errors)
  }, [errors]);
  

  const handleSignInWithEmail = () => {
    signInWithEmail(email, password)
  };

  const handleKeyDown = (e) => {
    if(e.key === "enter") {
      handleSubmit(handleSignInWithEmail)
    }
  }

  return (
    <main className="flex flex-col text-center h-screen justify-center">
      <div>
        <h1 className="text-2xl">Bem-Vindo ao Chefinho IA</h1>
        <h2 className="my-6">Faça seu login</h2>
        <form onSubmit={handleSubmit(handleSignInWithEmail)} className="flex flex-col justify-start items-start">
          <input
            {...register("email")}
            className="global-input"
            id="login"
            type="string"
            placeholder="Digite seu e-mail"
            value={email}
            onKeyDown={handleKeyDown}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors?.email?.message && <span className="text-red-700 text-sm m-2">{errors?.email?.message}</span>}
          <input
            {...register("password")}
            className="global-input mt-2"
            id="password"
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onKeyDown={handleKeyDown}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors?.password?.message && <span className="text-red-700 text-sm m-2">{errors?.password?.message}</span>}
          {signInError && <span className="text-red-700 text-sm m-2">{signInError}</span>}
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
