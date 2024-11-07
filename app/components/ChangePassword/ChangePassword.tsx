"use client";

import React, { useState, MouseEventHandler } from "react";
import Button from "../Button/Button";
import Input from "../Input/Input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuth, updatePassword } from "firebase/auth";

interface ChangePasswordProps {
  toggleChangePassword: () => void;
}

const ChangePassword = ({ toggleChangePassword }: ChangePasswordProps) => {
  const [password, setPassword] = useState<string>("");
  const [confirmationPassword, setConfirmationPassword] = useState<string>("");
  const schema = z.object({
    password: z.string().min(6, "No mínimo 6 caracteres"),
    confirmPassword: z
      .string()
      .min(6, "No mínimo 6 caracteres")
      .refine(
        (val) => {
          return val === password;
        },
        { message: "As senhas devem ser iguais" }
      ),
  });

  const auth = getAuth();
  const user = auth.currentUser;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const saveNewPassword = () => {
    updatePassword(user, password)
      .then(() => {
        console.log("senha atualizada com sucesso");
        alert("senha atualizada com sucesso");
        toggleChangePassword()

      })
      .catch((error) => {
        console.log("ocorreu um erro ao atualizar senha");
      });
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };
  const handleConfirmPasswordChange = (e) => {
    setConfirmationPassword(e.target.value);
  };

  const handleCancelClick = () => {
    toggleChangePassword()
  }

  return (
    <div className="w-full pt-4">
      <form onSubmit={handleSubmit(saveNewPassword)}>
        <div className="flex flex-col">
          <div className="flex justify-between mb-2">
            <label htmlFor="password">Nova senha</label>
            <button
              onClick={handleCancelClick}
              className="text-secondary font-semibold"
            >
              Cancelar
            </button>
          </div>
          <Input
            {...register("password")}
            className=""
            id="password"
            placeholder="********"
            type="password"
            value={password}
            onChange={handlePasswordChange}
          />
          {errors?.password?.message && (
            <span className="text-red-700 text-sm m-2">
              {errors?.password?.message.toString()}
            </span>
          )}

          <label className="mb-2 mt-4" htmlFor="password-confirmation">
            Confirme sua senha
          </label>
          <Input
            {...register("confirmPassword")}
            className=""
            id="password-confirmation"
            placeholder="********"
            type="password"
            value={confirmationPassword}
            onChange={handleConfirmPasswordChange}
          />
          {errors?.confirmPassword?.message && (
            <span className="text-red-700 text-sm m-2">
              {errors?.confirmPassword?.message.toString()}
            </span>
          )}
          <Button text="Salvar" className="mt-4"></Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
