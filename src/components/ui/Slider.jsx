// components/ui/Slider.jsx
import React from 'react';

const Slider = ({ value, onValueChange, min, max, step, className }) => {
  const handleChange = (e) => {
    onValueChange([Number(e.target.value)]);
  };

  return (
    <input
      type="range"
      value={value[0]}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      className={`w-full ${className}`}
    />
  );
};

export default Slider;
