import React from "react";

const Profile = () => {
  return (
    <main className="container flex flex-col items-start mt-8 mx-auto">
      <h1 className="self-center">Perfil</h1>
      <div className="flex flex-col w-full gap-6">
        <div className="flex w-full justify-between">
          <div>
            <p className="font-bold">Nome</p>
            <p>Lucas Pineda</p>
          </div>
          <button className="text-secondary font-semibold">Editar</button>
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
          <button className="text-secondary font-semibold">Mudar Plano</button>
        </div>
        <button className="text-secondary font-semibold">Mudar senha</button>
      </div>
    </main>
  );
};

export default Profile;
