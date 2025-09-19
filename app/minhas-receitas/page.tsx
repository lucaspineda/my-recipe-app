'use client';

import React from 'react';

export default function MinhasReceitas() {
  return (
    <div className="flex justify-center">
      <main className="container flex flex-col">
        <div className="flex flex-col items-center mt-8 text-center">
          <h1>Minhas Receitas</h1>
          <p>Aqui você encontrará todas as suas receitas salvas</p>
        </div>
        <section className="flex flex-col gap-8 mt-8">
          {/* Conteúdo das receitas será adicionado aqui */}
          <div className="bg-white rounded-md py-8 px-8 text-center">
            <p className="text-gray-600">Você ainda não tem receitas salvas.</p>
            <p className="text-gray-600 mt-2">Crie uma receita e salve para vê-la aqui!</p>
          </div>
        </section>
      </main>
    </div>
  );
}