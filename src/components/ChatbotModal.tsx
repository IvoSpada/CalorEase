import React from 'react';

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatbotModal: React.FC<ChatbotModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null; // Si el modal no está abierto, no renderiza nada.

  return (
    <div className="modal">
      <div className="modal-content">
        <button onClick={onClose}>Cerrar</button>
        <p>Este es el modal del chatbot</p>
      </div>
    </div>
  );
};

export default ChatbotModal;
