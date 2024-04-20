import Image from "next/image";
import { PiForkKnife } from "react-icons/pi";
import { IconContext } from "react-icons";
// import PeopleCookingImg from "./../public/people-cooking.svg"

export default function Home() {
	return (
		<div className="bg-primary flex items-center flex-col px-5">
			<main className="flex items-center flex-col text-center w-full">
				<Image src="/yellow-wave.svg" width={400} height={180} alt="test" className="absolute left-0" />
				<Image src="/people-cooking.svg" width={250} height={200} alt="test" className="mt-24 z-10" />
				<h1 className="font-semibold mt-16">ChefinhoIA</h1>
				<article className="mt-4 w-60">
					<p>
						Utilize ingredientes que
						possuí em casa para criar
						receitas incríveis
					</p>
				</article>
				<button className="bg-secondary w-full mt-24 py-4 text-white rounded-2xl
					border-none shadow-[0px_0px_10px_rgba(3,3,3,0.1) font-semibold">
						Começar
				</button>
			</main>
			<form className="mt-12 w-full flex flex-col">
				<div className="bg-tertiary px-8 py-4 rounded-full self-start">1</div>
				<label className="secondary-header py-3">Adicione ingredientes que você possuí em casa</label>
				<div class="relative">
					<input className="w-full global-input"
						id="ingredientes" type="string" placeholder="Digite Seus Ingredientes" />
					<div class="icon-div-for-input">
						<Image src="/fork-knife.svg" width={24} height={24} alt="Fork Icon" />
					</div>
				</div>
			</form>
		</div>
	);
}