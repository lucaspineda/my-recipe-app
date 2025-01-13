import Image from 'next/image';

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/5511976783992"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-transform transform hover:scale-110"
    >
      <Image
        src="/images/whats-app-white.svg"
        alt="WhatsApp"
        width={68} 
        height={40} 
        priority 
        className="w-50 h-50"
      />
    </a>
  );
};

export default WhatsAppButton;