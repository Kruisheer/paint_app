// src/components/ui/Button.jsx
import React from 'react';

const Button = ({ children, onClick, variant }) => {
  const buttonClass = variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black';
  return (
    <button
      className={`${buttonClass} p-2 rounded`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
