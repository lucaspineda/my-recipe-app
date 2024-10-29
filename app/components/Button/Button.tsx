import React from "react";

interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  text: string;
}

export default function Button({ text, className, ...rest }: ButtonProps) {
  return (
    <button
      className={`bg-secondary w-full py-4 text-white rounded-2xl border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1)
        font-semibold  ${className}`}
      {...rest}
    >
      {text}
    </button>
  );
}
