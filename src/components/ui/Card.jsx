// src/components/ui/Card.jsx
import React from 'react';

const Card = ({ children, className }) => {
  return (
    <div className={`shadow-lg p-4 rounded-lg ${className}`}>
      {children}
    </div>
  );
};

export default Card;
