import React from "react";

export default function Button({text}) {
  return (
    <button
      className="bg-secondary w-full mt-12 py-4 text-white rounded-2xl
					border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold"
    >
      {text}
    </button>
  );
}
