"use client";

import React, { useState } from "react";
import EditProfileField from "../components/EditProfileField/EditProfileField";
import Link from "next/link";
import ChangePassword from "../components/ChangePassword/ChangePassword";
import { useUserStore } from "../store/user";
import { Timestamp } from "firebase/firestore";

const Profile = () => {
  const [editName, setEditName] = useState<boolean>(false);
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const { user } = useUserStore();
  const handleEditNameBtnClick = () => {
    setEditName(!editName);
  };
  const toggleChangePassword = () => {
    setChangePassword(!changePassword);
  };

  const handleEditNameOpen = () => {
    setEditName(false);
  };

  if (!user) {
    return null;
  }
  // TODO: get remaining days from expiration date
  const remainingDays = user?.plan?.updatedAt instanceof Timestamp ? user.plan.updatedAt.toDate().getUTCDate() : 0;
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
          {!editName ? (
            <p>{user.name}</p>
          ) : (
            <EditProfileField
              handleOpen={handleEditNameOpen}
              value={user.name}
            />
          )}
        </div>
        <div>
          <p className="font-bold">Email</p>
          <p>{user.email}</p>
        </div>
        <div className="flex w-full justify-between">
          <div>
            <p className="font-bold">Plano</p>
            <p>{user.plan.name}</p>
            <p>
              {user.plan.recipesCount} receitas restantes (Renova em{" "}
              {remainingDays.toString()} dias)
            </p>
          </div>
          <Link
            href={"/plans"}
            className="text-secondary font-semibold no-underline text-left nowrap"
          >
            Mudar Plano
          </Link>
        </div>
        {!changePassword ? (
          <button
            onClick={toggleChangePassword}
            className="text-secondary font-semibold w-fit"
          >
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
