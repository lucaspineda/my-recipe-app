'use client'

import React, { useState } from "react";
import Button from "../Button/Button";
import Input from "../Input/Input";

interface EditProfileFieldProps {}

const EditProfileField = () => {
  return (
    <div className="w-full pt-4">
      <Input value={'Lucas Pineda'}/>
      <Button className="mt-4" text="Salvar"></Button>
    </div>
  );
};

export default EditProfileField;
