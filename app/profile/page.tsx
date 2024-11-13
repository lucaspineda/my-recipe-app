"use client";

import React, { useState } from "react";
import EditProfileField from "../components/EditProfileField/EditProfileField";
import Link from "next/link";
import ChangePassword from "../components/ChangePassword/ChangePassword";

const Profile = () => {
  const [editName, setEditName] = useState<boolean>(false);
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const handleEditNameBtnClick = () => {
    setEditName(!editName);
  };
  const toggleChangePassword = () => {
    setChangePassword(!changePassword);
  };
  return (
    <main className="container flex flex-col items-start mt-8 mx-auto">
      <h1 className="self-center">Perfil</h1>
      <div className="flex flex-col w-full gap-6">
        <div className="flex flex-col">
          <div className="flex justify-between w-full">
            <p className="font-bold">Nome</p>
            <button
              className="text-secondary font-semibold"
              onClick={handleEditNameBtnClick}
            >
              {!editName ? "Editar" : "Cancelar"}
            </button>
          </div>
          {!editName ? <p>Lucas Pineda</p> : <EditProfileField />}
        </div>
        <div>
          <p className="font-bold">Email</p>
          <p>lucas.pineda@hotmail.com</p>
        </div>
        <div className="flex w-full justify-between">
          <div>
            <p className="font-bold">Plano</p>
            <p>Gold</p>
          </div>
          <Link
            href={"/plans"}
            className="text-secondary font-semibold no-underline"
          >
            Mudar Plano
          </Link>
        </div>
        {!changePassword ? (
          <button onClick={toggleChangePassword} className="text-secondary font-semibold w-fit">
            Mudar senha
          </button>
        ) : (
          <ChangePassword toggleChangePassword={toggleChangePassword} />
        )}
      </div>
    </main>
  );
};

export default Profile;