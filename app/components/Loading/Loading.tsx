import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LoadingProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export default function Loading({
  title = 'Aguarde enquanto criamos sua receita',
  subtitle = 'O Chefinho está montando a melhor opção com base nos seus ingredientes.',
  compact = false,
}: LoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center overflow-hidden ${
        compact ? 'min-h-0 py-2' : 'min-h-[50vh]'
      }`}
    >
      <h1 className="text-center text-2xl font-normal max-w-xl">{title}</h1>
      <p className="mt-3 max-w-xl text-center text-sm text-gray-500">{subtitle}</p>
      <div className={compact ? 'w-full max-w-xs' : ''}>
        <DotLottieReact
          src="https://lottie.host/a4c75b0a-3bad-4479-80d9-8705fabc20f7/JK7A6PJh1v.json"
          loop
          autoplay
        />
      </div>
    </div>
  );
}