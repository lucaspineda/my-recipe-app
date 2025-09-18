export default function Privacy() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Política de Privacidade – Chefinho IA</h1>
      <p className="text-gray-600 mb-4">Última atualização: 29 de agosto de 2025</p>

      <p className="mb-8">
        A sua privacidade é importante para nós. Esta Política de Privacidade explica como o Chefinho IA coleta, utiliza e protege as informações pessoais dos usuários.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Informações que Coletamos</h2>
        <p className="mb-4">Ao utilizar o Chefinho IA, podemos coletar:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Dados de cadastro/login: nome, e-mail e informações fornecidas por provedores de login social (Google, Facebook, etc.).</li>
          <li>Dados de uso do serviço: receitas criadas, interações no site, preferências.</li>
          <li>Dados técnicos: endereço IP, tipo de dispositivo/navegador, cookies e identificadores de sessão.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Como Utilizamos os Dados</h2>
        <p className="mb-4">As informações coletadas podem ser usadas para:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Autenticação e login na plataforma.</li>
          <li>Personalizar receitas e recomendações.</li>
          <li>Melhorar o serviço, analisando estatísticas de uso, erros e bugs.</li>
          <li>Enviar comunicações e campanhas de marketing, quando autorizado pelo usuário.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Compartilhamento com Terceiros</h2>
        <p className="mb-4">O Chefinho IA utiliza serviços de terceiros para operar corretamente e melhorar a experiência do usuário. Os dados podem ser processados por:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Firebase (Google) – autenticação, banco de dados, hospedagem e armazenamento.</li>
          <li>Microsoft Clarity – análise de uso e comportamento no site.</li>
          <li>Google Analytics – estatísticas de navegação e performance.</li>
          <li>Sentry – monitoramento e correção de erros.</li>
          <li>Stripe – processamento de pagamentos de forma segura.</li>
        </ul>
        <p className="mt-4">
          Esses serviços possuem suas próprias políticas de privacidade e seguem práticas de segurança para proteger as informações.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Retenção e Exclusão de Dados</h2>
        <p>Os dados são mantidos enquanto a conta do usuário estiver ativa ou conforme necessário para o funcionamento do serviço.</p>
        <p className="mt-2">
          O usuário pode solicitar a exclusão da conta e dos dados pessoais enviando um e-mail para:{' '}
          <a href="mailto:lucas.pineda@hotmail.com" className="text-blue-600 hover:underline">
            lucas.pineda@hotmail.com
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Segurança</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Adotamos medidas técnicas e organizacionais para proteger os dados contra acessos não autorizados, alterações ou destruição.</li>
          <li>Apesar disso, nenhum sistema é 100% seguro, e não podemos garantir segurança absoluta.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Direitos do Usuário</h2>
        <p className="mb-4">O usuário tem direito a:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Acessar os dados pessoais armazenados.</li>
          <li>Solicitar correção ou atualização.</li>
          <li>Solicitar exclusão de dados.</li>
          <li>Revogar consentimento para o uso de informações em comunicações de marketing.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Alterações nesta Política</h2>
        <p>
          Podemos atualizar esta Política de Privacidade periodicamente. A versão mais recente estará sempre disponível em nosso site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Contato</h2>
        <p>
          Em caso de dúvidas sobre esta Política de Privacidade, entre em contato:<br />
          📧 <a href="mailto:lucas.pineda@hotmail.com" className="text-blue-600 hover:underline">lucas.pineda@hotmail.com</a>
        </p>
      </section>
    </main>
  );
}
