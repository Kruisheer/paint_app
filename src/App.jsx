import { useState, useRef, useEffect } from "react";
import Button from "./components/ui/Button";  // Correct relative path
import Card from "./components/ui/Card";      // Correct relative path
import CardContent from "./components/ui/CardContent"; // Ensure these components exist
import CardHeader from "./components/ui/CardHeader";   // Ensure these components exist
import CardTitle from "./components/ui/CardTitle";     // Ensure these components exist
import Label from "./components/ui/Label";             // Correct relative path

const colors = [
  { name: 'Red', value: 'red' },
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Black', value: 'black' },
];

const PaintingApp = () => {
  const [color, setColor] = useState('black');
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const headerHeight = 60; // Approximate height of the color buttons
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight - headerHeight,
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Clear canvas and redraw when size changes
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
  }, [canvasSize]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    setDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-center space-x-2 p-2 bg-gray-100">
        {colors.map((colorOption) => (
          <Button
            key={colorOption.name}
            variant={colorOption.value === color ? 'default' : 'outline'}
            onClick={() => setColor(colorOption.value)}
            className="w-16 h-8 text-xs"
          >
            {colorOption.name}
          </Button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="flex-grow touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
};

export default PaintingApp;
