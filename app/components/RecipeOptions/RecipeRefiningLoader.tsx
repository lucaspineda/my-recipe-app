'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface Message {
  title: string;
  subtitle: string;
}

interface RecipeRefiningLoaderProps {
  messages: Message[];
  msgIndex: number;
}

export default function RecipeRefiningLoader({ messages, msgIndex }: RecipeRefiningLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <DotLottieReact
        src="https://lottie.host/a4c75b0a-3bad-4479-80d9-8705fabc20f7/JK7A6PJh1v.json"
        loop
        autoplay
        style={{ width: 180, height: 180 }}
      />
      <div className="mt-4 min-h-[60px] flex flex-col items-center text-center">
        <h3 key={msgIndex} className="text-xl font-semibold text-gray-800 animate-fade-in">
          {messages[msgIndex].title}
        </h3>
        <p key={`sub-${msgIndex}`} className="text-sm text-gray-500 mt-2 animate-fade-in">
          {messages[msgIndex].subtitle}
        </p>
      </div>
      <div className="flex gap-1.5 mt-5">
        {messages.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= msgIndex ? 'bg-secondary w-6' : 'bg-gray-200 w-3'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
