import Image from "next/image";
// import PeopleCookingImg from "./../public/people-cooking.svg"

export default function Home() {
  return (
    <div className="bg-primary flex justify-center">
      <Image src="/yellow-wave.svg" width={340} height={180} alt="test" className="absolute left-0"/>
      <Image src="/people-cooking.svg" width={250} height={200} alt="test" className="mt-28 z-10"/>
      <h1>ChefinhoIA</h1>
      <div>
        <h2>
			Utilize ingredientes que
			possuí em casa para criar
			receitas incríveis
        </h2>
      </div>
    </div>
  );
}
