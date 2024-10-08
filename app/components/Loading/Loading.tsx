import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>Estamos preparando sua receita...</h1>
      <div style={{ width: '800px', height: '800px', marginTop: '0px' }}>
        <DotLottieReact
          src="https://lottie.host/2a148cbb-fe2a-485e-969b-7541d1e17c43/lMyi1GPamG.json"
          loop
          autoplay
        />
      </div>
    </div>
  );
}