import Image from 'next/image';
import React, { forwardRef } from 'react';
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  imgSource?: string;
  imgAlt?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, id, placeholder, imgSource, imgAlt, className, ...rest }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          onChange={onChange}
          className={`global-input ${className}`}
          id={id}
          type="string"
          data-clarity-unmask="true"
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
  },
);

Input.displayName = 'Input'; // Set a display name for debugging

export default Input;
