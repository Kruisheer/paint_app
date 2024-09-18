import { useState, useRef, useEffect } from 'react';
import { Button } from "/components/ui/button";
import { Card } from "/components/ui/card";
import { CardContent } from "/components/ui/card";
import { CardHeader } from "/components/ui/card";
import { CardTitle } from "/components/ui/card";

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
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 5;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 100; // Subtracting 100px for the color buttons
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const handleMouseDown = (e) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  return (
    <div ref={containerRef} className="flex flex-col h-screen">
      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Painting App</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </CardContent>
      </Card>
      <div className="flex justify-center space-x-2 p-4">
        {colors.map((colorOption) => (
          <Button
            key={colorOption.name}
            variant={colorOption.value === color ? 'default' : 'outline'}
            onClick={() => setColor(colorOption.value)}
            className="w-20"
          >
            {colorOption.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PaintingApp;
