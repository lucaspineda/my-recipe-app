import React, { useRef, useEffect } from "react";

export function useClickOutside(callback: () => void) {
  const ref = useRef(null);

  const clickHandler = (event: Event) => {
    console.log(event.target, ref.current);
    if (ref.current && !ref.current.contains(event.target)) {
      callback();
    }
  };

  // Add event listener on component mount
  useEffect(() => {
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, []);

  return ref;
}
