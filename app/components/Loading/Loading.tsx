import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] overflow-hidden">
      <h1 className="text-center text-2xl font-normal">Aguarde enquanto criamos 
      a receita pra você</h1>
      <div>
        <DotLottieReact
          src="https://lottie.host/a4c75b0a-3bad-4479-80d9-8705fabc20f7/JK7A6PJh1v.json"
          loop
          autoplay
        />
      </div>
    </div>
  );
}