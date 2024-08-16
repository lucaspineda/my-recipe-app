import Image from "next/image";

export default function Input({ id, placeholder, imgSource, imgAlt }) {
  return (
    <div className="relative">
      <input
        className="global-input"
        id={id}
        type="string"
        placeholder={placeholder}
      />
      <div className="icon-div-for-input">
        <Image src={imgSource} width={24} height={24} alt={imgAlt} />
      </div>
    </div>
  );
}