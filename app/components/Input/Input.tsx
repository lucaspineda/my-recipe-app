import Image from "next/image";
import { HTMLAttributes, HTMLInputTypeAttribute, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  imgSource?: string;
  imgAlt?: string;
  placeholder?: string;
}

export default function Input({
  onChange,
  id,
  placeholder,
  imgSource,
  imgAlt,
  ...rest
}: InputProps) {
  return (
    <div className="relative">
      <input
        onChange={onChange}
        className="global-input"
        id={id}
        type="string"
        placeholder={placeholder}
        {...rest}
      />
      {imgSource && (
        <div className="icon-div-for-input">
          <Image src={imgSource} width={24} height={24} alt={imgAlt} />
        </div>
      )}
    </div>
  );
}
