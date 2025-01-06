import { Loader2 } from "lucide-react";
import React from "react";

interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  text: string;
  loading?: boolean;
}
// Todo: Refactor to have a color prop
export default function Button({
  text,
  loading,
  className = "bg-secondary",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`flex justify-center gap-2 w-full py-4 text-white rounded-lg border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1)
        font-semibold ${className}`}
      disabled={loading}
      {...rest}
    >
      {loading && <Loader2 className="animate-spin" />}

      {text}
    </button>
  );
}
