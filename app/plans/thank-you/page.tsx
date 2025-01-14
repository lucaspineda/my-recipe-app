import Link from 'next/link';
import React from 'react';

const ThankYouPage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1 className='mb-4'>Plano acionado com sucesso 🎉</h1>
      <p>Agora você terá acesso as novas funcionalidades do seu plano.</p>
      <Link href="/recipe">Clique aqui</Link> para continuar usando o CHEFINHO IA
    </div>
  );
};

export default ThankYouPage;