"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  email: z.string().email("Email is required"),
  password: z.string().min(6),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();
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

  const handleSignInWithEmail = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        router.push("/recipe");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });
  };
  return (
    <main className="flex flex-col text-center h-screen justify-center">
      <div>
        <h1 className="text-2xl">Bem-Vindo ao Chefinho IA</h1>
        <h2 className="my-6">Faça seu login</h2>
        <form className="flex flex-col">
          <input
            {...register("name")}
            className="global-input"
            id="login"
            type="string"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            {...register("password")}
            className="global-input mt-2"
            id="password"
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="text-xs mt-2 text-left">
            <Link href="/password-reset">Esqueceu a senha?</Link>
          </span>
          <button
            className="bg-secondary w-full mt-6 py-4 text-white rounded-2xl
          border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold"
            onClick={handleSubmit(e => handleSignInWithEmail())}
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
