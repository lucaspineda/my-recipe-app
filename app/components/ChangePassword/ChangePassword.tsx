"use client";

import React, { useState } from "react";
import Button from "../Button/Button";
import Input from "../Input/Input";

interface ChangePasswordProps {}

const ChangePassword = () => {
  const [editPassword, setEditPassword] = useState<boolean>(false);
  const [password, setPassword] = useState<boolean>(false);
  const [confirmationPassword, setConfirmationPassword] =
    useState<boolean>(false);
  return (
    <div className="w-full pt-4">
      <form>
        <div className="flex justify-between mb-4">
          <label htmlFor="password">Nova senha</label>
          <button className="text-secondary font-semibold">Cancelar</button>
        </div>
        <Input className="mb-8" id="password" placeholder="********" />
        <label className="mb-4" htmlFor="password-confirmation">Confirme sua senha</label>
        <Input className="mb-8" id="password-confirmation" placeholder="********"/>
        <Button text="Salvar"></Button>
      </form>
    </div>
  );
};

export default ChangePassword;
