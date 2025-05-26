"use client";

import React, { InputHTMLAttributes, useState } from "react";
import Button from "../Button/Button";
import Input from "../Input/Input";
import { useUserAuth } from "../../hooks/userAuth";

interface EditProfileFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  handleOpen: () => void;
}

const EditProfileField = ({ handleOpen, ...rest }: EditProfileFieldProps) => {
  const { updateUser, loading, error } = useUserAuth();
  const [value, setValue] = useState<string>(rest.value?.toString());
  const { getUser } = useUserAuth();

  const handleUpdateUsername = async () => {
    const returnValue = await updateUser({ name: value });
    if (returnValue) {
      await getUser();
      handleOpen();
    }
  };

  return (
    <div className="w-full pt-4">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        data-clarity-unmask="true"
        {...rest}
      />
      {error && <span className="text-red-700 text-sm m-2">{error}</span>}
      <Button
        className="mt-4"
        onClick={handleUpdateUsername}
        loading={loading}
      >
        Salvar
      </Button>
    </div>
  );
};

export default EditProfileField;
