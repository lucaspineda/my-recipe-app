import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="p-6 fixed inset-0 flex items-center justify-center z-10">
      <div className="fixed inset-0 bg-black opacity-80" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-lg p-6 z-10 text-center">
        {children}
      </div>
    </div>
  );
};

export default Modal;