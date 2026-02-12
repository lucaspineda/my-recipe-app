import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="p-4 fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-80" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-lg p-6 z-50 text-center max-h-[85vh] overflow-y-auto w-full max-w-2xl">
        {children}
      </div>
    </div>
  );
};

export default Modal;